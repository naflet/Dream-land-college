import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
  GraduationCap,
  Building2,
  Save,
  ClipboardList,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-applications.css";

const statuses = ["pending", "reviewing", "accepted", "rejected"];

const statusLabels = {
  pending: "Pending",
  reviewing: "Reviewing",
  accepted: "Accepted",
  rejected: "Rejected",
};

const getResponseData = (response) => {
  return response?.data?.data ?? response?.data ?? response;
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminApplications = () => {
  const admin = getStoredAdmin();
  const role = String(admin?.role || "").toLowerCase();

  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [editStatus, setEditStatus] = useState("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadApplications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/applications");
      const result = getResponseData(response);

      const rows = Array.isArray(result?.applications)
        ? result.applications
        : Array.isArray(result)
          ? result
          : [];

      setApplications(rows);
    } catch (err) {
      console.error("Load applications error:", err);

      setError(
        err?.message || "Unable to load student applications. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((item) => item.status === "pending").length,
      reviewing: applications.filter((item) => item.status === "reviewing").length,
      accepted: applications.filter((item) => item.status === "accepted").length,
      rejected: applications.filter((item) => item.status === "rejected").length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      const searchableText = [
        application.application_number,
        application.full_name,
        application.email,
        application.phone,
        application.campus?.name,
        application.program?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!term || searchableText.includes(term));
    });
  }, [applications, search, statusFilter]);

  const showMessage = (message, type = "success") => {
    if (type === "error") {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
  };

  const openDetails = async (application) => {
    setSelectedApplication(application);
    setEditStatus(application.status || "pending");
    setAdminNotes(application.admin_notes || "");
    setDetailsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get(`/applications/${application.id}`);
      const result = getResponseData(response);
      const latest = result?.application;

      if (latest) {
        setSelectedApplication(latest);
        setEditStatus(latest.status || "pending");
        setAdminNotes(latest.admin_notes || "");
      }
    } catch (err) {
      console.error("Load application details error:", err);
      // Keep the application row data visible if the detail request fails.
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    if (saving) return;

    setSelectedApplication(null);
    setDetailsLoading(false);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedApplication || !canManage) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/applications/${selectedApplication.id}`,
        {
          status: editStatus,
          admin_notes: adminNotes,
        }
      );

      const result = getResponseData(response);

      if (result?.success === false) {
        throw new Error(result.message || "Unable to update the application.");
      }

      const updatedApplication = {
        ...selectedApplication,
        ...(result?.application || {}),
        status: editStatus,
        admin_notes: adminNotes,
      };

      setApplications((previous) =>
        previous.map((item) =>
          item.id === selectedApplication.id ? updatedApplication : item
        )
      );

      setSelectedApplication(updatedApplication);
      showMessage("Application updated successfully.");
    } catch (err) {
      console.error("Update application error:", err);
      showMessage(
        err?.message || "Unable to update the application.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (application) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the application from ${application.full_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(application.id);
      setError("");
      setSuccess("");

      const response = await api.delete(`/applications/${application.id}`);
      const result = getResponseData(response);

      if (result?.success === false) {
        throw new Error(result.message || "Unable to delete the application.");
      }

      setApplications((previous) =>
        previous.filter((item) => item.id !== application.id)
      );

      if (selectedApplication?.id === application.id) {
        setSelectedApplication(null);
      }

      showMessage("Application deleted successfully.");
    } catch (err) {
      console.error("Delete application error:", err);
      showMessage(
        err?.message || "Unable to delete the application.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="aa-page">
      <div className="aa-header">
        <div className="aa-heading">
          <span className="aa-eyebrow">ADMISSIONS MANAGEMENT</span>
          <h1>Student Applications</h1>
          <p>
            Review student applications, manage application progress, and
            communicate internal decisions.
          </p>
        </div>

        <div className="aa-header-actions">
          <button
            type="button"
            className="aa-refresh-btn"
            onClick={() => loadApplications(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "aa-spinning" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="aa-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="aa-alert success">
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

      <div className="aa-stats">
        <div className="aa-stat-card">
          <div className="aa-stat-icon total">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Total Applications</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="aa-stat-card">
          <div className="aa-stat-icon pending">
            <Clock size={21} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="aa-stat-card">
          <div className="aa-stat-icon reviewing">
            <Eye size={21} />
          </div>
          <div>
            <span>Reviewing</span>
            <strong>{stats.reviewing}</strong>
          </div>
        </div>

        <div className="aa-stat-card">
          <div className="aa-stat-icon accepted">
            <CheckCircle size={21} />
          </div>
          <div>
            <span>Accepted</span>
            <strong>{stats.accepted}</strong>
          </div>
        </div>

        <div className="aa-stat-card">
          <div className="aa-stat-icon rejected">
            <X size={21} />
          </div>
          <div>
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
          </div>
        </div>
      </div>

      <div className="aa-content">
        <div className="aa-toolbar">
          <div className="aa-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search name, application number, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter applications by status"
          >
            <option value="all">All Applications</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="aa-table-heading">
          <div>
            <h2>Applications List</h2>
            <p>
              Showing {filteredApplications.length} of {applications.length}{" "}
              applications
            </p>
          </div>
        </div>

        {loading ? (
          <div className="aa-loading">
            <Loader2 size={30} className="aa-spinning" />
            <span>Loading student applications...</span>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="aa-empty">
            <div className="aa-empty-icon">
              <FileText size={30} />
            </div>
            <h3>
              {applications.length === 0
                ? "No applications yet"
                : "No matching applications"}
            </h3>
            <p>
              {applications.length === 0
                ? "Student applications submitted through the website will appear here."
                : "Try changing your search or status filter."}
            </p>
            {(search || statusFilter !== "all") && (
              <button
                type="button"
                className="aa-secondary-btn"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="aa-table-scroll">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Application Number</th>
                  <th>Campus & Program</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <div className="aa-applicant-cell">
                        <div className="aa-avatar">
                          <User size={19} />
                        </div>
                        <div className="aa-applicant-info">
                          <strong>{application.full_name || "Unnamed applicant"}</strong>
                          <span>{application.email || "No email"}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="aa-application-number">
                        {application.application_number || "Not assigned"}
                      </span>
                    </td>

                    <td>
                      <div className="aa-meta">
                        <span>
                          <Building2 size={14} />
                          {application.campus?.name || "Not specified"}
                        </span>
                        <span>
                          <GraduationCap size={14} />
                          {application.program?.title || "Not specified"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="aa-date">
                        <CalendarDays size={14} />
                        {formatDate(
                          application.submitted_at || application.created_at
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`aa-status ${application.status || "pending"}`}
                      >
                        {statusLabels[application.status] || "Pending"}
                      </span>
                    </td>

                    <td>
                      <div className="aa-actions">
                        <button
                          type="button"
                          className="aa-action view"
                          title="View application"
                          onClick={() => openDetails(application)}
                        >
                          <Eye size={16} />
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            className="aa-action delete"
                            title="Delete application"
                            onClick={() => handleDelete(application)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === application.id ? (
                              <Loader2 size={16} className="aa-spinning" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApplication && (
        <div
          className="aa-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <div className="aa-modal">
            <div className="aa-modal-header">
              <div>
                <span>APPLICATION DETAILS</span>
                <h2>Student Application</h2>
                <p>
                  Review applicant information and manage the application.
                </p>
              </div>

              <button
                type="button"
                className="aa-modal-close"
                onClick={closeDetails}
                disabled={saving}
                aria-label="Close application details"
              >
                <X size={21} />
              </button>
            </div>

            <form className="aa-modal-form" onSubmit={handleUpdate}>
              <div className="aa-modal-body">
                {detailsLoading && (
                  <div className="aa-detail-loading">
                    <Loader2 size={20} className="aa-spinning" />
                    Loading application details...
                  </div>
                )}

                <div className="aa-detail-banner">
                  <div className="aa-detail-avatar">
                    <User size={25} />
                  </div>
                  <div>
                    <h3>{selectedApplication.full_name}</h3>
                    <span>
                      {selectedApplication.application_number || "Application"}
                    </span>
                  </div>
                  <span
                    className={`aa-status ${selectedApplication.status || "pending"}`}
                  >
                    {statusLabels[selectedApplication.status] || "Pending"}
                  </span>
                </div>

                <div className="aa-section-heading">
                  <User size={18} />
                  <h3>Applicant Information</h3>
                </div>

                <div className="aa-detail-grid">
                  <div className="aa-detail-item">
                    <span>Full Name</span>
                    <strong>{selectedApplication.full_name || "—"}</strong>
                  </div>

                  <div className="aa-detail-item">
                    <span>Email Address</span>
                    <strong className="aa-detail-with-icon">
                      <Mail size={15} />
                      {selectedApplication.email || "—"}
                    </strong>
                  </div>

                  <div className="aa-detail-item">
                    <span>Phone Number</span>
                    <strong className="aa-detail-with-icon">
                      <Phone size={15} />
                      {selectedApplication.phone || "—"}
                    </strong>
                  </div>

                  <div className="aa-detail-item">
                    <span>Education Level</span>
                    <strong>{selectedApplication.education_level || "—"}</strong>
                  </div>
                </div>

                <div className="aa-section-heading">
                  <GraduationCap size={18} />
                  <h3>Academic Information</h3>
                </div>

                <div className="aa-detail-grid">
                  <div className="aa-detail-item">
                    <span>Campus</span>
                    <strong>{selectedApplication.campus?.name || "Not specified"}</strong>
                  </div>

                  <div className="aa-detail-item">
                    <span>Program</span>
                    <strong>{selectedApplication.program?.title || "Not specified"}</strong>
                  </div>

                  <div className="aa-detail-item">
                    <span>Submitted Date</span>
                    <strong>
                      {formatDate(
                        selectedApplication.submitted_at ||
                          selectedApplication.created_at
                      )}
                    </strong>
                  </div>

                  <div className="aa-detail-item">
                    <span>Last Updated</span>
                    <strong>{formatDate(selectedApplication.updated_at)}</strong>
                  </div>
                </div>

                <div className="aa-section-heading">
                  <FileText size={18} />
                  <h3>Applicant Message</h3>
                </div>

                <div className="aa-message-box">
                  {selectedApplication.notes?.trim()
                    ? selectedApplication.notes
                    : "The applicant did not provide an additional message."}
                </div>

                <div className="aa-section-heading">
                  <ClipboardList size={18} />
                  <h3>Application Management</h3>
                </div>

                {canManage ? (
                  <div className="aa-form-grid">
                    <label className="aa-form-group">
                      Application Status
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value)}
                        disabled={saving}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="aa-form-group aa-full-width">
                      Internal Admin Notes
                      <textarea
                        value={adminNotes}
                        onChange={(event) => setAdminNotes(event.target.value)}
                        placeholder="Write internal notes about this application..."
                        rows={5}
                        maxLength={5000}
                        disabled={saving}
                      />
                      <small>
                        These notes are for administrators and are not shown to
                        the applicant.
                      </small>
                    </label>
                  </div>
                ) : (
                  <div className="aa-readonly-management">
                    <div>
                      <span>Application Status</span>
                      <strong>
                        {statusLabels[selectedApplication.status] || "Pending"}
                      </strong>
                    </div>
                    <div>
                      <span>Admin Notes</span>
                      <p>
                        {selectedApplication.admin_notes ||
                          "No internal notes have been added."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="aa-modal-footer">
                <button
                  type="button"
                  className="aa-cancel-btn"
                  onClick={closeDetails}
                  disabled={saving}
                >
                  Close
                </button>

                {canManage && (
                  <button
                    type="submit"
                    className="aa-primary-btn"
                    disabled={saving || detailsLoading}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={17} className="aa-spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;