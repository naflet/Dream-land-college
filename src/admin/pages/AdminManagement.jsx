
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  Plus,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Edit,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  LoaderCircle,
  X,
  Lock,
  Mail,
  UserRound,
  Clock,
  Power,
  ShieldAlert,
} from "lucide-react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../AuthContext";
import api from "../services/api";

import "../styles/admin-management.css";

// ==========================================================
// CONSTANTS
// ==========================================================

const MIN_PASSWORD_LENGTH = 12;

const VALID_ADMIN_ROLES = ["super_admin", "admin"];

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
  new_password: "",
};

// ==========================================================
// HELPERS
// ==========================================================

const normalizeRole = (role) =>
  String(role || "").trim().toLowerCase();

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const formatDate = (value) => {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getAdministratorRecords = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.administrators)) {
    return response.data.administrators;
  }

  if (Array.isArray(response?.administrators)) {
    return response.administrators;
  }

  return [];
};

// ==========================================================
// ADMIN MANAGEMENT
// ==========================================================

export default function AdminManagement() {
  const { admin: currentAdmin, loading: authLoading } = useAuth();

  const currentRole = normalizeRole(currentAdmin?.role);

  const isSuperAdmin = currentRole === "super_admin";

  // ========================================================
  // STATE
  // ========================================================

  const [administrators, setAdministrators] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================================
  // NOTIFICATIONS
  // ========================================================

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const showSuccess = useCallback((message) => {
    setError("");
    setSuccess(message);
  }, []);

  const showError = useCallback((message) => {
    setSuccess("");
    setError(message);
  }, []);

  // ========================================================
  // LOAD ADMINISTRATORS
  // ========================================================

  const fetchAdministrators = useCallback(
    async (showRefresh = false, preserveMessages = false) => {
      if (!isSuperAdmin) return;

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!preserveMessages) {
        clearMessages();
      }

      try {
        const response = await api.get("/admin-management");

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to load administrators."
          );
        }

        const records = getAdministratorRecords(response);

        const validRecords = records.filter((item) =>
          VALID_ADMIN_ROLES.includes(normalizeRole(item.role))
        );

        setAdministrators(validRecords);
      } catch (requestError) {
        console.error(
          "Administrator loading error:",
          requestError
        );

        showError(
          getErrorMessage(
            requestError,
            "Unable to load administrator accounts."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isSuperAdmin, clearMessages, showError]
  );

  useEffect(() => {
    if (authLoading) return;

    if (isSuperAdmin) {
      fetchAdministrators();
    }
  }, [authLoading, isSuperAdmin, fetchAdministrators]);

  // ========================================================
  // STATISTICS
  // ========================================================

  const statistics = useMemo(() => {
    const total = administrators.length;

    const active = administrators.filter(
      (item) => item.is_active === true
    ).length;

    const inactive = total - active;

    const admins = administrators.filter(
      (item) => normalizeRole(item.role) === "admin"
    ).length;

    const superAdmins = administrators.filter(
      (item) => normalizeRole(item.role) === "super_admin"
    ).length;

    return {
      total,
      active,
      inactive,
      admins,
      superAdmins,
    };
  }, [administrators]);

  // ========================================================
  // FILTER ADMINISTRATORS
  // ========================================================

  const filteredAdministrators = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return administrators.filter((item) => {
      const matchesSearch =
        !search ||
        item.full_name?.toLowerCase().includes(search) ||
        item.email?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.is_active === true) ||
        (statusFilter === "inactive" && item.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [administrators, searchTerm, statusFilter]);

  // ========================================================
  // FORM HANDLING
  // ========================================================

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const closeModal = () => {
    if (saving) return;

    setModal(null);
    setSelectedAdmin(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowNewPassword(false);
  };

  const openCreateModal = () => {
    clearMessages();

    setSelectedAdmin(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);

    setModal("create");
  };

  const openEditModal = (administrator) => {
    clearMessages();

    setSelectedAdmin(administrator);

    setForm({
      full_name: administrator.full_name || "",
      email: administrator.email || "",
      password: "",
      new_password: "",
    });

    setModal("edit");
  };

  const openPasswordModal = (administrator) => {
    clearMessages();

    setSelectedAdmin(administrator);
    setForm(EMPTY_FORM);
    setShowNewPassword(false);

    setModal("password");
  };

  // ========================================================
  // CREATE ADMINISTRATOR
  // ========================================================

  const handleCreate = async (event) => {
    event.preventDefault();

    if (saving || !isSuperAdmin) return;

    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!fullName || !email || !password) {
      showError("Please complete all required fields.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      showError(
        `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const response = await api.post("/admin-management", {
        full_name: fullName,
        email,
        password,
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to create administrator."
        );
      }

      setModal(null);
      setSelectedAdmin(null);
      setForm(EMPTY_FORM);

      showSuccess(
        response.message ||
          "Administrator created successfully."
      );

      await fetchAdministrators(true, true);
    } catch (requestError) {
      console.error(
        "Administrator creation error:",
        requestError
      );

      showError(
        getErrorMessage(
          requestError,
          "Unable to create administrator."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // UPDATE ADMINISTRATOR
  // ========================================================

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (saving || !selectedAdmin?.id || !isSuperAdmin) {
      return;
    }

    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName || !email) {
      showError("Name and email are required.");
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const response = await api.patch(
        `/admin-management/${selectedAdmin.id}`,
        {
          full_name: fullName,
          email,
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to update administrator."
        );
      }

      setModal(null);
      setSelectedAdmin(null);
      setForm(EMPTY_FORM);

      showSuccess(
        response.message ||
          "Administrator updated successfully."
      );

      await fetchAdministrators(true, true);
    } catch (requestError) {
      console.error(
        "Administrator update error:",
        requestError
      );

      showError(
        getErrorMessage(
          requestError,
          "Unable to update administrator."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // RESET ADMINISTRATOR PASSWORD
  // ========================================================

  const handlePasswordReset = async (event) => {
    event.preventDefault();

    if (saving || !selectedAdmin?.id || !isSuperAdmin) {
      return;
    }

    const newPassword = form.new_password;

    if (!newPassword) {
      showError("Please enter a new password.");
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      showError(
        `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const response = await api.patch(
        `/admin-management/${selectedAdmin.id}/password`,
        {
          new_password: newPassword,
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to reset password."
        );
      }

      setModal(null);
      setSelectedAdmin(null);
      setForm(EMPTY_FORM);

      showSuccess(
        response.message ||
          "Password reset successfully."
      );
    } catch (requestError) {
      console.error(
        "Password reset error:",
        requestError
      );

      showError(
        getErrorMessage(
          requestError,
          "Unable to reset administrator password."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // ACTIVATE / DEACTIVATE ADMINISTRATOR
  // ========================================================

  const handleToggleStatus = async (administrator) => {
    if (
      !administrator?.id ||
      saving ||
      !isSuperAdmin
    ) {
      return;
    }

    if (normalizeRole(administrator.role) === "super_admin") {
      showError(
        "Super Admin accounts cannot be changed here."
      );
      return;
    }

    if (administrator.id === currentAdmin?.id) {
      showError(
        "You cannot deactivate your own administrator account."
      );
      return;
    }

    const nextStatus = !administrator.is_active;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${administrator.full_name}?`
    );

    if (!confirmed) return;

    setSaving(true);
    clearMessages();

    try {
      const response = await api.patch(
        `/admin-management/${administrator.id}/status`,
        {
          is_active: nextStatus,
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to update account status."
        );
      }

      showSuccess(
        response.message ||
          `Administrator ${
            nextStatus ? "activated" : "deactivated"
          } successfully.`
      );

      await fetchAdministrators(true, true);
    } catch (requestError) {
      console.error(
        "Administrator status update error:",
        requestError
      );

      showError(
        getErrorMessage(
          requestError,
          "Unable to update administrator status."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // ROLE LABEL
  // ========================================================

  const getRoleLabel = (role) => {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === "super_admin") {
      return "Super Admin";
    }

    if (normalizedRole === "admin") {
      return "Admin";
    }

    return "Unknown";
  };

  // ========================================================
  // AUTHORIZATION CHECK
  // ========================================================

  if (authLoading) {
    return (
      <div className="am-loading">
        <LoaderCircle size={28} className="am-spinning" />
        <p>Verifying administrator permissions...</p>
      </div>
    );
  }

  if (!currentAdmin || !VALID_ADMIN_ROLES.includes(currentRole)) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="admin-management-page">

      {/* PAGE HEADER */}

      <div className="am-page-header">
        <div>
          <div className="am-page-eyebrow">
            <ShieldCheck size={15} />
            SUPER ADMINISTRATION
          </div>

          <h1 className="am-page-title">
            Administrator Management
          </h1>

          <p className="am-page-description">
            Create administrator accounts, manage access,
            and maintain account security.
          </p>
        </div>

        <div className="am-header-actions">
          <button
            type="button"
            className="am-secondary-button"
            onClick={() => fetchAdministrators(true)}
            disabled={refreshing || saving}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "am-spinning" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="am-primary-button"
            onClick={openCreateModal}
            disabled={saving}
          >
            <Plus size={17} />
            Add Administrator
          </button>
        </div>
      </div>

      {/* ALERTS */}

      {success && (
        <div className="am-alert success" role="status">
          <CheckCircle size={18} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="am-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="am-stat-grid">
        <div className="am-stat-card">
          <div className="am-stat-top">
            <div className="am-stat-icon green">
              <Users size={21} />
            </div>
          </div>

          <h3 className="am-stat-value">
            {statistics.total}
          </h3>

          <p className="am-stat-label">
            Total Administrators
          </p>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-top">
            <div className="am-stat-icon gold">
              <UserCheck size={21} />
            </div>
          </div>

          <h3 className="am-stat-value">
            {statistics.active}
          </h3>

          <p className="am-stat-label">
            Active Accounts
          </p>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-top">
            <div className="am-stat-icon gray">
              <UserX size={21} />
            </div>
          </div>

          <h3 className="am-stat-value">
            {statistics.inactive}
          </h3>

          <p className="am-stat-label">
            Inactive Accounts
          </p>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-top">
            <div className="am-stat-icon gold">
              <ShieldCheck size={21} />
            </div>
          </div>

          <h3 className="am-stat-value">
            {statistics.superAdmins}
          </h3>

          <p className="am-stat-label">
            Super Admin Accounts
          </p>
        </div>
      </div>

      {/* ADMINISTRATOR TABLE */}

      <section className="am-panel">
        <div className="am-panel-heading">
          <div>
            <h2>Administrator Accounts</h2>

            <p>
              Manage the accounts that have access to the
              college administration portal.
            </p>
          </div>

          <span className="am-record-count">
            {filteredAdministrators.length} accounts
          </span>
        </div>

        {/* TOOLBAR */}

        <div className="am-toolbar">
          <div className="am-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <select
            className="am-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by account status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active accounts</option>
            <option value="inactive">Inactive accounts</option>
          </select>
        </div>

        {/* TABLE */}

        {loading ? (
          <div className="am-loading">
            <LoaderCircle
              size={28}
              className="am-spinning"
            />
            <p>Loading administrator accounts...</p>
          </div>
        ) : filteredAdministrators.length === 0 ? (
          <div className="am-empty">
            <Users size={38} />

            <h3>No administrators found</h3>

            <p>
              {searchTerm || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Create an administrator account to get started."}
            </p>

            {!searchTerm && statusFilter === "all" && (
              <button
                type="button"
                className="am-primary-button"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                Add Administrator
              </button>
            )}
          </div>
        ) : (
          <div className="am-table-wrapper">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAdministrators.map((item) => {
                  const isProtected =
                    normalizeRole(item.role) === "super_admin";

                  const isCurrentAdmin =
                    item.id === currentAdmin?.id;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="am-user">
                          <div className="am-avatar">
                            {item.full_name
                              ?.split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) =>
                                part[0].toUpperCase()
                              )
                              .join("") || "AD"}
                          </div>

                          <div>
                            <div className="am-user-name">
                              {item.full_name || "Unnamed"}

                              {isCurrentAdmin && (
                                <span className="am-you-label">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="am-user-email">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`am-role-badge ${
                            isProtected
                              ? "am-role-super"
                              : "am-role-admin"
                          }`}
                        >
                          {isProtected && (
                            <ShieldCheck size={13} />
                          )}

                          {getRoleLabel(item.role)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`am-status-badge ${
                            item.is_active
                              ? "am-status-active"
                              : "am-status-inactive"
                          }`}
                        >
                          <span className="am-status-dot" />

                          {item.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <span className="am-date">
                          <Clock size={14} />
                          {formatDate(item.last_login)}
                        </span>
                      </td>

                      <td>
                        {formatDate(item.created_at)}
                      </td>

                      <td>
                        {isProtected ? (
                          <span className="am-protected-label">
                            <Lock size={14} />
                            Protected
                          </span>
                        ) : (
                          <div className="am-actions">
                            <button
                              type="button"
                              className="am-action-button"
                              title="Edit administrator"
                              aria-label={`Edit ${item.full_name}`}
                              onClick={() =>
                                openEditModal(item)
                              }
                              disabled={saving}
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              type="button"
                              className="am-action-button"
                              title="Reset password"
                              aria-label={`Reset password for ${item.full_name}`}
                              onClick={() =>
                                openPasswordModal(item)
                              }
                              disabled={saving}
                            >
                              <KeyRound size={16} />
                            </button>

                            <button
                              type="button"
                              className={`am-action-button ${
                                item.is_active
                                  ? "am-action-danger"
                                  : "am-action-success"
                              }`}
                              title={
                                item.is_active
                                  ? "Deactivate administrator"
                                  : "Activate administrator"
                              }
                              aria-label={
                                item.is_active
                                  ? `Deactivate ${item.full_name}`
                                  : `Activate ${item.full_name}`
                              }
                              onClick={() =>
                                handleToggleStatus(item)
                              }
                              disabled={
                                saving || isCurrentAdmin
                              }
                            >
                              <Power size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECURITY INFORMATION */}

      <div className="am-security-note">
        <ShieldAlert size={20} />

        <div>
          <strong>Administrator security</strong>

          <p>
            Only Super Admin accounts can access this management
            page. Admin accounts cannot create, modify, or deactivate
            other administrator accounts. Deactivated accounts
            should be denied access by the backend.
          </p>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}

      {(modal === "create" || modal === "edit") && (
        <div
          className="am-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="am-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="am-account-modal-title"
          >
            <div className="am-modal-header">
              <div>
                <h2
                  id="am-account-modal-title"
                  className="am-modal-title"
                >
                  {modal === "create"
                    ? "Create Administrator"
                    : "Edit Administrator"}
                </h2>

                <p className="am-modal-description">
                  {modal === "create"
                    ? "Create a new Admin account for the college portal."
                    : "Update the administrator's account information."}
                </p>
              </div>

              <button
                type="button"
                className="am-close-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                modal === "create"
                  ? handleCreate
                  : handleUpdate
              }
            >
              <div className="am-modal-body">
                <div className="am-form-group">
                  <label
                    className="am-form-label"
                    htmlFor="am-full-name"
                  >
                    Full Name
                  </label>

                  <div className="am-input-icon">
                    <UserRound size={17} />

                    <input
                      id="am-full-name"
                      className="am-form-input"
                      type="text"
                      value={form.full_name}
                      onChange={(event) =>
                        updateField(
                          "full_name",
                          event.target.value
                        )
                      }
                      placeholder="Enter full name"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="am-form-group">
                  <label
                    className="am-form-label"
                    htmlFor="am-email"
                  >
                    Email Address
                  </label>

                  <div className="am-input-icon">
                    <Mail size={17} />

                    <input
                      id="am-email"
                      className="am-form-input"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="admin@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {modal === "create" && (
                  <div className="am-form-group">
                    <label
                      className="am-form-label"
                      htmlFor="am-password"
                    >
                      Initial Password
                    </label>

                    <div className="am-password-wrap">
                      <Lock size={17} />

                      <input
                        id="am-password"
                        className="am-form-input"
                        type={
                          showPassword ? "text" : "password"
                        }
                        value={form.password}
                        onChange={(event) =>
                          updateField(
                            "password",
                            event.target.value
                          )
                        }
                        placeholder="Enter initial password"
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                      />

                      <button
                        type="button"
                        className="am-password-toggle"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    <p className="am-form-hint">
                      Minimum {MIN_PASSWORD_LENGTH} characters.
                    </p>
                  </div>
                )}

                {modal === "create" && (
                  <div className="am-role-information">
                    <ShieldCheck size={17} />

                    <div>
                      <strong>Assigned role: Admin</strong>

                      <p>
                        New accounts are created with the Admin
                        role. Only the existing Super Admin can
                        manage administrator accounts.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="am-modal-footer">
                <button
                  type="button"
                  className="am-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="am-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="am-spinning"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />

                      {modal === "create"
                        ? "Create Administrator"
                        : "Save Changes"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}

      {modal === "password" && (
        <div
          className="am-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="am-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="am-password-modal-title"
          >
            <div className="am-modal-header">
              <div>
                <h2
                  id="am-password-modal-title"
                  className="am-modal-title"
                >
                  Reset Administrator Password
                </h2>

                <p className="am-modal-description">
                  Set a new password for{" "}
                  <strong>
                    {selectedAdmin?.full_name}
                  </strong>.
                </p>
              </div>

              <button
                type="button"
                className="am-close-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handlePasswordReset}>
              <div className="am-modal-body">
                <div className="am-form-group">
                  <label
                    className="am-form-label"
                    htmlFor="am-new-password"
                  >
                    New Password
                  </label>

                  <div className="am-password-wrap">
                    <Lock size={17} />

                    <input
                      id="am-new-password"
                      className="am-form-input"
                      type={
                        showNewPassword ? "text" : "password"
                      }
                      value={form.new_password}
                      onChange={(event) =>
                        updateField(
                          "new_password",
                          event.target.value
                        )
                      }
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LENGTH}
                      required
                    />

                    <button
                      type="button"
                      className="am-password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showNewPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  <p className="am-form-hint">
                    Password must contain at least{" "}
                    {MIN_PASSWORD_LENGTH} characters.
                  </p>
                </div>

                <div className="am-security-note am-password-warning">
                  <AlertCircle size={18} />

                  <div>
                    <strong>Important</strong>

                    <p>
                      The administrator will need to use this
                      new password the next time they sign in.
                    </p>
                  </div>
                </div>
              </div>

              <div className="am-modal-footer">
                <button
                  type="button"
                  className="am-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="am-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="am-spinning"
                      />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound size={17} />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
