import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faBuilding, faPhone, faLock, faTrashCan, faSpinner, faFloppyDisk, faShieldHalved, faCircleCheck, faTriangleExclamation, faKey } from "@fortawesome/free-solid-svg-icons";
import { API } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Navigation, SiteFooter } from "../components/layout/AppChrome";

export const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ full_name: "", email: "", company: "", phone: "" });
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API}/user/profile/${user?.user_id}`);
        setProfile(response.data);
      } catch (requestError) {
        console.error("Error fetching profile:", requestError);
        setError("We could not load your profile. Please refresh and try again.");
      }
    };
    if (user?.user_id) fetchProfile();
  }, [user?.user_id]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setProfileLoading(true);
    setMessage("");
    setError("");
    try {
      await axios.put(`${API}/user/profile/${user?.user_id}`, { full_name: profile.full_name, company: profile.company, phone: profile.phone });
      login({ ...user, full_name: profile.full_name, company: profile.company });
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Profile update failed. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (passwords.new_password !== passwords.confirm_password) {
      setError("The new passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      await axios.post(`${API}/user/change-password/${user?.user_id}`, { current_password: passwords.current_password, new_password: passwords.new_password });
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      setMessage("Password changed successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Password change failed. Check your current password and try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Permanently delete your account and associated data? This cannot be undone.")) return;
    setDeleteLoading(true);
    setError("");
    try {
      await axios.delete(`${API}/user/profile/${user.user_id}`);
      logout();
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Account deletion failed. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const initials = (profile.full_name || user?.email || "A").trim().charAt(0).toUpperCase();
  const updateField = (field) => (event) => setProfile((current) => ({ ...current, [field]: event.target.value }));
  const updatePassword = (field) => (event) => setPasswords((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="app-page info-page">
      <Navigation />
      <main className="info-container profile-container">
        <section className="info-hero profile-hero">
          <span className="eyebrow"><FontAwesomeIcon icon={faUser} /> ACCOUNT</span>
          <h1>Profile <span>settings</span></h1>
          <p>Manage your account details and keep your sign-in secure.</p>
        </section>

        {(message || error) && <div className={`profile-alert ${error ? "is-error" : "is-success"}`} role="status"><FontAwesomeIcon icon={error ? faTriangleExclamation : faCircleCheck} />{error || message}</div>}

        <div className="profile-layout">
          <aside className="info-card profile-summary-card">
            <div className="profile-avatar">{initials}</div>
            <p className="info-kicker">YOUR ACCOUNT</p>
            <h2>{profile.full_name || user?.full_name || "AEGIS user"}</h2>
            <p className="profile-summary-email"><FontAwesomeIcon icon={faEnvelope} />{profile.email || user?.email}</p>
            <div className="profile-summary-divider" />
            <div className="profile-summary-row"><span>Account role</span><strong>{user?.role || "User"}</strong></div>
            <div className="profile-summary-row"><span>Security</span><strong><FontAwesomeIcon icon={faShieldHalved} /> Protected</strong></div>
            <p className="profile-summary-note">Your email address is used to sign in and cannot be edited here.</p>
          </aside>

          <div className="profile-forms-column">
            <section className="info-card profile-form-card">
              <div className="info-card-heading"><span className="info-icon"><FontAwesomeIcon icon={faUser} /></span><div><p className="info-kicker">PERSONAL DETAILS</p><h2>Profile information</h2></div></div>
              <form onSubmit={updateProfile} className="info-form">
                <div className="info-form-row">
                  <label>Full name<input type="text" value={profile.full_name || ""} onChange={updateField("full_name")} placeholder="Your full name" autoComplete="name" /></label>
                  <label>Email address<span className="profile-input-icon"><FontAwesomeIcon icon={faEnvelope} /><input type="email" value={profile.email || ""} disabled /></span></label>
                </div>
                <div className="info-form-row">
                  <label>Company <span className="optional-label">Optional</span><span className="profile-input-icon"><FontAwesomeIcon icon={faBuilding} /><input type="text" value={profile.company || ""} onChange={updateField("company")} placeholder="Company name" autoComplete="organization" /></span></label>
                  <label>Phone <span className="optional-label">Optional</span><span className="profile-input-icon"><FontAwesomeIcon icon={faPhone} /><input type="tel" value={profile.phone || ""} onChange={updateField("phone")} placeholder="Phone number" autoComplete="tel" /></span></label>
                </div>
                <button type="submit" className="info-primary-button" disabled={profileLoading}>{profileLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</> : <><FontAwesomeIcon icon={faFloppyDisk} /> Save profile</>}</button>
              </form>
            </section>

            <section className="info-card profile-form-card">
              <div className="info-card-heading"><span className="info-icon"><FontAwesomeIcon icon={faKey} /></span><div><p className="info-kicker">SIGN-IN SECURITY</p><h2>Change password</h2></div></div>
              <form onSubmit={changePassword} className="info-form">
                <label>Current password<input type="password" value={passwords.current_password} onChange={updatePassword("current_password")} autoComplete="current-password" required /></label>
                <div className="info-form-row">
                  <label>New password<input type="password" value={passwords.new_password} onChange={updatePassword("new_password")} autoComplete="new-password" required minLength={8} /></label>
                  <label>Confirm new password<input type="password" value={passwords.confirm_password} onChange={updatePassword("confirm_password")} autoComplete="new-password" required minLength={8} /></label>
                </div>
                <p className="profile-hint"><FontAwesomeIcon icon={faLock} /> Choose at least 8 characters and keep your password private.</p>
                <button type="submit" className="info-secondary-button" disabled={passwordLoading}>{passwordLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Updating...</> : <><FontAwesomeIcon icon={faLock} /> Update password</>}</button>
              </form>
            </section>

            <section className="profile-danger-card">
              <div><span className="danger-icon"><FontAwesomeIcon icon={faTrashCan} /></span><div><h2>Delete account</h2><p>This permanently removes your account and associated scan data.</p></div></div>
              <button type="button" onClick={handleDeleteAccount} disabled={deleteLoading} aria-label="Permanently delete account">{deleteLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrashCan} /> Delete account</>}</button>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};
