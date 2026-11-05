
import { useEffect, useMemo, useState } from "react";

import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  UserRound,
  Clock,
  MessageSquare,
  X,
  Save,
  ClipboardList,
  GraduationCap,
  Building2,
  FileText,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-consultations.css";

const STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const AdminConsultations = () => {
  const admin = getStoredAdmin();
  const role = admin?.role;

  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [editingConsultation, setEditingConsultation] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editStatus, setEditStatus] = useState("pending");
  const [editNotes, setEditNotes] = useState("");

  // LOAD CONSULTATIONS
  const loadConsultations = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("/consultations");

      console.log("CONSULTATIONS API RESPONSE:", response);

      const records = Array.isArray(response?.consultations)
        ? response.consultations
        : [];

      setConsultations(records);

      if (!Array.isArray(response?.consultations)) {
        setError(
          "The backend response does not contain a valid consultations list. Check the browser console."
        );
      }
    } catch (err) {
      console.error("LOAD CONSULTATIONS ERROR:", err);
      setConsultations([]);
      setError(err.message || "Unable to load consultations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  // STATISTICS
  const stats = useMemo(() => ({
    total: consultations.length,
    pending: consultations.filter(
      (item) => item.status === "pending"
    ).length,
    confirmed: consultations.filter(
      (item) => item.status === "confirmed"
    ).length,
    completed: consultations.filter(
      (item) => item.status === "completed"
    ).length,
    cancelled: consultations.filter(
      (item) => item.status === "cancelled"
    ).length,
  }), [consultations]);

  // SEARCH AND FILTER
  const filteredConsultations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return consultations.filter((item) => {
      const searchableText = [
        item.student_name,
        item.student_id,
        item.purpose,
        item.staff?.full_name,
        item.staff?.department,
        item.staff?.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [consultations, search, statusFilter]);

  // DATE FORMATTING
  const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // STATUS CLASS
  const getStatusClass = (status) => {
    switch (status) {
      case "confirmed":
        return "confirmed";
      case "completed":
        return "completed";
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "NA"
    );
  };

  // OPEN EDIT MODAL
  const openEditModal = (consultation) => {
    setEditingConsultation(consultation);
    setEditStatus(consultation.status || "pending");
    setEditNotes(consultation.admin_notes || "");
    setError("");
    setNotice("");
  };

  // UPDATE CONSULTATION
  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!canManage || !editingConsultation) return;

    try {
      setUpdatingId(editingConsultation.id);
      setError("");
      setNotice("");

      const response = await api.patch(
        `/consultations/${editingConsultation.id}`,
        {
          status: editStatus,
          admin_notes: editNotes.trim() || null,
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to update consultation."
        );
      }

      if (response.consultation) {
        setConsultations((previous) =>
          previous.map((item) =>
            item.id === editingConsultation.id
              ? response.consultation
              : item
          )
        );

        setSelectedConsultation((previous) =>
          previous?.id === editingConsultation.id
            ? response.consultation
            : previous
        );
      } else {
        await loadConsultations(false);
      }

      setEditingConsultation(null);
      setNotice("Consultation updated successfully.");
    } catch (err) {
      console.error("UPDATE CONSULTATION ERROR:", err);
      setError(err.message || "Unable to update consultation.");
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE CONSULTATION
  const handleDelete = async (consultation) => {
    if (!canDelete || deletingId) return;

    const confirmed = window.confirm(
      `Delete the consultation request from "${consultation.student_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(consultation.id);
      setError("");
      setNotice("");

      const response = await api.delete(
        `/consultations/${consultation.id}`
      );

      if (response && response.success === false) {
        throw new Error(
          response.message || "Unable to delete consultation."
        );
      }

      setConsultations((previous) =>
        previous.filter((item) => item.id !== consultation.id)
      );

      setSelectedConsultation((previous) =>
        previous?.id === consultation.id ? null : previous
      );

      setEditingConsultation((previous) =>
        previous?.id === consultation.id ? null : previous
      );

      setNotice("Consultation deleted successfully.");
    } catch (err) {
      console.error("DELETE CONSULTATION ERROR:", err);
      setError(err.message || "Unable to delete consultation.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-consultations-page">

      {/* HEADER */}
      <div className="ac-header">
        <div className="ac-heading">
          <div className="ac-heading-icon">
            <CalendarDays size={24} />
          </div>

          <div>
            <span className="ac-eyebrow">STUDENT SERVICES</span>
            <h1>Consultations</h1>
            <p>
              Review and manage student consultation requests.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="ac-refresh-btn"
          onClick={() => loadConsultations(false)}
          disabled={refreshing || loading}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "ac-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {notice && (
        <div className="ac-alert success">
          <CheckCircle size={18} />
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notice"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div className="ac-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="ac-stats">
        <div className="ac-stat-card">
          <div className="ac-stat-icon total">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Total Requests</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon pending">
            <Clock size={21} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon confirmed">
            <CheckCircle size={21} />
          </div>
          <div>
            <span>Confirmed</span>
            <strong>{stats.confirmed}</strong>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon completed">
            <CheckCircle size={21} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
          </div>
        </div>

        <div className="ac-stat-card">
          <div className="ac-stat-icon cancelled">
            <XCircle size={21} />
          </div>
          <div>
            <span>Cancelled</span>
            <strong>{stats.cancelled}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="ac-toolbar">
        <div className="ac-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search student, ID, staff, or purpose..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter consultations by status"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* CONSULTATION TABLE */}
      <div className="ac-list-card">
        <div className="ac-list-heading">
          <div>
            <h2>All Consultation Requests</h2>
            <p>
              Showing {filteredConsultations.length} of{" "}
              {consultations.length} requests
            </p>
          </div>
        </div>

        {loading ? (
          <div className="ac-loading">
            <Loader2 size={30} className="ac-spinning" />
            <span>Loading consultations...</span>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="ac-empty">
            <div className="ac-empty-icon">
              <CalendarDays size={35} />
            </div>

            <h3>
              {consultations.length === 0
                ? "No consultation requests yet"
                : "No matching consultations"}
            </h3>

            <p>
              {consultations.length === 0
                ? "Consultation requests submitted through your website will appear here."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="ac-table-scroll">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Purpose</th>
                  <th>Assigned Staff</th>
                  <th>Preferred Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredConsultations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="ac-student-cell">
                        <div className="ac-avatar">
                          {getInitials(item.student_name)}
                        </div>

                        <div className="ac-student-info">
                          <strong>{item.student_name}</strong>
                          <span>
                            {item.student_id || "No student ID"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="ac-purpose">
                        {item.purpose}
                      </div>
                    </td>

                    <td>
                      {item.staff?.full_name ? (
                        <div className="ac-staff">
                          <UserRound size={15} />
                          <div>
                            <strong>{item.staff.full_name}</strong>
                            <span>
                              {item.staff.position ||
                                item.staff.department ||
                                ""}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="ac-muted">Not assigned</span>
                      )}
                    </td>

                    <td>
                      <div className="ac-date">
                        <CalendarDays size={15} />
                        {formatDate(item.preferred_date)}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`ac-status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "pending"}
                      </span>
                    </td>

                    <td>
                      <div className="ac-actions">
                        <button
                          type="button"
                          className="ac-action view"
                          title="View consultation"
                          onClick={() => setSelectedConsultation(item)}
                        >
                          <Eye size={16} />
                        </button>

                        {canManage && (
                          <button
                            type="button"
                            className="ac-action edit"
                            title="Update consultation"
                            onClick={() => openEditModal(item)}
                          >
                            <FileText size={16} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="ac-action delete"
                            title="Delete consultation"
                            onClick={() => handleDelete(item)}
                            disabled={
                              deletingId === item.id ||
                              updatingId === item.id
                            }
                          >
                            {deletingId === item.id ? (
                              <Loader2 size={16} className="ac-spinning" />
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

      {/* VIEW DETAILS MODAL */}
      {selectedConsultation && (
        <div
          className="ac-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedConsultation(null);
            }
          }}
        >
          <div className="ac-modal">
            <div className="ac-modal-header">
              <div>
                <span>CONSULTATION DETAILS</span>
                <h2>Student Request</h2>
              </div>

              <button
                type="button"
                className="ac-modal-close"
                onClick={() => setSelectedConsultation(null)}
                aria-label="Close details"
              >
                <X size={21} />
              </button>
            </div>

            <div className="ac-modal-body">
              <div className="ac-detail-student">
                <div className="ac-detail-avatar">
                  {getInitials(selectedConsultation.student_name)}
                </div>

                <div>
                  <h3>{selectedConsultation.student_name}</h3>
                  <p>
                    {selectedConsultation.student_id ||
                      "Student ID not provided"}
                  </p>
                </div>
              </div>

              <div className="ac-detail-status-row">
                <span
                  className={`ac-status ${getStatusClass(
                    selectedConsultation.status
                  )}`}
                >
                  {selectedConsultation.status || "pending"}
                </span>
              </div>

              <div className="ac-detail-grid">
                <div className="ac-detail-item">
                  <span>Preferred Date</span>
                  <strong>
                    <CalendarDays size={15} />
                    {formatDate(selectedConsultation.preferred_date)}
                  </strong>
                </div>

                <div className="ac-detail-item">
                  <span>Assigned Staff</span>
                  <strong>
                    <UserRound size={15} />
                    {selectedConsultation.staff?.full_name ||
                      "Not assigned"}
                  </strong>
                </div>

                <div className="ac-detail-item">
                  <span>Staff Department</span>
                  <strong>
                    <Building2 size={15} />
                    {selectedConsultation.staff?.department || "—"}
                  </strong>
                </div>

                <div className="ac-detail-item">
                  <span>Staff Position</span>
                  <strong>
                    <GraduationCap size={15} />
                    {selectedConsultation.staff?.position || "—"}
                  </strong>
                </div>
              </div>

              <div className="ac-detail-section">
                <h4>
                  <MessageSquare size={17} />
                  Consultation Purpose
                </h4>
                <p>{selectedConsultation.purpose}</p>
              </div>

              <div className="ac-detail-section">
                <h4>
                  <FileText size={17} />
                  Admin Notes
                </h4>
                <p>
                  {selectedConsultation.admin_notes ||
                    "No admin notes yet."}
                </p>
              </div>

              <div className="ac-detail-date">
                <Clock size={15} />
                Submitted:{" "}
                {formatDateTime(selectedConsultation.created_at)}
              </div>
            </div>

            <div className="ac-modal-footer">
              {canManage && (
                <button
                  type="button"
                  className="ac-modal-edit"
                  onClick={() => {
                    const item = selectedConsultation;
                    setSelectedConsultation(null);
                    openEditModal(item);
                  }}
                >
                  <FileText size={16} />
                  Update Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONSULTATION MODAL */}
      {editingConsultation && (
        <div
          className="ac-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updatingId
            ) {
              setEditingConsultation(null);
            }
          }}
        >
          <div className="ac-modal ac-edit-modal">
            <div className="ac-modal-header">
              <div>
                <span>MANAGE REQUEST</span>
                <h2>Update Consultation</h2>
              </div>

              <button
                type="button"
                className="ac-modal-close"
                onClick={() => setEditingConsultation(null)}
                disabled={Boolean(updatingId)}
                aria-label="Close edit form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="ac-modal-body">
                <div className="ac-edit-student">
                  <strong>{editingConsultation.student_name}</strong>
                  <span>
                    Preferred date:{" "}
                    {formatDate(editingConsultation.preferred_date)}
                  </span>
                </div>

                <div className="ac-form-group">
                  <label htmlFor="consultation-status">
                    Consultation Status
                  </label>

                  <select
                    id="consultation-status"
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(event.target.value)
                    }
                    required
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() +
                          status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ac-form-group">
                  <label htmlFor="consultation-admin-notes">
                    Admin Notes
                  </label>

                  <textarea
                    id="consultation-admin-notes"
                    rows={5}
                    maxLength={5000}
                    placeholder="Add internal notes about this consultation..."
                    value={editNotes}
                    onChange={(event) =>
                      setEditNotes(event.target.value)
                    }
                  />

                  <span className="ac-character-count">
                    {editNotes.length}/5000
                  </span>
                </div>
              </div>

              <div className="ac-modal-footer">
                <button
                  type="button"
                  className="ac-modal-cancel"
                  onClick={() => setEditingConsultation(null)}
                  disabled={Boolean(updatingId)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ac-modal-save"
                  disabled={Boolean(updatingId)}
                >
                  {updatingId ? (
                    <Loader2 size={16} className="ac-spinning" />
                  ) : (
                    <Save size={16} />
                  )}
                  {updatingId ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsultations;
