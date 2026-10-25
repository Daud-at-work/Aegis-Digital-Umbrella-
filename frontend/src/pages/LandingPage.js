import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faShieldHalved, faDatabase, faCode, faLock, faMagnifyingGlass, faWandMagicSparkles, faSitemap, faListCheck, faFileLines, faCircleQuestion, faCircleExclamation, faCircleCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { SiteFooter } from "../components/layout/AppChrome";
import { Navigation } from "../components/layout/AppChrome";


export const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const features = [
    { icon: faDatabase, title: "SQL Injection", text: "Check reachable pages and forms for common injection signals, then review the evidence." },
    { icon: faCode, title: "Cross-Site Scripting", text: "Inspect reflected input and browser responses for potential scripting issues." },
    { icon: faShieldHalved, title: "CSRF Protection", text: "Review forms and responses for common request forgery protection indicators." }
  ];
  const steps = [
    { icon: faSitemap, number: "01", title: "Enter an authorized URL", text: "Start with a website you own or have permission to assess." },
    { icon: faListCheck, number: "02", title: "Choose the checks", text: "Select SQL injection, cross-site scripting, and CSRF checks for the scan." },
    { icon: faFileLines, number: "03", title: "Review the report", text: "Read the findings, evidence, risk levels, and suggested next steps." }
  ];
  return <div className="landing-page">
    <Navigation />
    <main>
      <section className="landing-hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> WEB APPLICATION SECURITY</div>
          <h1>See the risks.<br /><span>Strengthen your defenses.</span></h1>
          <p>Assess your web application for common security issues, review the evidence, and get practical guidance to help your team respond.</p>
          <div className="hero-actions"><Link to="/signup" className="primary-action">Start a security scan <FontAwesomeIcon icon={faArrowRight} /></Link><Link to="/about" className="secondary-action">Explore AEGIS</Link></div>
          <div className="hero-note"><FontAwesomeIcon icon={faLock} /> Scan only websites you own or are authorized to assess.</div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a security scan report">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="scan-window"><div className="scan-window-head"><span className="window-dots"><i /><i /><i /></span><span>AEGIS / SECURITY OVERVIEW</span><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
            <div className="scan-score"><div className="score-ring"><FontAwesomeIcon icon={faShieldHalved} /></div><div><small>ASSESSMENT STATUS</small><strong>Ready to review</strong></div><span className="status-chip">ACTIVE</span></div>
            <div className="scan-lines"><div><span><FontAwesomeIcon icon={faDatabase} /> SQL injection checks</span><b>01</b></div><div><span><FontAwesomeIcon icon={faCode} /> Cross-site scripting</span><b>02</b></div><div><span><FontAwesomeIcon icon={faShieldHalved} /> CSRF protection</span><b>03</b></div></div>
            <div className="scan-window-foot"><span>Evidence-led results</span><span><FontAwesomeIcon icon={faWandMagicSparkles} /> Clear recommendations</span></div>
          </div>
          <div className="visual-badge"><span className="badge-icon"><FontAwesomeIcon icon={faLock} /></span><span><small>Built for clarity</small><strong>Findings you can review</strong></span></div>
        </div>
      </section>
      <section id="features" className="landing-features"><div className="section-heading"><span className="eyebrow">WHAT AEGIS CHECKS</span><h2>Practical checks for common web risks</h2><p>Focused assessments help you understand what was checked and what to investigate next.</p></div>
        <div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><span className="feature-icon"><FontAwesomeIcon icon={feature.icon} /></span><h3>{feature.title}</h3><p>{feature.text}</p><Link to="/about">How it works <FontAwesomeIcon icon={faArrowRight} /></Link></article>)}</div>
      </section>
      <section className="how-it-works"><div className="section-heading"><span className="eyebrow">A SIMPLE WORKFLOW</span><h2>From target URL to reviewable results</h2><p>Keep the assessment focused and make each result easier to follow up.</p></div>
        <div className="step-grid">{steps.map((step) => <article className="step-card" key={step.number}><div className="step-top"><span className="step-icon"><FontAwesomeIcon icon={step.icon} /></span><span>{step.number}</span></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </section>
      <section className="results-preview"><div className="results-copy"><span className="eyebrow">A REPORT YOU CAN ACT ON</span><h2>Understand each finding before you prioritize it.</h2><p>Scan results bring the target, risk summary, detected issues, and remediation guidance together in one place.</p><ul><li><FontAwesomeIcon icon={faCircleCheck} /> Finding descriptions and evidence</li><li><FontAwesomeIcon icon={faCircleCheck} /> Risk level summaries</li><li><FontAwesomeIcon icon={faCircleCheck} /> Practical remediation recommendations</li></ul></div><div className="report-card"><div className="report-head"><span><FontAwesomeIcon icon={faFileLines} /> SCAN REPORT</span><span className="report-state">REVIEW</span></div><div className="report-target"><small>TARGET</small><strong>your-authorized-site.example</strong></div><div className="report-summary"><div><strong>Findings</strong><b>Review</b></div><div><strong>Risk levels</strong><b>Prioritize</b></div><div><strong>Recommendations</strong><b>Remediate</b></div></div><p className="report-footnote">Illustrative preview. Actual results depend on the target and selected checks.</p></div></section>
      <section className="scope-note"><FontAwesomeIcon icon={faCircleExclamation} /><div><strong>Know what an automated scan can tell you.</strong><p>AEGIS checks for selected vulnerability signals on pages it can reach. Results can include false positives or miss issues; manually verify findings and use a full security assessment for high assurance.</p></div></section>
      <section className="faq-section"><div className="faq-heading"><span className="faq-label"><FontAwesomeIcon icon={faCircleQuestion} /> FAQ</span><h2>Frequently asked questions</h2><p>Everything you need to know before your first security scan.</p></div><div className="faq-list">{[
        ["Which websites can I scan?", "Only scan websites you own or have explicit authorization to assess. Make sure your permission covers automated testing."],
        ["What does AEGIS check?", "Choose from SQL injection, cross-site scripting, and CSRF checks. The scan reviews reachable pages and forms for selected vulnerability signals."],
        ["Does a clean scan prove my site is secure?", "No. Automated checks cover a limited set of signals and can miss vulnerabilities. A clean result is not a guarantee that a site is secure."],
        ["What does the report include?", "The report summarizes detected issues, risk levels, available evidence, and recommendations to guide manual review and remediation."],
        ["Can scan results include false positives?", "Yes. Treat findings as leads to investigate and verify them in the context of your application before making changes."]
      ].map(([question, answer], index) => <article className={`faq-item ${openFaq === index ? "is-open" : ""}`} key={question}><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><FontAwesomeIcon icon={faChevronDown} /></button>{openFaq === index && <p>{answer}</p>}</article>)}</div><p className="faq-support">Need more help? <Link to="/contact">Contact support</Link> or <Link to="/signup">start a scan</Link>.</p></section>
      <section className="landing-bottom-cta"><div><span className="eyebrow">START WITH A CLEAR VIEW</span><h2>Make your next security decision with better context.</h2></div><Link to="/signup" className="primary-action">Create your account <FontAwesomeIcon icon={faArrowRight} /></Link></section>
    </main>
    <SiteFooter />
  </div>;
};
