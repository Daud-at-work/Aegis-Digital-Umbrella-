"""Bounded website checks and AI response services."""

import asyncio
import html
import logging
import os
import re
import uuid
from typing import List, Tuple
from urllib.parse import parse_qs, urlencode, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from ..core import (LlmChat, UserMessage, VulnerabilityResult, clean_recommendation_text, format_chat_response)

def run_three_type_scan(url: str) -> Tuple[List[VulnerabilityResult], int, int]:
    """Run bounded, non-destructive checks for SQL errors, reflected HTML, and CSRF tokens."""
    session = requests.Session()
    session.headers.update({"User-Agent": "AegisSecurityScanner/1.0"})
    root = urlparse(url)

    def is_in_scope(candidate_url: str) -> bool:
        candidate = urlparse(candidate_url)
        root_host = (root.hostname or "").lower().removeprefix("www.")
        candidate_host = (candidate.hostname or "").lower().removeprefix("www.")
        if not root_host or candidate_host != root_host:
            return False
        if root.port is not None:
            return candidate.port == root.port
        return candidate.port in (None, 80, 443)

    pages = []
    forms = []
    seen = set()
    pending = [url]
    blocked_path = re.compile(r"/(?:logout|delete|remove|checkout|purchase)(?:/|$)", re.I)
    static_file = re.compile(r"\.(?:pdf|png|jpe?g|gif|svg|webp|css|js|zip|gz|mp4|woff2?)(?:$)", re.I)

    max_pages = 100
    max_page_bytes = 1_500_000
    while pending and len(pages) < max_pages:
        page_url = pending.pop(0)
        parsed = urlparse(page_url)
        if parsed.scheme not in ("http", "https") or not is_in_scope(page_url) or blocked_path.search(parsed.path):
            continue
        if page_url in seen:
            continue
        seen.add(page_url)
        try:
            response = session.get(page_url, timeout=8, allow_redirects=True, stream=True)
            if not is_in_scope(response.url):
                response.close()
                continue
            content_type = response.headers.get("Content-Type", "").lower()
            if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                response.close()
                continue
            content_length = response.headers.get("Content-Length")
            try:
                oversized_response = content_length and int(content_length) > max_page_bytes
            except ValueError:
                oversized_response = False
            if oversized_response:
                response.close()
                continue
            chunks = []
            body_size = 0
            for chunk in response.iter_content(chunk_size=16384):
                body_size += len(chunk)
                if body_size > max_page_bytes:
                    break
                chunks.append(chunk)
            response.close()
            if body_size > max_page_bytes:
                continue
            try:
                page_html = b"".join(chunks).decode(response.encoding or "utf-8", errors="replace")
            except LookupError:
                page_html = b"".join(chunks).decode("utf-8", errors="replace")
        except requests.RequestException as exc:
            logging.info("Skipped unreachable scanner page %s: %s", page_url, exc)
            continue
        pages.append((response.url, page_html, response.headers))
        soup = BeautifulSoup(page_html, "html.parser")
        for form in soup.find_all("form"):
            action = urljoin(response.url, form.get("action") or response.url)
            action_parts = urlparse(action)
            if action_parts.scheme in ("http", "https") and is_in_scope(action):
                forms.append((action, form))
        for link in soup.find_all("a", href=True):
            candidate = urljoin(response.url, link["href"])
            candidate_parts = urlparse(candidate)
            if candidate_parts.scheme not in ("http", "https"):
                continue
            candidate = candidate_parts._replace(fragment="").geturl()
            candidate_parts = urlparse(candidate)
            if is_in_scope(candidate) and candidate not in seen and not blocked_path.search(candidate_parts.path) and not static_file.search(candidate_parts.path) and len(pending) < 500:
                pending.append(candidate)

    findings = []
    sql_errors = re.compile(
        r"SQL syntax.*(?:MySQL|MariaDB)|(?:PostgreSQL|pg_query).*error|SQLite(?:Exception| error)|"
        r"SQL Server.*(?:error|exception)|ORA-\d{4,5}|ODBC SQL Server Driver",
        re.I | re.S,
    )
    scan_targets = {}
    for page_url, _, _ in pages:
        page_parameters = parse_qs(urlparse(page_url).query, keep_blank_values=True)
        if page_parameters:
            scan_targets[("GET", page_url)] = page_parameters
    for action, form in forms:
        method = (form.get("method") or "get").upper()
        if method not in ("GET", "POST") or blocked_path.search(urlparse(action).path):
            continue
        form_parameters = {}
        for field in form.find_all(["input", "textarea", "select"]):
            name = field.get("name")
            field_type = (field.get("type") or "text").lower()
            if not name or field_type in ("file", "submit", "button", "image", "reset", "password"):
                continue
            value = field.get("value", "aegis-test")
            if field.name == "textarea":
                value = field.get_text() or "aegis-test"
            elif field.name == "select":
                option = field.find("option", selected=True) or field.find("option")
                value = option.get("value", option.get_text()) if option else "aegis-test"
            form_parameters[name] = [value]
        if form_parameters:
            key = (method, action)
            scan_targets[key] = {**scan_targets.get(key, {}), **form_parameters}

    tested_fields = 0
    csrf_tokens = re.compile(r"csrf|xsrf|authenticity[_-]?token|requestverificationtoken", re.I)
    for (method, target), parameters in scan_targets.items():
        parsed = urlparse(target)
        for name, values in list(parameters.items())[:8]:
            if tested_fields >= 100:
                break
            if csrf_tokens.search(name):
                continue
            tested_fields += 1
            original = str(values[0]) if values else ""
            probe_values = [original + "'", original + "\"", original + "' AND '1'='1", original + "' AND '1'='2"]
            responses = []
            for probe in probe_values:
                changed = dict(parameters)
                changed[name] = [probe]
                try:
                    if method == "GET":
                        probe_url = parsed._replace(query=urlencode(changed, doseq=True)).geturl()
                        response = session.get(probe_url, timeout=8, allow_redirects=True)
                    else:
                        response = session.post(target, data={key: val[0] for key, val in changed.items()}, timeout=8, allow_redirects=True)
                    responses.append(response)
                except requests.RequestException:
                    responses.append(None)
            error_response = next((r for r in responses[:2] if r is not None and sql_errors.search(r.text)), None)
            if error_response:
                findings.append(VulnerabilityResult(
                    type="SQL Injection", severity="High", location=target,
                    description=f"A database error was exposed after changing form or query parameter '{name}'.",
                    evidence=sql_errors.search(error_response.text).group(0)[:240],
                    recommendation="Use parameterized queries or prepared statements, validate inputs, and return generic database errors."
                ))
            elif all(responses[2:]) and responses[2].status_code == responses[3].status_code:
                true_body, false_body = responses[2].text, responses[3].text
                difference = abs(len(true_body) - len(false_body)) / max(len(true_body), len(false_body), 1)
                if difference > 0.65:
                    findings.append(VulnerabilityResult(
                        type="SQL Injection", severity="Medium", location=target,
                        description=f"Boolean SQL probes caused a large response change for query parameter '{name}'. This is a heuristic finding.",
                        evidence=f"True/false probe response lengths: {len(true_body)} and {len(false_body)} characters.",
                        recommendation="Review this parameter's database access and use parameterized queries. Manually confirm the result before treating it as exploitable."
                    ))

            marker = "aegisprobe" + uuid.uuid4().hex[:12]
            xss_probe = f'"><svg onload="void(0)" data-aegis="{marker}"></svg>'
            changed = dict(parameters)
            changed[name] = [xss_probe]
            try:
                if method == "GET":
                    probe_url = parsed._replace(query=urlencode(changed, doseq=True)).geturl()
                    response = session.get(probe_url, timeout=8, allow_redirects=True)
                else:
                    response = session.post(target, data={key: val[0] for key, val in changed.items()}, timeout=8, allow_redirects=True)
                reflected = re.search(rf"<svg[^>]*onload=[\"']?void\(0\)[\"']?[^>]*data-aegis=[\"']?{marker}", response.text, re.I)
            except requests.RequestException:
                reflected = None
            if reflected:
                findings.append(VulnerabilityResult(
                    type="Cross-Site Scripting", severity="Medium", location=target,
                    description=f"A harmless SVG event-handler probe from form or query parameter '{name}' was reflected without HTML encoding.",
                    evidence=reflected.group(0)[:240],
                    recommendation="HTML-encode untrusted output for its context and use a maintained output-encoding library. Verify the issue in a browser before prioritizing it."
                ))

    for action, form in forms:
        if (form.get("method") or "get").lower() not in ("post", "put", "patch", "delete"):
            continue
        token_found = any(csrf_tokens.search(field.get("name", "")) or csrf_tokens.search(field.get("id", "")) for field in form.find_all(["input", "textarea"]))
        if not token_found:
            findings.append(VulnerabilityResult(
                type="CSRF Protection", severity="Medium", location=action,
                description="A state-changing form has no recognizable anti-CSRF token. Custom protections may not be detected.",
                evidence=f"Form method: {(form.get('method') or 'get').upper()}; fields: {', '.join(field.get('name', '') for field in form.find_all(['input', 'textarea']) if field.get('name'))[:200] or 'none'}",
                recommendation="Add a server-validated unpredictable CSRF token, set SameSite cookie attributes, and verify Origin or Referer on state-changing requests."
            ))

    unique = {}
    for finding in findings:
        unique[(finding.type, finding.location, finding.description)] = finding
    logging.info("Scanner visited %s pages and tested %s input fields for %s", len(pages), tested_fields, url)
    return list(unique.values()), len(pages), tested_fields

async def run_vulnerability_scan(url: str):
    findings, scanned_pages, tested_parameters = await asyncio.to_thread(run_three_type_scan, url)
    logging.info("Built-in scanner found %s findings for %s", len(findings), url)
    return findings, scanned_pages, tested_parameters

async def generate_ai_recommendations(vulnerabilities: List[VulnerabilityResult]) -> List[str]:
    """Generate AI-powered remediation recommendations."""
    if not vulnerabilities:
        logging.info("No vulnerabilities found, skipping AI recommendations")
        return []
    try:
        vuln_summary = [f"{vuln.type.upper()} - {vuln.severity}: {vuln.description} at {vuln.location}" for vuln in vulnerabilities]
        vulnerability_text = "\n".join(vuln_summary)
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=f"vulnerability_analysis_{uuid.uuid4()}",
            system_message="""You are a cybersecurity expert specializing in web application security. 
            Analyze vulnerability scan results and provide specific, actionable remediation recommendations.
            Focus on practical steps developers can take to fix each vulnerability type."""
        ) # Initialized with default model (Gemini 3 Flash)
        
        user_message = UserMessage(
            text=f"""Analyze these web application vulnerabilities and provide 5-7 specific, actionable remediation recommendations:

{vulnerability_text}

Please provide practical, developer-friendly recommendations that address:
1. Immediate fixes for high-severity issues
2. Input validation and sanitization strategies
3. Security configuration improvements
4. Code-level changes needed
5. Long-term security hardening measures

Write each recommendation as a short, natural-language paragraph. Explain the action and reason in ordinary words. Do not use Markdown, bullet characters, asterisks, backticks, code snippets, regex examples, or raw URLs. Keep standard punctuation and the names of relevant security tools or libraries."""
        )
        response = await chat.send_message(user_message)
        # Pass multiline behavior as a flag; an inline (?m) inside an alternation
        # raises ``global flags not at the start`` and used to discard every result.
        raw_recommendations = re.split(
            r"\n\s*\n|^\s*(?=[\u2022\u25cf\u25aa]|\d+[.)]\s|[-*+]\s)",
            response or "",
            flags=re.MULTILINE,
        )
        recommendations = [clean_recommendation_text(item) for item in raw_recommendations]
        return [item for item in recommendations if item][:7]
    except Exception as e:
        logging.error(f"AI recommendation generation failed: {e}")
        return []

async def generate_chatbot_response(message: str, user_id: str = None) -> str:
    """Generate chatbot responses for user queries."""
    try:
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=f"chatbot_{user_id or uuid.uuid4()}",
            system_message="""You are AEGIS AI, an assistant focused on cybersecurity, ethical hacking, information technology, web and network security, OWASP guidance, vulnerability assessment, penetration testing in authorized environments, and secure coding. Answer the user's exact question directly with accurate, practical explanations at the level they need. Prioritize relevant topics such as OWASP Top 10, application security, networking, identity and access, incident response, and defensive security. Only support authorized and defensive security work. Do not invent scan results, account details, or actions that were not provided. Avoid generic checklists, unrelated warnings, and unnecessary follow-up questions. Write only in plain text. Do not use Markdown, headings, bullets, tables, code fences, asterisks, dollar signs, ampersands, pipe characters, backslashes, or hash symbols. Use short natural paragraphs and ordinary punctuation."""
        ) # Initialized with default model (Gemini 3 Flash)
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        logging.info(f"Generated response for user {user_id or 'anonymous'}")
        if response.startswith("[ERROR]"):
            return "AEGIS AI is temporarily unavailable. Please try again shortly."
        return format_chat_response(response)
    except ValueError as e:
        logging.error(f"Configuration error: {str(e)}")
        return "AEGIS AI is not configured. Please check its Gemini API key."
    except Exception as e:
        logging.error(f"Chatbot error - {type(e).__name__}: {str(e)}")
        if "authentication failed" in str(e).lower():
            return "AEGIS AI could not authenticate with Gemini. Please check the Gemini API key in backend configuration."
        return "AEGIS AI is temporarily unavailable. Please try again shortly."

