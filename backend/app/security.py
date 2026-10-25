"""Password hashing, reset tokens, and outbound password reset email."""

import bcrypt
import hashlib
import os
import re
import secrets
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)

def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def send_password_reset_email(recipient: str, reset_token: str) -> None:
    """Send a password reset link using SMTP settings from the environment."""
    smtp_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("EMAIL_PORT", "587"))
    smtp_user = os.getenv("EMAIL_HOST_USER", "").strip()
    smtp_password = os.getenv("MAIL_PASSWORD") or os.getenv("EMAIL_HOST_PASSWORD", "")
    if smtp_host.lower() == "smtp.gmail.com":
        # Google displays app passwords in groups separated by spaces.
        smtp_password = re.sub(r"\s+", "", smtp_password)
    if not smtp_host or not smtp_user or not smtp_password:
        raise RuntimeError("SMTP settings are incomplete")

    sender_email = (os.getenv("DEFAULT_FROM_EMAIL") or os.getenv("MAIL_DEFAULT_SENDER_EMAIL") or smtp_user).strip()
    sender_name = os.getenv("MAIL_DEFAULT_SENDER_NAME", "AEGIS Admin").strip().strip("'\"")
    frontend_url = (os.getenv("FRONTEND_URL") or os.getenv("REACT_APP_FRONTEND_URL") or "http://localhost:3000").rstrip("/")
    reset_url = f"{frontend_url}/forgot-password?token={reset_token}"

    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset your AEGIS password"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = recipient
    message.attach(MIMEText(
        "We received a request to reset your AEGIS account password. "
        f"Open this link within one hour to choose a new password: {reset_url}\n\n"
        "If you did not request this, you can ignore this email.",
        "plain",
    ))
    message.attach(MIMEText(
        "<p>We received a request to reset your AEGIS account password.</p>"
        f'<p><a href="{reset_url}">Reset your password</a></p>'
        "<p>This link expires in one hour. If you did not request this, you can ignore this email.</p>",
        "html",
    ))

    use_tls = os.getenv("EMAIL_USE_TLS", "true").strip().lower() in {"1", "true", "yes", "on"}
    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
        if use_tls:
            smtp.starttls()
        smtp.login(smtp_user, smtp_password)
        smtp.sendmail(sender_email, [recipient], message.as_string())

