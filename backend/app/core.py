"""Shared API router and convenient exports for route modules."""

from fastapi import APIRouter

from .config import logger
from .database import client, db
from .models import (
    ChatMessage, ChatRequest, DashboardStats, PasswordChange, PasswordReset,
    PasswordResetConfirm, ScanRequest, ScanResult, User, UserCreate, UserLogin,
    UserUpdate, VulnerabilityResult,
)
from .security import (
    generate_reset_token, hash_password, hash_reset_token,
    send_password_reset_email, verify_password,
)
from .services.ai_client import LlmChat, UserMessage
from .utils.text import (
    clean_recommendation_text, format_chat_response, sanitize_text_for_pdf,
    sanitize_url,
)

api_router = APIRouter(prefix="/api")
