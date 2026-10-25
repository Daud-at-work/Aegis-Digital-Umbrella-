import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPaperPlane, faCircleQuestion, faClock, faShieldHalved, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { Navigation, SiteFooter } from "../components/layout/AppChrome";

export const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const updateField = (field) => (event) => setFormData((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="app-page info-page">
      <Navigation />
      <main className="info-container">
        <section className="info-hero contact-hero">
          <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> SUPPORT</span>
          <h1>How can we <span>help?</span></h1>
          <p>Send a question about AEGIS, your account, or a scan. Include enough detail to help us understand the issue.</p>
        </section>

        <section className="contact-layout">
          <article className="info-card contact-form-card">
            <div className="info-card-heading"><span className="info-icon"><FontAwesomeIcon icon={faPaperPlane} /></span><div><p className="info-kicker">SEND A MESSAGE</p><h2>Contact the AEGIS team</h2></div></div>
            {submitted && <div className="contact-success" role="status"><FontAwesomeIcon icon={faShieldHalved} /> Thanks. Your message has been submitted.</div>}
            <form onSubmit={handleSubmit} className="info-form">
              <div className="info-form-row">
                <label>Name<input type="text" required value={formData.name} onChange={updateField("name")} placeholder="Your name" autoComplete="name" /></label>
                <label>Email<input type="email" required value={formData.email} onChange={updateField("email")} placeholder="you@example.com" autoComplete="email" /></label>
              </div>
              <label>Subject<select required value={formData.subject} onChange={updateField("subject")}><option value="">Choose a topic</option><option value="general">General question</option><option value="scan">Scan question</option><option value="account">Account support</option><option value="bug">Report a problem</option></select></label>
              <label>Message<textarea rows={6} required value={formData.message} onChange={updateField("message")} placeholder="Tell us how we can help..." /></label>
              <button type="submit" className="info-primary-button">Send message <FontAwesomeIcon icon={faArrowRight} /></button>
            </form>
          </article>

          <aside className="contact-side-column">
            <article className="info-card contact-help-card">
              <span className="info-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
              <p className="info-kicker">EMAIL SUPPORT</p>
              <h2>Get in touch</h2>
              <p className="info-copy">For questions about the app or a scan, reach the team by email.</p>
              <a className="contact-email-link" href="mailto:support@aegisdigital.com">support@aegisdigital.com <FontAwesomeIcon icon={faArrowRight} /></a>
            </article>
            <article className="info-card contact-hours-card">
              <span className="info-icon"><FontAwesomeIcon icon={faClock} /></span>
              <p className="info-kicker">BEFORE YOU SEND</p>
              <h2>Help us investigate</h2>
              <p className="info-copy">For a scan issue, include the target URL, approximate scan time, and the message shown in the app. Do not include passwords, API keys, or other secrets.</p>
              <Link to="/scan-history">Open Scan History <FontAwesomeIcon icon={faArrowRight} /></Link>
            </article>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
