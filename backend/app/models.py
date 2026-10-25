"""Pydantic request and response models used by the API."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

# Enhanced Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PasswordReset(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    reset_token: str
    new_password: str = Field(min_length=8, max_length=128)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    user_id: str

class VulnerabilityResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    severity: str
    location: str
    description: str
    evidence: str
    recommendation: str

class ScanRequest(BaseModel):
    url: str
    authorized: bool = False

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    url: str
    scan_types: List[str]
    status: str
    vulnerabilities: List[VulnerabilityResult] = []
    ai_recommendations: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    total_vulnerabilities: int = 0
    high_severity_count: int = 0
    medium_severity_count: int = 0
    low_severity_count: int = 0
    scanned_pages: int = 0
    tested_parameters: int = 0

class DashboardStats(BaseModel):
    total_scans: int
    active_scans: int
    total_vulnerabilities: int
    high_risk_vulnerabilities: int

