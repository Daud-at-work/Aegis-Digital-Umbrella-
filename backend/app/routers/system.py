"""Health and root endpoints."""

from ..core import api_router

@api_router.get("/")
async def root():
    return {"message": "AEGIS Digital Umbrella API - Enhanced Cybersecurity Vulnerability Scanner"}

