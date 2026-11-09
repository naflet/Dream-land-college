
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
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../AuthContext";

import "../styles/admin-auth.css";

// =====================================================
// FRIENDLY LOGIN ERROR MESSAGES
// =====================================================

const getFriendlyLoginError = (err) => {
  const message = String(
    err?.message || err || ""
  ).toLowerCase();

  const status =
    err?.status ||
    err?.statusCode ||
    err?.response?.status;

  // Backend unavailable or network connection failed
  if (
    !navigator.onLine ||
    message.includes("cannot connect") ||
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("econnrefused") ||
    message.includes("backend") ||
    message.includes("fetch failed") ||
    message.includes("timeout")
  ) {
    return {
      title: "Connection unavailable",
      message:
        "We're unable to connect to the login service. Please check your connection and try again.",
    };
  }

  // Incorrect email or password
  if (
    status === 401 ||
    message.includes("invalid credentials") ||
    message.includes("incorrect password") ||
    message.includes("invalid email") ||
    message.includes("unauthorized")
  ) {
    return {
      title: "Login unsuccessful",
      message:
        "The email address or password you entered is incorrect. Please check your details and try again.",
    };
  }

  // Account access issues
  if (
    status === 403 ||
    message.includes("account is inactive") ||
    message.includes("account disabled") ||
    message.includes("forbidden")
  ) {
    return {
      title: "Access unavailable",
      message:
        "Your administrator account cannot currently access the portal. Please contact your system administrator.",
    };
  }

  // Server errors
  if (status >= 500 && status <= 599) {
    return {
      title: "Service temporarily unavailable",
      message:
        "The login service is experiencing a problem. Please try again in a few moments.",
    };
  }

  // General fallback
  return {
    title: "Unable to sign in",
    message:
      "We couldn't complete your sign-in. Please check your details and try again.",
  };
};

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
  const [error, setError] = useState(null);
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
        <Loader2
          size={22}
          className="admin-login-spinner"
        />
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

    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      setError({
        title: "Missing information",
        message: "Please enter your email address and password.",
      });
      return;
    }

    try {
      setSubmitting(true);

      await login(cleanEmail, password);

      navigate(destination, {
        replace: true,
      });

    } catch (err) {
      console.error("Administrator login failed:", err);

      setError(getFriendlyLoginError(err));

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

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
        >

          {/* Browser autofill deterrent */}

          <input
            type="text"
            name="prevent_autofill_username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="admin-autofill-trap"
          />

          <input
            type="password"
            name="prevent_autofill_password"
            autoComplete="new-password"
            tabIndex={-1}
            aria-hidden="true"
            className="admin-autofill-trap"
          />

          {/* FRIENDLY ERROR MESSAGE */}

          {error && (
            <div
              className="admin-login-error"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle
                size={19}
                aria-hidden="true"
              />

              <div>
                <strong>{error.title}</strong>

                <p>{error.message}</p>
              </div>
            </div>
          )}

          {/* EMAIL */}

          <label htmlFor="admin-email">
            Email address
          </label>

          <div className="admin-login-input">

            <Mail
              size={19}
              aria-hidden="true"
            />

            <input
              id="admin-email"
              name="admin_login_email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                if (error) setError(null);
              }}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              disabled={submitting}
              required
            />

          </div>

          {/* PASSWORD */}

          <label htmlFor="admin-password">
            Password
          </label>

          <div className="admin-login-input">

            <LockKeyhole
              size={19}
              aria-hidden="true"
            />

            <input
              id="admin-password"
              name="admin_login_password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                if (error) setError(null);
              }}
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck={false}
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

          {/* SUBMIT */}

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
