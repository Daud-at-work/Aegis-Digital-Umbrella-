"""Text normalization and output sanitization helpers."""

import html
import logging
import re

logger = logging.getLogger(__name__)

def format_chat_response(response: str) -> str:
    """Convert model output to readable plain text without Markdown symbols."""
    text = re.sub(r"```(?:[^\n]*)\n?([\s\S]*?)```", r"\1", response or "")
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"(?m)^\s*(?:[-+*]|\d+[.)])\s*", "", text)
    for bullet in (chr(0x2022), chr(0x25cf), chr(0x25aa), chr(0x00e2) + chr(0x20ac) + chr(0xa2)):
        text = text.replace(bullet, " ")
    text = re.sub(r"(?m)^\s*(?:[-+*]\s+|\d+[.)]\s+)", "", text)
    text = re.sub(r"[*$&|\\#`_]", " ", text)
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n\n".join(line for line in lines if line)

def sanitize_url(url: str) -> str:
    """Remove trailing backslashes and normalize URL."""
    return url.rstrip('/\\').replace('\\', '/')

def clean_recommendation_text(text: str) -> str:
    """Remove Markdown and escaped formatting while keeping recommendation wording."""
    text = html.unescape(text or "")
    text = re.sub(r"\\([\\`*_{}\[\]()#+.!|>~-])", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"(?m)^\s*(?:[-+*]|\d+[.)])\s*", "", text)
    for bullet in (chr(0x2022), chr(0x25cf), chr(0x25aa), chr(0x00e2) + chr(0x20ac) + chr(0xa2)):
        text = text.replace(bullet, " ")
    text = re.sub(r"[*_`#]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def sanitize_text_for_pdf(text: str) -> str:
    """Sanitize text for ReportLab by removing HTML tags and special characters."""
    if not text:
        return "No content available"
    try:
        # Log raw text for debugging
        logger.debug(f"Raw text before sanitization: {text[:200]}")
        
        # Remove HTML tags using regex
        clean_text = clean_recommendation_text(text)
        clean_text = re.sub(r'<[^>]+>', '', clean_text)
        # Escape remaining HTML entities
        clean_text = html.escape(clean_text)
        # Replace problematic characters
        clean_text = clean_text.replace('\r', '').replace('\n', ' ').replace('\t', ' ')
        # Remove control characters
        clean_text = re.sub(r'[\x00-\x1F\x7F]', '', clean_text)
        # Truncate to avoid overwhelming ReportLab
        clean_text = clean_text[:1000]
        # Log sanitized text
        logger.debug(f"Sanitized text: {clean_text[:200]}")
        return clean_text if clean_text.strip() else "No content available"
    except Exception as e:
        logger.error(f"Sanitization error: {str(e)}")
        return "Error processing content"

