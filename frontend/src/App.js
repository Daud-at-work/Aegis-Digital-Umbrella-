import React, { useContext } from "react";
import "./styles/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, ThemeContext, ThemeToggle } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/layout/AppChrome";
import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";
import { SignUp } from "./pages/auth/SignUp";
import { SignIn } from "./pages/auth/SignIn";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { ScanHistory } from "./pages/ScanHistory";
import { VulnerabilityDetails } from "./pages/VulnerabilityDetails";

export function AppRoutes() {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const authPage = ["/signin", "/signup", "/forgot-password"].includes(location.pathname);
  return <div className={`app-shell theme-${theme}`}>{authPage && <ThemeToggle />}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/scan-history" element={<ProtectedRoute><ScanHistory /></ProtectedRoute>} />
          <Route path="/vulnerability-details/:id" element={<ProtectedRoute><VulnerabilityDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          
        </Routes>
  </div>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
