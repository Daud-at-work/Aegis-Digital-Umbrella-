"""Registration, login, and password reset endpoints."""

import asyncio
import logging
import re
from datetime import datetime, timedelta

from fastapi import HTTPException

from ..core import (PasswordReset, PasswordResetConfirm, UserCreate, UserLogin, api_router, db, generate_reset_token, hash_password, hash_reset_token, logger, send_password_reset_email, verify_password)

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    normalized_email = user_data.email.strip().lower()
    existing_user = await db.users.find_one({"email": {"$regex": f"^{re.escape(normalized_email)}$", "$options": "i"}})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = hash_password(user_data.password)
    user = User(**{**user_data.dict(), "email": normalized_email})
    user.password = hashed_password
    await db.users.insert_one(user.dict())
    return {"message": "User registered successfully", "user_id": user.id}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    normalized_email = login_data.email.strip().lower()
    user = await db.users.find_one({"email": {"$regex": f"^{re.escape(normalized_email)}$", "$options": "i"}})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    await db.users.update_one(
        {"id": user["id"]}, 
        {"$set": {"last_login": datetime.utcnow()}}
    )
    return {
        "message": "Login successful", 
        "user_id": user["id"], 
        "email": user["email"],
        "full_name": user.get("full_name"),
        "company": user.get("company"),
        "role": user.get("role", "user")
    }

@api_router.post("/auth/forgot-password")
async def forgot_password(reset_data: PasswordReset):
    normalized_email = reset_data.email.strip().lower()
    user = await db.users.find_one({"email": {"$regex": f"^{re.escape(normalized_email)}$", "$options": "i"}})
    if not user:
        logger.info("Password reset requested for an email with no matching account")
        return {"message": "If the email exists, a reset link has been sent"}

    reset_token = generate_reset_token()
    token_hash = hash_reset_token(reset_token)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"reset_token": token_hash, "reset_token_expires": expires_at}}
    )

    try:
        await asyncio.to_thread(send_password_reset_email, user["email"], reset_token)
    except Exception:
        logger.exception("Password reset email delivery failed")
        await db.users.update_one(
            {"id": user["id"], "reset_token": token_hash},
            {"$set": {"reset_token": None, "reset_token_expires": None}},
        )
        # Keep the response the same for known and unknown emails.
        return {"message": "If the email exists, a reset link has been sent"}

    logger.info("Password reset email accepted by the SMTP server")
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordResetConfirm):
    user = await db.users.find_one({
        "reset_token": hash_reset_token(reset_data.reset_token),
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if len(reset_data.new_password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password must be at most 72 bytes")

    hashed_password = hash_password(reset_data.new_password)
    updated = await db.users.update_one(
        {
            "id": user["id"],
            "reset_token": hash_reset_token(reset_data.reset_token),
            "reset_token_expires": {"$gt": datetime.utcnow()},
        },
        {"$set": {
            "password": hashed_password,
            "reset_token": None,
            "reset_token_expires": None
        }}
    )
    if updated.modified_count != 1:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    return {"message": "Password reset successful"}

