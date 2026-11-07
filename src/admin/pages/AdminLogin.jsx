
import React, { useState } from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { useAuth } from "../AuthContext";

import "../styles/admin-auth.css";

export default function AdminLogin() {
  const {
    login,
    isAuthenticated,
    loading,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // RESTORE ORIGINAL DESTINATION
  // =====================================================

  const requestedDestination = location.state?.from;

  const destination = requestedDestination?.pathname?.startsWith("/")
    ? `${requestedDestination.pathname}${requestedDestination.search || ""}${requestedDestination.hash || ""}`
    : "/admin";

  // =====================================================
  // SESSION LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-login-loading">
        <Loader2 size={22} className="admin-login-spinner" />
        <span>Checking administrator session...</span>
      </div>
    );
  }

  // =====================================================
  // ALREADY AUTHENTICATED
  // =====================================================

  if (isAuthenticated) {
    return (
      <Navigate
        to={destination}
        replace
      />
    );
  }

  // =====================================================
  // LOGIN SUBMISSION
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      await login(cleanEmail, password);

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.message ||
        "Login failed. Please check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // LOGIN UI
  // =====================================================

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">

        <div className="admin-login-brand">
          <div className="admin-login-icon">
            <ShieldCheck size={30} />
          </div>

          <span>DREAM LAND COLLEGE</span>

          <h1>Admin Portal</h1>

          <p>
            Sign in to manage your college website.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {error && (
            <div
              className="admin-login-error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <label htmlFor="admin-email">
            Email address
          </label>

          <div className="admin-login-input">
            <Mail size={19} aria-hidden="true" />

            <input
              id="admin-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              disabled={submitting}
              required
            />
          </div>

          <label htmlFor="admin-password">
            Password
          </label>

          <div className="admin-login-input">
            <LockKeyhole size={19} aria-hidden="true" />

            <input
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
              autoComplete="current-password"
              maxLength={128}
              disabled={submitting}
              required
            />

            <button
              type="button"
              className="admin-password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              aria-pressed={showPassword}
              disabled={submitting}
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="admin-login-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2
                  size={17}
                  className="admin-login-spinner"
                />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="admin-login-footer">
          <LockKeyhole size={14} />
          Secure administrator access
        </p>

      </section>
    </main>
  );
}
