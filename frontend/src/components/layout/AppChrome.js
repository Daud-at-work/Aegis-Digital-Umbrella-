import React, { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faXmark, faBars } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../../context/ThemeContext";





export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 app-page flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/signin" />;
};

export const SiteFooter = () => (
  <footer className="site-footer"><div className="footer-inner">
    <Link to="/" className="brand-lockup"><span className="brand-mark"><FontAwesomeIcon icon={faShieldHalved} /></span><span>AEGIS <small>Digital Umbrella</small></span></Link>
    <p>Security assessments with clear, reviewable findings.</p>
    <nav aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/signin">Sign in</Link></nav>
    <small className="footer-copy">Copyright {new Date().getFullYear()} AEGIS Digital Umbrella</small>
  </div></footer>
);

export const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-sm border-b border-blue-500/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between main-nav-inner">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center">
            <FontAwesomeIcon icon={faShieldHalved} className="text-white" />
          </div>
          <h1 className="text-white font-semibold text-lg tracking-wide">
            AEGIS Digital Umbrella
          </h1>
        </Link>

        {/* Nav Links */}
        <button type="button" className="mobile-nav-toggle" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><FontAwesomeIcon icon={menuOpen ? faXmark : faBars} /></button>
        <nav aria-label="Main navigation" onClick={(event) => { if (event.target.closest("a, button")) setMenuOpen(false); }} className={`flex items-center gap-6 text-sm nav-links${menuOpen ? " is-open" : ""}`}>
          <ThemeToggle />
          <Link to="/" className="text-gray-300 hover:text-white transition">
            Home
          </Link>
          {user && <Link to="/dashboard" className="text-gray-300 hover:text-white transition">Dashboard</Link>}
          {user && <Link to="/scan-history" className="text-gray-300 hover:text-white transition">Scan History</Link>}
          <Link to="/about" className="text-gray-300 hover:text-white transition">
            About
          </Link>
          <Link to="/contact" className="text-gray-300 hover:text-white transition">
            Contact
          </Link>
          {user && <Link to="/profile" className="text-gray-300 hover:text-white transition">Profile</Link>}
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-gray-300 hover:text-white transition">
              Admin
            </Link>
          )}
          
          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-400 text-sm hidden sm:inline">
                  {user.full_name || user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition"
              >
                Logout
              </button>
            </div>
          )}
          {!user && <><Link to="/signin" className="text-gray-300 hover:text-white transition">Sign in</Link><Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition">Create account</Link></>}
        </nav>
      </div>
    </header>
  );
};
