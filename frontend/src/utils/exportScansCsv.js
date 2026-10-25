export const exportScansCsv = (scans, filename = "aegis-scan-history.csv") => {
  const rows = [
    ["URL", "Status", "Date", "Scan Types", "Total Findings", "High", "Medium", "Low"],
    ...scans.map((scan) => [scan.url, scan.status, scan.created_at, (scan.scan_types || []).join("; "), scan.total_vulnerabilities || 0, scan.high_severity_count || 0, scan.medium_severity_count || 0, scan.low_severity_count || 0])
  ];
  const csv = rows.map((row) => row.map((value) => {
    let text = String(value ?? "");
    if (/^[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
