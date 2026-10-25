import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faDownload } from "@fortawesome/free-solid-svg-icons";
import { API } from "../utils/api";
import { exportScansCsv } from "../utils/exportScansCsv";
import { useAuth } from "../context/AuthContext";
import { Navigation } from "../components/layout/AppChrome";
import { downloadScanReport } from "../utils/downloadScanReport";

export const ScanHistory = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      const response = await axios.get(`${API}/scans?user_id=${user?.user_id || 'demo_user'}`);
      setScans(response.data);
    } catch (error) {
      console.error('Error fetching scan history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter(scan => {
    const matchesStatus = filter === 'all' || scan.status === filter;
    const matchesQuery = (scan.url || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const sortedScans = [...filteredScans].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'vulnerabilities') {
      return (b.total_vulnerabilities || 0) - (a.total_vulnerabilities || 0);
    }
    return 0;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRiskLevel = (scan) => {
    const high = scan.high_severity_count || 0;
    const medium = scan.medium_severity_count || 0;
    const low = scan.low_severity_count || 0;
    
    if (high > 0) return { level: 'High Risk', color: 'text-red-400' };
    if (medium > 2) return { level: 'Medium Risk', color: 'text-yellow-400' };
    if (low > 0 || medium > 0) return { level: 'Low Risk', color: 'text-green-400' };
    return { level: 'Secure', color: 'text-blue-400' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 app-page">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Scan History</h2>
          <p className="text-gray-400">View and manage your security scan results</p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 mb-8 history-filter-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 history-filter-layout">
            <div className="flex items-center space-x-4 history-filter-row">
              <label className="history-search-field"><span>Search by URL</span><span className="history-search-input"><FontAwesomeIcon icon={faMagnifyingGlass} /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="example.com" /></span></label>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Scans</option>
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="vulnerabilities">Vulnerabilities</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 history-filter-summary">
              <span className="text-gray-400 text-sm">Showing:</span>
              <span className="text-white font-semibold">{sortedScans.length} / {scans.length}</span>
              <button type="button" className="scan-tool-button ml-3" onClick={() => exportScansCsv(sortedScans)} disabled={sortedScans.length === 0}><FontAwesomeIcon icon={faDownload} /> Export CSV</button>
            </div>
          </div>
        </div>

        {/* Scan History List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-400 mt-4">Loading scan history...</p>
            </div>
          ) : sortedScans.length === 0 ? (
            <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Scans Found</h3>
              <p className="text-gray-400 mb-6">{scans.length === 0 ? "You haven't performed any security scans yet." : "No scans match your search and status filters."}</p>
              {scans.length === 0 ? <button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">Start Your First Scan</button> : <button onClick={() => { setSearchQuery(''); setFilter('all'); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">Clear filters</button>}
            </div>
          ) : (
            sortedScans.map((scan) => {
              const risk = getRiskLevel(scan);
              return (
                <div key={scan.id} className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:bg-slate-800/80 transition-all history-scan-card">
                  <div className="flex items-center justify-between mb-4 history-scan-heading">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white truncate max-w-md">{scan.url}</h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(scan.status)}`}>
                        {scan.status.toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${risk.color}`}>
                        {risk.level}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-700/40 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-white">{scan.total_vulnerabilities || 0}</div>
                      <div className="text-gray-400 text-xs">Total Issues</div>
                    </div>
                    <div className="bg-red-500/20 rounded-lg p-3 text-center border border-red-500/30">
                      <div className="text-xl font-bold text-red-400">{scan.high_severity_count || 0}</div>
                      <div className="text-red-300 text-xs">High</div>
                    </div>
                    <div className="bg-yellow-500/20 rounded-lg p-3 text-center border border-yellow-500/30">
                      <div className="text-xl font-bold text-yellow-400">{scan.medium_severity_count || 0}</div>
                      <div className="text-yellow-300 text-xs">Medium</div>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-3 text-center border border-green-500/30">
                      <div className="text-xl font-bold text-green-400">{scan.low_severity_count || 0}</div>
                      <div className="text-green-300 text-xs">Low</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Scan Types: {scan.scan_types?.join(', ') || 'N/A'}</span>
                      <span>•</span>
<span>
  Duration: {scan.start_time && scan.end_time
    ? `${Math.floor((new Date(scan.end_time) - new Date(scan.start_time)) / 1000)}s`
    : 'Not recorded'}
</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {scan.status === 'completed' && (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                await downloadScanReport(scan.id);
                              } catch (error) {
                                console.error('PDF download failed:', error);
                                window.alert('Could not download this PDF report. Please check that the backend is running and try again.');
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Download PDF
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
