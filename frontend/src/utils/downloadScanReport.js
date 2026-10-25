import axios from "axios";
import { API } from "./api";

export async function downloadScanReport(scanId) {
  const response = await axios.get(`${API}/scan/${encodeURIComponent(scanId)}/report`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/pdf",
  });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `aegis_scan_report_${scanId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
}
