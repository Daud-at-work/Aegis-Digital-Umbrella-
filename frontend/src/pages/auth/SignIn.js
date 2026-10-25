import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { API } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      if (response.data) {
        if (response.data.token) localStorage.setItem("token", response.data.token);
        login(response.data);
        navigate(response.data.role === "admin" ? "/admin" : "/dashboard");
      }
    } catch (error) {
      setError(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page app-page">
      <Link to="/" className="auth-back"><FontAwesomeIcon icon={faArrowLeft} /> Back to home</Link>
      <div className="auth-card">
      <div className="auth-brand"><span className="brand-mark"><FontAwesomeIcon icon={faShieldHalved} /></span></div>
      <p className="eyebrow">AEGIS DIGITAL UMBRELLA</p><h2 className="text-2xl text-white font-semibold mb-2">Welcome back</h2><p className="auth-subtitle">Sign in to continue to your security dashboard.</p>
      {location.state?.message && <p className="auth-success" role="status">{location.state.message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email"
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password"
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="primary-action auth-submit"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
      <div className="auth-extra"><Link to="/forgot-password">Forgot password?</Link></div>
      <div className="mt-4 text-center">
        <p className="text-gray-300">Don't have an account?</p>
        <Link to="/signup" className="auth-inline-link">Create an account</Link>
      </div>
      </div>
    </div>
  );
};
