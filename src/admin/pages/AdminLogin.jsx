
import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import "../styles/admin-auth.css";

export default function AdminLogin() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/admin";

  if (loading) {
    return (
      <div className="admin-login-loading">
        Checking session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      await login(email.trim(), password);

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <div className="admin-login-icon">
            <ShieldCheck size={30} />
          </div>

          <span>DREAM LAND COLLEGE</span>
          <h1>Admin Portal</h1>
          <p>Sign in to manage your college website.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          )}

          <label htmlFor="admin-email">Email address</label>

          <div className="admin-login-input">
            <Mail size={19} />

            <input
              id="admin-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
            />
          </div>

          <label htmlFor="admin-password">Password</label>

          <div className="admin-login-input">
            <LockKeyhole size={19} />

            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              maxLength={128}
              required
            />

            <button
              type="button"
              className="admin-password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
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
            {submitting ? "Signing in..." : "Sign In"}
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
