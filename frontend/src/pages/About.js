import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faBullseye, faDatabase, faCode, faLock, faLightbulb, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { Navigation, SiteFooter } from "../components/layout/AppChrome";

const checks = [
  { icon: faDatabase, title: "SQL injection indicators", text: "Review safe input probes and database error signals for possible injection issues." },
  { icon: faCode, title: "Reflected XSS indicators", text: "Check whether harmless test values return in a page without HTML encoding." },
  { icon: faLock, title: "CSRF token checks", text: "Review state-changing forms for recognizable anti-CSRF token fields." },
];

export const About = () => (
  <div className="app-page info-page">
    <Navigation />
    <main className="info-container">
      <section className="info-hero">
        <span className="eyebrow"><FontAwesomeIcon icon={faShieldHalved} /> ABOUT AEGIS</span>
        <h1>Security checks with <span>clear next steps.</span></h1>
        <p>AEGIS Digital Umbrella brings authorized website checks, readable findings, and practical remediation guidance together in one place.</p>
      </section>

      <section className="about-intro-grid">
        <article className="info-card about-mission-card">
          <span className="info-icon"><FontAwesomeIcon icon={faBullseye} /></span>
          <p className="info-kicker">OUR PURPOSE</p>
          <h2>Make security results easier to understand.</h2>
          <p className="info-copy">The dashboard organizes scan status, coverage, severity, and evidence so teams can review what the built-in checks found and decide what to investigate next.</p>
        </article>
        <article className="info-card about-approach-card">
          <div className="about-approach-heading"><span className="info-icon"><FontAwesomeIcon icon={faFileLines} /></span><span className="about-tag">REVIEWABLE RESULTS</span></div>
          <h2>From a permitted scan to a report.</h2>
          <p className="info-copy">Each completed scan can show the pages visited, inputs tested, findings, and available guidance. Reports can be downloaded for follow-up and review.</p>
          <div className="about-value-list"><span><FontAwesomeIcon icon={faShieldHalved} /> Authorized testing</span><span><FontAwesomeIcon icon={faLightbulb} /> Optional AI guidance</span></div>
        </article>
      </section>

      <section className="about-checks-section">
        <div className="section-heading"><span className="eyebrow">BUILT-IN CHECKS</span><h2>Three focused security checks</h2><p>AEGIS uses bounded checks to look for common web security signals.</p></div>
        <div className="about-check-grid">{checks.map((check, index) => <article className="about-check-card" key={check.title}><span className="about-check-number">0{index + 1}</span><span className="info-icon"><FontAwesomeIcon icon={check.icon} /></span><h3>{check.title}</h3><p>{check.text}</p></article>)}</div>
      </section>

      <aside className="about-note"><FontAwesomeIcon icon={faShieldHalved} /><p><strong>Use AEGIS responsibly.</strong> Only scan websites you own or have explicit permission to assess. Automated results are indicators for human review and cannot guarantee a site is secure.</p></aside>
    </main>
    <SiteFooter />
  </div>
);
