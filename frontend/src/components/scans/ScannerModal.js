import React, { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { API } from "../../utils/api";

export const ScannerModal = ({ onClose, onScanComplete, userId }) => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const handleScan = async () => {
    if (!url.trim()) return;

    setIsScanning(true);
    try {
      const response = await axios.post(`${API}/scan?user_id=${userId || 'demo_user'}`, {
        url: url.trim(),
        authorized
      });
      
      onScanComplete(response.data);
    } catch (error) {
      console.error('Scan failed:', error);
      alert(error.response?.data?.detail || 'The scan failed. Check the target URL and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-blue-500/20 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">New Security Scan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              disabled={isScanning}
            />
          </div>

          <div className="rounded-lg bg-slate-700/70 p-3">
            <p className="text-white text-sm font-medium">SQL Injection · Cross-Site Scripting (XSS) · Cross-Site Request Forgery (CSRF)</p>
          </div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              className="form-checkbox h-4 w-4 mt-0.5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              disabled={isScanning}
            />
            <span className="text-gray-300 text-xs">I own this website or have permission to run an active security scan against it.</span>
          </label>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            disabled={isScanning}
          >
            Cancel
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning || !url.trim() || !authorized}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isScanning ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Scanning...
              </>
            ) : (
              'Start Scan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
