"""Scan execution and scan history endpoints."""

import io
from datetime import datetime
from typing import List
from urllib.parse import urlparse

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from ..core import (DashboardStats, ScanRequest, ScanResult, api_router, db, sanitize_url)
from ..services.history_reports import generate_csv_history, generate_pdf_history
from ..services.reports import generate_pdf_report
from ..services.scanning import generate_ai_recommendations, run_vulnerability_scan

@api_router.post("/scan")
async def start_scan(scan_request: ScanRequest, user_id: str = "demo_user"):
    if not scan_request.authorized:
        raise HTTPException(status_code=400, detail="Confirm that you own or have permission to scan this target.")
    parsed_target = urlparse(scan_request.url)
    if parsed_target.scheme not in ("http", "https") or not parsed_target.hostname:
        raise HTTPException(status_code=400, detail="Enter a valid HTTP or HTTPS target URL.")
    scan_url = sanitize_url(scan_request.url)
    scan = ScanResult(
        user_id=user_id,
        url=scan_url,
        scan_types=["SQL Injection", "Reflected XSS", "CSRF Protection"],
        status="running"
    )
    await db.scans.insert_one(scan.dict())
    try:
        vulnerabilities, scanned_pages, tested_parameters = await run_vulnerability_scan(scan_request.url)
        ai_recommendations = await generate_ai_recommendations(vulnerabilities)
        high_count = sum(1 for v in vulnerabilities if v.severity == "High")
        medium_count = sum(1 for v in vulnerabilities if v.severity == "Medium")
        low_count = sum(1 for v in vulnerabilities if v.severity == "Low")
        scan.vulnerabilities = vulnerabilities
        scan.ai_recommendations = ai_recommendations
        scan.status = "completed"
        scan.completed_at = datetime.utcnow()
        scan.total_vulnerabilities = len(vulnerabilities)
        scan.high_severity_count = high_count
        scan.medium_severity_count = medium_count
        scan.low_severity_count = low_count
        scan.scanned_pages = scanned_pages
        scan.tested_parameters = tested_parameters
        await db.scans.replace_one({"id": scan.id}, scan.dict())
        return scan
    except Exception as e:
        await db.scans.update_one(
            {"id": scan.id}, 
            {"$set": {"status": "failed", "completed_at": datetime.utcnow()}}
        )
        raise HTTPException(status_code=502, detail=f"Security scan failed: {str(e)}")

@api_router.get("/scans/{scan_id}")
async def get_scan(scan_id: str):
    scan = await db.scans.find_one({"id": scan_id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return ScanResult(**scan)

@api_router.get("/scans")
async def get_user_scans(user_id: str = "demo_user"):
    scans = await db.scans.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return [ScanResult(**scan) for scan in scans]

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: str = "demo_user"):
    scans = await db.scans.find({"user_id": user_id}).to_list(1000)
    total_scans = len(scans)
    active_scans = len([s for s in scans if s.get("status") in ["pending", "running"]])
    total_vulnerabilities = 0
    high_risk_count = 0
    for scan in scans:
        if scan.get("vulnerabilities"):
            total_vulnerabilities += len(scan["vulnerabilities"])
            high_risk_count += len([v for v in scan["vulnerabilities"] if v.get("severity") == "High"])
    return DashboardStats(
        total_scans=total_scans,
        active_scans=active_scans,
        total_vulnerabilities=total_vulnerabilities,
        high_risk_vulnerabilities=high_risk_count
    )

@api_router.get("/scans/history/{user_id}")
async def get_scan_history(user_id: str, limit: int = 100):
    try:
        scans = await db.scans.find({"user_id": user_id}).sort("created_at", -1).limit(limit).to_list(limit)
        return [ScanResult(**scan) for scan in scans]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve scan history: {str(e)}")

@api_router.get("/scans/history/{user_id}/download")
async def download_scan_history(user_id: str, format: str = "pdf"):
    try:
        scans = await db.scans.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
        if not scans:
            raise HTTPException(status_code=404, detail="No scan history found")
        if format.lower() == "csv":
            return await generate_csv_history(scans, user_id)
        else:
            return await generate_pdf_history(scans, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download scan history: {str(e)}")

@api_router.get("/scan/{scan_id}/report")
async def download_report(scan_id: str):
    scan = await db.scans.find_one({"id": scan_id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan_result = ScanResult(**scan)
    pdf_buffer = generate_pdf_report(scan_result)
    return StreamingResponse(
        io.BytesIO(pdf_buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=aegis_scan_report_{scan_id}.pdf"}
    )

