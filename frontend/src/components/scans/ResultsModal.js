import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faFilePdf, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { downloadScanReport } from "../../utils/downloadScanReport";

export const ResultsModal = ({ results, onClose }) => {
  const cleanRecommendation = (value) => String(value || '')
    .replace(/\\([*_`])/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/^\s*(?:[\u2022\u25cf\u25aa-]|\d+[.)])\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const downloadPDF = async () => {
    try {
      await downloadScanReport(results.id);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-blue-500/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Scan Results</h2>
            <p className="text-gray-400 text-sm mt-1">{results.url}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              <span>Download PDF</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <FontAwesomeIcon icon={faXmark} className="text-lg" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-700/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{results.total_vulnerabilities}</div>
                <div className="text-gray-400 text-sm">Total Issues</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-4 text-center border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">{results.high_severity_count}</div>
                <div className="text-red-300 text-sm">High Risk</div>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-4 text-center border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400">{results.medium_severity_count}</div>
                <div className="text-yellow-300 text-sm">Medium Risk</div>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6">
              Scan coverage: {results.scanned_pages || 0} pages visited, {results.tested_parameters || 0} inputs tested. A zero result means these checks found no evidence; it does not prove the site is secure.
            </p>

            {/* Vulnerabilities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Detected Vulnerabilities</h3>
              <div className="space-y-4">
                {results.vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/40">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity}
                        </span>
                        <span className="text-white font-medium">{vuln.type}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-2">{vuln.description}</p>
                    <p className="text-gray-400 text-sm mb-2"><strong>Location:</strong> {vuln.location}</p>
                    <p className="text-gray-400 text-sm"><strong>Evidence:</strong> {vuln.evidence}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faLightbulb} className="text-blue-400 mr-2" />
                AI-Powered Recommendations
              </h3>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="space-y-2">
                  {(!results.ai_recommendations || results.ai_recommendations.length === 0) && (
                    <p className="text-gray-300">
                      {(results.vulnerabilities || []).length > 0
                        ? 'AI recommendations could not be generated for this scan. The findings above are available; try a new scan later to request recommendations again.'
                        : 'No recommendations were generated because the selected checks found no issues. This does not guarantee the site is secure.'}
                    </p>
                  )}
                  {(results.ai_recommendations || []).map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-blue-300 text-sm font-medium">Recommendation {index + 1}:</span>
                      <span className="text-gray-300">{cleanRecommendation(recommendation)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Close Results
          </button>
        </div>
      </div>
    </div>
  );
};
