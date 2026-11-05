
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  X,
  BriefcaseBusiness,
  Mail,
  Phone,
  CalendarDays,
  FileText,
  UserRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Save,
  ClipboardList,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-job-applications.css";

const STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "rejected",
  "accepted",
];

const STATUS_LABELS = {
  pending: "Pending",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  accepted: "Accepted",
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "NA"
  );
};

export default function AdminJobApplications() {
  const admin = getStoredAdmin();
  const isSuperAdmin = admin?.role === "super_admin";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [editStatus, setEditStatus] = useState("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [notice, setNotice] = useState(null);

  const showNotice = (message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const loadApplications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/job-applications");

      setApplications(response.data?.applications || []);
    } catch (error) {
      console.error("Load job applications error:", error);

      showNotice(
        error.response?.data?.message ||
          "Unable to load job applications. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          application.full_name,
          application.email,
          application.phone,
          application.vacancy?.title,
          application.vacancy?.department,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );

      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const statistics = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((item) => item.status === "pending").length,
      reviewing: applications.filter((item) => item.status === "reviewing").length,
      shortlisted: applications.filter((item) => item.status === "shortlisted").length,
      accepted: applications.filter((item) => item.status === "accepted").length,
      rejected: applications.filter((item) => item.status === "rejected").length,
    };
  }, [applications]);

  const openDetails = async (application) => {
    setSelectedApplication(application);
    setEditStatus(application.status || "pending");
    setAdminNotes(application.admin_notes || "");
    setDetailsLoading(true);

    try {
      const response = await api.get(
        `/job-applications/${application.id}`
      );

      const fullApplication = response.data?.application || application;

      setSelectedApplication(fullApplication);
      setEditStatus(fullApplication.status || "pending");
      setAdminNotes(fullApplication.admin_notes || "");
    } catch (error) {
      console.error("Load application details error:", error);

      showNotice(
        error.response?.data?.message ||
          "Could not load the latest application details.",
        "error"
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    if (saving) return;

    setSelectedApplication(null);
    setDetailsLoading(false);
  };

  const handleUpdate = async () => {
    if (!selectedApplication) return;

    try {
      setSaving(true);

      const response = await api.patch(
        `/job-applications/${selectedApplication.id}`,
        {
          status: editStatus,
          admin_notes: adminNotes.trim() || null,
        }
      );

      const updatedApplication = response.data?.application;

      setApplications((previous) =>
        previous.map((application) =>
          application.id === selectedApplication.id
            ? { ...application, ...updatedApplication }
            : application
        )
      );

      if (updatedApplication) {
        setSelectedApplication((previous) => ({
          ...previous,
          ...updatedApplication,
        }));
      }

      showNotice(
        response.data?.message || "Application updated successfully."
      );
    } catch (error) {
      console.error("Update application error:", error);

      showNotice(
        error.response?.data?.message ||
          "Failed to update the application.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !isSuperAdmin) return;

    try {
      setDeleting(true);

      const response = await api.delete(
        `/job-applications/${deleteTarget.id}`
      );

      setApplications((previous) =>
        previous.filter((application) => application.id !== deleteTarget.id)
      );

      if (selectedApplication?.id === deleteTarget.id) {
        setSelectedApplication(null);
      }

      setDeleteTarget(null);

      showNotice(
        response.data?.message || "Application deleted successfully."
      );
    } catch (error) {
      console.error("Delete application error:", error);

      showNotice(
        error.response?.data?.message ||
          "Failed to delete the application.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const openCv = (application) => {
    if (!application?.cv_signed_url) {
      showNotice("CV is not available for this application.", "error");
      return;
    }

    window.open(application.cv_signed_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="admin-job-applications">
      <div className="job-applications-header">
        <div>
          <span className="job-applications-eyebrow">
            CAREER MANAGEMENT
          </span>
          <h1>Job Applications</h1>
          <p>
            Review applicants, check submitted CVs and manage recruitment
            applications.
          </p>
        </div>

        <button
          className="job-applications-refresh"
          onClick={() => loadApplications(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "job-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {notice && (
        <div className={`job-notice ${notice.type}`}>
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="job-statistics">
        <div className="job-stat-card">
          <div className="job-stat-icon total">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Total Applications</span>
            <strong>{statistics.total}</strong>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon pending">
            <Clock size={21} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{statistics.pending}</strong>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon reviewing">
            <Eye size={21} />
          </div>
          <div>
            <span>Reviewing</span>
            <strong>{statistics.reviewing}</strong>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon shortlisted">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Shortlisted</span>
            <strong>{statistics.shortlisted}</strong>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon accepted">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Accepted</span>
            <strong>{statistics.accepted}</strong>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon rejected">
            <X size={21} />
          </div>
          <div>
            <span>Rejected</span>
            <strong>{statistics.rejected}</strong>
          </div>
        </div>
      </div>

      <section className="job-applications-panel">
        <div className="job-panel-heading">
          <div>
            <h2>Applicant Records</h2>
            <p>
              {filteredApplications.length} application
              {filteredApplications.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        <div className="job-application-toolbar">
          <div className="job-search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search name, email, phone or vacancy..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by application status"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option value={status} key={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="job-applications-loading">
            <RefreshCw size={25} className="job-spinning" />
            <span>Loading job applications...</span>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="job-applications-empty">
            <div>
              <BriefcaseBusiness size={30} />
            </div>
            <h3>No applications found</h3>
            <p>
              {applications.length === 0
                ? "Job applications submitted through the website will appear here."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="job-table-wrapper">
            <table className="job-applications-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Vacancy</th>
                  <th>Contact</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>CV</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <div className="job-applicant-cell">
                        <div className="job-applicant-avatar">
                          {getInitials(application.full_name)}
                        </div>
                        <div>
                          <strong>{application.full_name}</strong>
                          <span>{application.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="job-vacancy-cell">
                        <strong>
                          {application.vacancy?.title || "General Application"}
                        </strong>
                        <span>
                          {application.vacancy?.department || "Not specified"}
                        </span>
                      </div>
                    </td>

                    <td>{application.phone || "Not provided"}</td>

                    <td>{formatDate(application.created_at)}</td>

                    <td>
                      <span
                        className={`job-status-badge ${application.status}`}
                      >
                        {STATUS_LABELS[application.status] ||
                          application.status}
                      </span>
                    </td>

                    <td>
                      {application.cv_signed_url ? (
                        <button
                          className="job-cv-button"
                          onClick={() => openCv(application)}
                          title="Open applicant CV"
                        >
                          <FileText size={16} />
                          View CV
                        </button>
                      ) : (
                        <span className="job-no-cv">No CV</span>
                      )}
                    </td>

                    <td>
                      <div className="job-row-actions">
                        <button
                          className="job-action-button view"
                          onClick={() => openDetails(application)}
                          title="View application"
                        >
                          <Eye size={17} />
                        </button>

                        {isSuperAdmin && (
                          <button
                            className="job-action-button delete"
                            onClick={() => setDeleteTarget(application)}
                            title="Delete application"
                          >
                            <Trash2 size={17} />
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
      </section>

      {selectedApplication && (
        <div
          className="job-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            className="job-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-details-title"
          >
            <div className="job-modal-header">
              <div>
                <span>APPLICATION DETAILS</span>
                <h2 id="job-details-title">Applicant Information</h2>
              </div>

              <button
                className="job-modal-close"
                onClick={closeDetails}
                disabled={saving}
                aria-label="Close details"
              >
                <X size={21} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="job-applications-loading">
                <RefreshCw size={24} className="job-spinning" />
                Loading application details...
              </div>
            ) : (
              <div className="job-modal-body">
                <div className="job-applicant-profile">
                  <div className="job-profile-avatar">
                    {getInitials(selectedApplication.full_name)}
                  </div>
                  <div>
                    <h3>{selectedApplication.full_name}</h3>
                    <span>
                      Submitted {formatDate(selectedApplication.created_at)}
                    </span>
                  </div>
                </div>

                <div className="job-detail-grid">
                  <div className="job-detail-item">
                    <Mail size={17} />
                    <div>
                      <span>Email Address</span>
                      <strong>{selectedApplication.email || "Not provided"}</strong>
                    </div>
                  </div>

                  <div className="job-detail-item">
                    <Phone size={17} />
                    <div>
                      <span>Phone Number</span>
                      <strong>{selectedApplication.phone || "Not provided"}</strong>
                    </div>
                  </div>

                  <div className="job-detail-item">
                    <BriefcaseBusiness size={17} />
                    <div>
                      <span>Applied Position</span>
                      <strong>
                        {selectedApplication.vacancy?.title ||
                          "General Application"}
                      </strong>
                    </div>
                  </div>

                  <div className="job-detail-item">
                    <CalendarDays size={17} />
                    <div>
                      <span>Submission Date</span>
                      <strong>
                        {formatDateTime(selectedApplication.created_at)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="job-detail-section">
                  <h3>
                    <FileText size={17} />
                    Cover Letter
                  </h3>
                  <div className="job-cover-letter">
                    {selectedApplication.cover_letter ||
                      "No cover letter was provided."}
                  </div>
                </div>

                <div className="job-detail-section">
                  <h3>
                    <Download size={17} />
                    Curriculum Vitae
                  </h3>

                  {selectedApplication.cv_signed_url ? (
                    <button
                      className="job-download-cv"
                      onClick={() => openCv(selectedApplication)}
                    >
                      <FileText size={18} />
                      Open Applicant CV
                      <Download size={16} />
                    </button>
                  ) : (
                    <p className="job-no-document">
                      No CV was attached to this application.
                    </p>
                  )}
                </div>

                <div className="job-detail-section">
                  <h3>
                    <UserRound size={17} />
                    Recruitment Review
                  </h3>

                  <label className="job-form-label">
                    Application Status
                  </label>

                  <select
                    className="job-status-select"
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value)}
                    disabled={saving}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>

                  <label className="job-form-label" htmlFor="job-admin-notes">
                    Internal Admin Notes
                  </label>

                  <textarea
                    id="job-admin-notes"
                    rows={4}
                    placeholder="Write internal notes about this applicant..."
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    maxLength={5000}
                    disabled={saving}
                  />

                  <span className="job-character-count">
                    {adminNotes.length}/5000 characters
                  </span>
                </div>

                <div className="job-modal-footer">
                  <button
                    className="job-secondary-button"
                    onClick={closeDetails}
                    disabled={saving}
                  >
                    Close
                  </button>

                  <button
                    className="job-primary-button"
                    onClick={handleUpdate}
                    disabled={saving}
                  >
                    <Save size={17} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="job-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section className="job-delete-modal" role="dialog" aria-modal="true">
            <div className="job-delete-icon">
              <Trash2 size={25} />
            </div>

            <h2>Delete Application?</h2>
            <p>
              Are you sure you want to delete the application from{" "}
              <strong>{deleteTarget.full_name}</strong>? This also attempts to
              remove the associated CV from storage. This action cannot be
              undone.
            </p>

            <div className="job-modal-footer">
              <button
                className="job-secondary-button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="job-danger-button"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={17} />
                {deleting ? "Deleting..." : "Delete Application"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
