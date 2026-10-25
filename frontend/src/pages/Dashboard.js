import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faShieldHalved, faMagnifyingGlass, faFileLines, faCircleExclamation, faCircleCheck, faClock, faComments, faTriangleExclamation, faDownload, faRotate } from "@fortawesome/free-solid-svg-icons";
import { API } from "../utils/api";
import { exportScansCsv } from "../utils/exportScansCsv";
import { useAuth } from "../context/AuthContext";
import { SiteFooter } from "../components/layout/AppChrome";
import { Navigation } from "../components/layout/AppChrome";
import { ScannerModal } from "../components/scans/ScannerModal";
import { ResultsModal } from "../components/scans/ResultsModal";
import { ChatbotModal } from "../components/scans/ChatbotModal";

export const Dashboard = () => {
  const [stats, setStats] = useState({
    total_scans: 0,
    active_scans: 0,
    total_vulnerabilities: 0,
    high_risk_vulnerabilities: 0
  });
  const [scans, setScans] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [scanQuery, setScanQuery] = useState('');
  const [scanStatusFilter, setScanStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentScans();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats?user_id=${user?.user_id || 'demo_user'}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchRecentScans = async () => {
    try {
      const response = await axios.get(`${API}/scans?user_id=${user?.user_id || 'demo_user'}`);
      setScans(response.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching scans:', error);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchDashboardStats(), fetchRecentScans()]);
    } finally {
      setRefreshing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const visibleScans = scans.filter((scan) => {
    const matchesQuery = (scan.url || '').toLowerCase().includes(scanQuery.trim().toLowerCase());
    const matchesStatus = scanStatusFilter === 'all' || scan.status === scanStatusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 app-page dashboard-page">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Message */}
        <div className="dashboard-welcome mb-8">
          <span className="eyebrow"><FontAwesomeIcon icon={faShieldHalved} /> AEGIS SECURITY DASHBOARD</span>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.full_name || user?.email}!
          </h2>
          <p className="text-gray-400">Monitor your security posture and scan for vulnerabilities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Scans</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total_scans}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleCheck} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Active Scans</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.active_scans}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faClock} className="text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Vulnerabilities</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total_vulnerabilities}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm font-medium">High Risk</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.high_risk_vulnerabilities}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span>New Scan</span>
          </button>
          
          <button 
            onClick={() => setShowChatbot(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faComments} />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Scans */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <div className="recent-scans-heading"><div><h2 className="text-xl font-semibold text-white">Recent Security Scans</h2><p className="text-gray-400 text-sm">Search your latest scans or narrow them by status.</p></div><div className="recent-scans-actions"><button type="button" className="scan-tool-button" onClick={() => exportScansCsv(visibleScans, "aegis-recent-scans.csv")} disabled={visibleScans.length === 0}><FontAwesomeIcon icon={faDownload} /> Export</button><button type="button" className="scan-tool-button" onClick={refreshDashboard} disabled={refreshing} aria-label="Refresh dashboard data"><FontAwesomeIcon icon={faRotate} className={refreshing ? "animate-spin" : ""} /> Refresh</button><Link to="/scan-history" className="recent-scans-link">View all <FontAwesomeIcon icon={faArrowRight} /></Link></div></div>
              <div className="scan-filter-bar">
                <label className="scan-search-field"><FontAwesomeIcon icon={faMagnifyingGlass} /><input type="search" value={scanQuery} onChange={(event) => setScanQuery(event.target.value)} placeholder="Search by website URL" aria-label="Search recent scans by URL" /></label>
                <label className="scan-status-field"><span>Status</span><select value={scanStatusFilter} onChange={(event) => setScanStatusFilter(event.target.value)} aria-label="Filter recent scans by status"><option value="all">All statuses</option><option value="completed">Completed</option><option value="running">Running</option><option value="failed">Failed</option></select></label>
                <span className="scan-filter-count">{visibleScans.length} of {scans.length}</span>
              </div>
              <div className="space-y-4">
                {visibleScans.map((scan) => (
                  <div key={scan.id} className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/40 scan-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium truncate">{scan.url}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(scan.status)}`}>
                        {scan.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-red-400">{scan.high_severity_count || 0} High</span>
                        <span className="text-yellow-400">{scan.medium_severity_count || 0} Medium</span>
                        <span className="text-green-400">{scan.low_severity_count || 0} Low</span>
                      </div>
                    </div>
                  </div>
                ))}
                {scans.length === 0 && (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faFileLines} className="text-gray-500 text-4xl mb-4" />
                    <p className="text-gray-400">No scans yet. Click "New Scan" to get started.</p>
                  </div>
                )}
                {scans.length > 0 && visibleScans.length === 0 && <div className="scan-empty-filter"><FontAwesomeIcon icon={faMagnifyingGlass} /><p>No recent scans match these filters.</p><button type="button" onClick={() => { setScanQuery(''); setScanStatusFilter('all'); }}>Clear filters</button></div>}
              </div>
            </div>
          </div>

          {/* Scan Types */}
          <div className="space-y-6">
            <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Scan Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
                  <span className="text-white">SQL Injection</span>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
                  <span className="text-white">Cross-Site Scripting</span>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
                  <span className="text-white">CSRF Protection</span>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm border border-green-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Security Status</h3>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-green-400 text-2xl" />
                </div>
                <p className="text-green-400 font-semibold">System Online</p>
                <p className="text-gray-400 text-sm">All scanners operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <ScannerModal 
          onClose={() => setShowScanner(false)}
          onScanComplete={(results) => {
            setScanResults(results);
            setShowScanner(false);
            fetchDashboardStats();
            fetchRecentScans();
          }}
          userId={user?.user_id}
        />
      )}

      {/* Results Modal */}
      {scanResults && (
        <ResultsModal 
          results={scanResults}
          onClose={() => setScanResults(null)}
        />
      )}

      {/* Chatbot Modal */}
      {showChatbot && (
        <ChatbotModal 
          onClose={() => setShowChatbot(false)}
          userId={user?.user_id}
        />
      )}
      <SiteFooter />
    </div>
  );
};
