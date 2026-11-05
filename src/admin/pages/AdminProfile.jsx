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
  CalendarDays,
} from "lucide-react";

import { useAuth } from "../AuthContext";
import api from "../services/api";

import "../styles/admin-profile.css";

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

  useEffect(() => {
    if (admin) {
      setProfile({
        full_name: admin.full_name || "",
        email: admin.email || "",
      });
    }
  }, [admin]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileMessage(null);

    if (!profile.full_name.trim() || !profile.email.trim()) {
      setProfileMessage({
        type: "error",
        text: "Please complete all profile fields.",
      });
      return;
    }

    try {
      setProfileLoading(true);

      const response = await api.patch("/auth/profile", {
        full_name: profile.full_name.trim(),
        email: profile.email.trim(),
      });

      if (response?.success && response?.admin) {
        updateAdmin(response.admin);

        setProfileMessage({
          type: "success",
          text: response.message || "Profile updated successfully.",
        });
      } else {
        throw new Error(response?.message || "Unable to update profile.");
      }
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error.message || "Unable to update your profile.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage(null);

    if (
      !passwords.current_password ||
      !passwords.new_password ||
      !passwords.confirm_password
    ) {
      setPasswordMessage({
        type: "error",
        text: "Please complete all password fields.",
      });
      return;
    }

    if (passwords.new_password.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must contain at least 8 characters.",
      });
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordMessage({
        type: "error",
        text: "The new passwords do not match.",
      });
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await api.patch("/auth/change-password", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });

      if (response?.success) {
        setPasswords({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

        setPasswordMessage({
          type: "success",
          text: response.message || "Password changed successfully.",
        });
      } else {
        throw new Error(response?.message || "Unable to change password.");
      }
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error.message || "Unable to change your password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatRole = (role) => {
    if (!role) return "Administrator";

    return role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const initials = (name) => {
    return (name || "Admin")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  };

  const renderMessage = (message) => {
    if (!message) return null;

    const isSuccess = message.type === "success";
    const MessageIcon = isSuccess ? CheckCircle2 : AlertCircle;

    return (
      <div
        className={`profile-message ${
          isSuccess ? "success" : "error"
        }`}
        role="alert"
      >
        <MessageIcon size={18} />
        <span>{message.text}</span>
      </div>
    );
  };

  return (
    <main className="admin-profile-page">
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
        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon">
              <UserRound size={20} />
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Update your administrator account details.</p>
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
                  required
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Administrator Role</label>

              <div className="profile-input-wrapper profile-readonly">
                <Shield size={18} />

                <input
                  type="text"
                  value={formatRole(admin?.role)}
                  readOnly
                />

                <span className="readonly-label">Read only</span>
              </div>

              <small>
                Your administrator role cannot be changed from this page.
              </small>
            </div>

            <button
              type="submit"
              className="profile-primary-button"
              disabled={profileLoading}
            >
              {profileLoading ? (
                <>
                  <LoaderCircle size={18} className="profile-spinner" />
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

        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon security">
              <LockKeyhole size={20} />
            </div>

            <div>
              <h2>Account Security</h2>
              <p>Keep your administrator account secure.</p>
            </div>
          </div>

          {renderMessage(passwordMessage)}

          <form onSubmit={handlePasswordSubmit}>
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
                    showCurrentPassword ? "Hide password" : "Show password"
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
                  minLength={8}
                  maxLength={128}
                  required
                />

                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() =>
                    setShowNewPassword((previous) => !previous)
                  }
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
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
                  minLength={8}
                  maxLength={128}
                  required
                />

                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
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

            <div className="profile-password-hint">
              <ShieldCheck size={17} />
              Use at least 8 characters for your new password.
            </div>

            <button
              type="submit"
              className="profile-primary-button security-button"
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <LoaderCircle size={18} className="profile-spinner" />
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

      <section className="profile-security-note">
        <div className="profile-note-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <h3>Account Protection</h3>
          <p>
            Your password is securely hashed before being stored.
            Never share your administrator login credentials with anyone.
          </p>
        </div>
      </section>
    </main>
  );
}