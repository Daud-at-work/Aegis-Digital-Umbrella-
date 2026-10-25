"""CSV and PDF exports for scan history."""

import csv
import io
from datetime import datetime
from typing import List
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

async def generate_csv_history(scans: List[dict], user_id: str) -> StreamingResponse:
    import csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Scan ID', 'URL', 'Date', 'Status', 'Total Vulnerabilities', 
        'High Severity', 'Medium Severity', 'Low Severity', 'Scan Types'
    ])
    for scan in scans:
        writer.writerow([
            scan.get('id', ''),
            scan.get('url', ''),
            scan.get('created_at', ''),
            scan.get('status', ''),
            scan.get('total_vulnerabilities', 0),
            scan.get('high_severity_count', 0),
            scan.get('medium_severity_count', 0),
            scan.get('low_severity_count', 0),
            ', '.join(scan.get('scan_types', []))
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aegis_scan_history_{user_id}.csv"}
    )

async def generate_pdf_history(scans: List[dict], user_id: str) -> StreamingResponse:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1,
        textColor=colors.darkblue
    )
    story = []
    story.append(Paragraph("AEGIS Digital Umbrella", title_style))
    story.append(Paragraph("Scan History Report", styles['Heading2']))
    story.append(Spacer(1, 20))
    total_scans = len(scans)
    total_vulns = sum(scan.get('total_vulnerabilities', 0) for scan in scans)
    summary_data = [
        ['Total Scans:', str(total_scans)],
        ['Total Vulnerabilities Found:', str(total_vulns)],
        ['Report Generated:', datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')]
    ]
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    story.append(Paragraph("Detailed Scan History", styles['Heading2']))
    history_data = [['Date', 'URL', 'Status', 'Vulnerabilities']]
    for scan in scans[:50]:
        history_data.append([
            scan.get('created_at', '')[:10] if scan.get('created_at') else '',
            scan.get('url', '')[:40] + '...' if len(scan.get('url', '')) > 40 else scan.get('url', ''),
            scan.get('status', '').upper(),
            str(scan.get('total_vulnerabilities', 0))
        ])
    history_table = Table(history_data, colWidths=[1.5*inch, 2.5*inch, 1*inch, 1*inch])
    history_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
    ]))
    story.append(history_table)
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        io.BytesIO(buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=aegis_scan_history_{user_id}.pdf"}
    )

