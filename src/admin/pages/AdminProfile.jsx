import React, { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Shield,
} from "lucide-react";

import { useAuth } from "../AuthContext";
import api from "../services/api";

import "../styles/admin-profile.css";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

export default function AdminProfile() {
  const { admin, updateAdmin } = useAuth();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load authenticated administrator information.
  useEffect(() => {
    if (!admin) return;

    setProfile({
      full_name: admin.full_name || "",
      email: admin.email || "",
    });
  }, [admin]);

  // Handle profile inputs.
  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setProfileMessage(null);
  };

  // Handle password inputs.
  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordMessage(null);
  };

  // Extract a useful API error message.
  const getErrorMessage = (error, fallback) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.data?.message ||
      error?.message ||
      fallback
    );
  };

  // Update administrator profile.
  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileMessage(null);

    const fullName = profile.full_name.trim();
    const email = profile.email.trim().toLowerCase();

    if (!fullName || !email) {
      setProfileMessage({
        type: "error",
        text: "Please complete all profile fields.",
      });
      return;
    }

    if (fullName.length < 2 || fullName.length > 200) {
      setProfileMessage({
        type: "error",
        text: "Your full name must contain between 2 and 200 characters.",
      });
      return;
    }

    if (email.length > 254) {
      setProfileMessage({
        type: "error",
        text: "Email address is too long.",
      });
      return;
    }

    try {
      setProfileLoading(true);

      const response = await api.patch("/auth/profile", {
        full_name: fullName,
        email,
      });

      if (response?.success && response?.admin) {
        updateAdmin(response.admin);

        setProfile({
          full_name: response.admin.full_name || fullName,
          email: response.admin.email || email,
        });

        setProfileMessage({
          type: "success",
          text: response.message || "Profile updated successfully.",
        });
      } else {
        throw new Error(
          response?.message || "Unable to update your profile."
        );
      }
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Unable to update your profile. Please try again."
        ),
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Change administrator password.
  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage(null);

    const {
      current_password,
      new_password,
      confirm_password,
    } = passwords;

    if (!current_password || !new_password || !confirm_password) {
      setPasswordMessage({
        type: "error",
        text: "Please complete all password fields.",
      });
      return;
    }

    if (
      new_password.length < MIN_PASSWORD_LENGTH ||
      new_password.length > MAX_PASSWORD_LENGTH
    ) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must contain between 12 and 128 characters.",
      });
      return;
    }

    if (new_password === current_password) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must be different from your current password.",
      });
      return;
    }

    if (new_password !== confirm_password) {
      setPasswordMessage({
        type: "error",
        text: "The new passwords do not match.",
      });
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await api.patch("/auth/change-password", {
        current_password,
        new_password,
      });

      if (response?.success) {
        setPasswords({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        setPasswordMessage({
          type: "success",
          text: response.message || "Password changed successfully.",
        });
      } else {
        throw new Error(
          response?.message || "Unable to change your password."
        );
      }
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Unable to change your password. Please try again."
        ),
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Display only supported administrator roles.
  const formatRole = (role) => {
    const normalizedRole = String(role || "").toLowerCase();

    const roles = {
      super_admin: "Super Admin",
      admin: "Admin",
    };

    return roles[normalizedRole] || "Administrator";
  };

  // Generate administrator avatar initials.
  const initials = (name) => {
    return (name || "Admin")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  };

  // Display success and error messages.
  const renderMessage = (message) => {
    if (!message) return null;

    const isSuccess = message.type === "success";
    const MessageIcon = isSuccess ? CheckCircle2 : AlertCircle;

    return (
      <div
        className={`profile-message ${isSuccess ? "success" : "error"}`}
        role="alert"
        aria-live="polite"
      >
        <MessageIcon size={18} />
        <span>{message.text}</span>
      </div>
    );
  };

  return (
    <main className="admin-profile-page">
      {/* PAGE HEADER */}
      <div className="profile-page-header">
        <div>
          <span className="profile-eyebrow">
            ACCOUNT SETTINGS
          </span>

          <h1>My Profile</h1>

          <p>
            Manage your administrator information and account security.
          </p>
        </div>

        <div className="profile-header-icon">
          <UserRound size={27} />
        </div>
      </div>

      {/* PROFILE OVERVIEW */}
      <section className="profile-overview-card">
        <div className="profile-avatar">
          {initials(admin?.full_name)}
        </div>

        <div className="profile-overview-info">
          <h2>{admin?.full_name || "Administrator"}</h2>

          <p>{admin?.email || "No email available"}</p>

          <span className="profile-role-badge">
            <ShieldCheck size={15} />
            {formatRole(admin?.role)}
          </span>
        </div>

        <div className="profile-account-status">
          <span className="status-indicator" />
          Active Account
        </div>
      </section>

      <div className="profile-content-grid">
        {/* PERSONAL INFORMATION */}
        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon">
              <UserRound size={20} />
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>
                Update your administrator account details.
              </p>
            </div>
          </div>

          {renderMessage(profileMessage)}

          <form onSubmit={handleProfileSubmit}>
            <div className="profile-form-group">
              <label htmlFor="profile-full-name">
                Full Name
              </label>

              <div className="profile-input-wrapper">
                <UserRound size={18} />

                <input
                  id="profile-full-name"
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                  minLength={2}
                  maxLength={200}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-email">
                Email Address
              </label>

              <div className="profile-input-wrapper">
                <Mail size={18} />

                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="Enter your email address"
                  maxLength={254}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-role">
                Administrator Role
              </label>

              <div className="profile-input-wrapper profile-readonly">
                <Shield size={18} />

                <input
                  id="profile-role"
                  type="text"
                  value={formatRole(admin?.role)}
                  readOnly
                  aria-readonly="true"
                />

                <span className="readonly-label">
                  Read only
                </span>
              </div>

              <small>
                Your administrator role can only be changed by an authorized
                Super Admin.
              </small>
            </div>

            <button
              type="submit"
              className="profile-primary-button"
              disabled={profileLoading || !admin}
            >
              {profileLoading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="profile-spinner"
                  />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Profile
                </>
              )}
            </button>
          </form>
        </section>

        {/* ACCOUNT SECURITY */}
        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon security">
              <LockKeyhole size={20} />
            </div>

            <div>
              <h2>Account Security</h2>
              <p>
                Keep your administrator account secure.
              </p>
            </div>
          </div>

          {renderMessage(passwordMessage)}

          <form onSubmit={handlePasswordSubmit}>
            {/* CURRENT PASSWORD */}
            <div className="profile-form-group">
              <label htmlFor="current-password">
                Current Password
              </label>

              <div className="profile-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  name="current_password"
                  value={passwords.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() =>
                    setShowCurrentPassword((previous) => !previous)
                  }
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="profile-form-group">
              <label htmlFor="new-password">
                New Password
              </label>

              <div className="profile-input-wrapper">
                <KeyRound size={18} />

                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                />

                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() =>
                    setShowNewPassword((previous) => !previous)
                  }
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="profile-form-group">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <div className="profile-input-wrapper">
                <KeyRound size={18} />

                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  value={passwords.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                />

                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* PASSWORD REQUIREMENT */}
            <div className="profile-password-hint">
              <ShieldCheck size={17} />

              <span>
                Use at least 12 characters for your new password.
              </span>
            </div>

            <button
              type="submit"
              className="profile-primary-button security-button"
              disabled={passwordLoading || !admin}
            >
              {passwordLoading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="profile-spinner"
                  />
                  Updating Password...
                </>
              ) : (
                <>
                  <LockKeyhole size={18} />
                  Change Password
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      {/* SECURITY INFORMATION */}
      <section className="profile-security-note">
        <div className="profile-note-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <h3>Account Protection</h3>

          <p>
            Your password is securely hashed before being stored.
            Never share your administrator login credentials with anyone.
            Use a strong, unique password to protect your account.
          </p>
        </div>
      </section>
    </main>
  );
}