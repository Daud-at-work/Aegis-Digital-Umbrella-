"""PDF report generation for an individual scan."""

import io
import logging
from datetime import datetime

from fastapi import HTTPException
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

from ..core import ScanResult, logger, sanitize_text_for_pdf

def generate_pdf_report(scan_result: ScanResult) -> io.BytesIO:
    """Generate a PDF report for the scan results."""
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
    normal_style = styles['Normal']
    normal_style.leading = 14
    normal_style.fontSize = 10
    story = []
    
    # Add report header
    story.append(Paragraph("AEGIS Digital Umbrella", title_style))
    story.append(Paragraph("Cybersecurity Vulnerability Report", styles['Heading2']))
    story.append(Spacer(1, 20))
    
    # Scan information table
    scan_info = [
        ['Scan ID:', scan_result.id],
        ['Target URL:', sanitize_text_for_pdf(scan_result.url)],
        ['Scan Date:', scan_result.created_at.strftime('%Y-%m-%d %H:%M:%S')],
        ['Scan Types:', ', '.join([t.upper() for t in scan_result.scan_types])],
        ['Status:', scan_result.status.upper()],
        ['Total Vulnerabilities:', str(scan_result.total_vulnerabilities)]
    ]
    scan_table = Table(scan_info, colWidths=[2*inch, 4*inch])
    scan_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(scan_table)
    story.append(Spacer(1, 20))
    
    # Vulnerability summary table
    story.append(Paragraph("Vulnerability Summary", styles['Heading2']))
    summary_data = [
        ['High Severity', str(scan_result.high_severity_count)],
        ['Medium Severity', str(scan_result.medium_severity_count)],
        ['Low Severity', str(scan_result.low_severity_count)],
        ['Total', str(scan_result.total_vulnerabilities)]
    ]
    summary_table = Table(summary_data, colWidths=[3*inch, 1*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Detailed vulnerability analysis
    if scan_result.vulnerabilities:
        story.append(Paragraph("Detailed Vulnerability Analysis", styles['Heading2']))
        for i, vuln in enumerate(scan_result.vulnerabilities, 1):
            try:
                # Sanitize all fields
                location = sanitize_text_for_pdf(vuln.location)
                description = sanitize_text_for_pdf(vuln.description)
                evidence = sanitize_text_for_pdf(vuln.evidence)
                recommendation = sanitize_text_for_pdf(vuln.recommendation)
                
                # Add vulnerability details
                story.append(Paragraph(f"{i}. {vuln.type} - {vuln.severity} Severity", styles['Heading3']))
                story.append(Paragraph(f"<b>Location:</b> {location}", normal_style))
                story.append(Paragraph(f"<b>Description:</b> {description}", normal_style))
                story.append(Paragraph(f"<b>Evidence:</b> {evidence}", normal_style))
                story.append(Paragraph(f"<b>Recommendation:</b> {recommendation}", normal_style))
                story.append(Spacer(1, 10))
            except Exception as e:
                logger.error(f"Error processing vulnerability {i} (ID: {vuln.id}): {str(e)}")
                story.append(Paragraph(f"Error processing vulnerability {i}: Content could not be processed", normal_style))
                story.append(Spacer(1, 10))
    
    # AI-powered recommendations
    if scan_result.ai_recommendations:
        story.append(Paragraph("AI-Powered Security Recommendations", styles['Heading2']))
        for i, rec in enumerate(scan_result.ai_recommendations, 1):
            try:
                sanitized_rec = sanitize_text_for_pdf(rec)
                story.append(Paragraph(f"{i}. {sanitized_rec}", normal_style))
                story.append(Spacer(1, 8))
            except Exception as e:
                logger.error(f"Error processing recommendation {i}: {str(e)}")
                story.append(Paragraph(f"Error processing recommendation {i}: Content could not be processed", normal_style))
                story.append(Spacer(1, 8))
    
    # Footer
    story.append(Spacer(1, 20))
    story.append(Paragraph("Generated by AEGIS Digital Umbrella - Cybersecurity Vulnerability Scanner", normal_style))
    story.append(Paragraph(f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    
    try:
        doc.build(story)
    except Exception as e:
        logger.error(f"PDF generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
    
    buffer.seek(0)
    return buffer

