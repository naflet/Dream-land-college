
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
  MessageSquare,
  Clock,
  UserRound,
  CalendarDays,
  Tag,
  X,
  ThumbsUp,
  ThumbsDown,
  Quote,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-testimonials.css";

const AdminTestimonials = () => {
  const admin = getStoredAdmin();
  const role = admin?.role;

  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTestimonials = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("/testimonials");

      setTestimonials(
        Array.isArray(response?.testimonials)
          ? response.testimonials
          : []
      );
    } catch (err) {
      setError(err.message || "Unable to load testimonials.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const stats = useMemo(() => {
    return {
      total: testimonials.length,
      pending: testimonials.filter(
        (item) => item.status === "pending"
      ).length,
      approved: testimonials.filter(
        (item) => item.status === "approved"
      ).length,
      rejected: testimonials.filter(
        (item) => item.status === "rejected"
      ).length,
    };
  }, [testimonials]);

  const filteredTestimonials = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return testimonials.filter((item) => {
      const searchableText = [
        item.author_name,
        item.author_role,
        item.category,
        item.content,
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
  }, [testimonials, search, statusFilter]);

  const formatDate = (date) => {
    if (!date) return "Date not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "Date not available";

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

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const getAuthorInitials = (name) => {
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

  const handleStatusUpdate = async (testimonial, newStatus) => {
    if (!canManage || updatingId) return;

    if (testimonial.status === newStatus) return;

    const actionText =
      newStatus === "approved"
        ? "approve"
        : newStatus === "rejected"
          ? "reject"
          : "return to pending";

    if (
      !window.confirm(
        `Are you sure you want to ${actionText} the testimonial from ${testimonial.author_name}?`
      )
    ) {
      return;
    }

    try {
      setUpdatingId(testimonial.id);
      setError("");
      setNotice("");

      const response = await api.patch(
        `/testimonials/${testimonial.id}/status`,
        { status: newStatus }
      );

      if (!response?.success) {
        throw new Error("Unable to update testimonial status.");
      }

      const updatedTestimonial = response.testimonial;

      if (updatedTestimonial) {
        setTestimonials((previous) =>
          previous.map((item) =>
            item.id === testimonial.id
              ? updatedTestimonial
              : item
          )
        );

        setSelectedTestimonial((previous) =>
          previous?.id === testimonial.id
            ? updatedTestimonial
            : previous
        );
      } else {
        await loadTestimonials(false);
      }

      const successMessage =
        newStatus === "approved"
          ? "Testimonial approved successfully."
          : newStatus === "rejected"
            ? "Testimonial rejected successfully."
            : "Testimonial returned to pending.";

      setNotice(successMessage);
    } catch (err) {
      setError(err.message || "Unable to update testimonial status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (testimonial) => {
    if (!canDelete || deletingId) return;

    const confirmed = window.confirm(
      `Delete the testimonial submitted by "${testimonial.author_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(testimonial.id);
      setError("");
      setNotice("");

      await api.delete(`/testimonials/${testimonial.id}`);

      setTestimonials((previous) =>
        previous.filter((item) => item.id !== testimonial.id)
      );

      setSelectedTestimonial((previous) =>
        previous?.id === testimonial.id ? null : previous
      );

      setNotice("Testimonial deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete testimonial.");
    } finally {
      setDeletingId(null);
    }
  };

  const dismissError = () => setError("");
  const dismissNotice = () => setNotice("");

  return (
    <div className="admin-testimonials-page">
      {/* HEADER */}
      <div className="at-header">
        <div className="at-heading">
          <div className="at-heading-icon">
            <MessageSquare size={24} />
          </div>

          <div>
            <span className="at-eyebrow">WEBSITE CONTENT</span>
            <h1>Testimonials</h1>
            <p>
              Review and manage feedback submitted by students and visitors.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="at-refresh-btn"
          onClick={() => loadTestimonials(false)}
          disabled={refreshing || loading}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "at-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {notice && (
        <div className="at-alert success">
          <CheckCircle size={18} />
          <span>{notice}</span>

          <button
            type="button"
            onClick={dismissNotice}
            aria-label="Dismiss notice"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div className="at-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={dismissError}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="at-stats">
        <div className="at-stat-card">
          <div className="at-stat-icon total">
            <MessageSquare size={21} />
          </div>

          <div>
            <span>Total Testimonials</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="at-stat-card">
          <div className="at-stat-icon pending">
            <Clock size={21} />
          </div>

          <div>
            <span>Pending Review</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="at-stat-card">
          <div className="at-stat-icon approved">
            <CheckCircle size={21} />
          </div>

          <div>
            <span>Approved</span>
            <strong>{stats.approved}</strong>
          </div>
        </div>

        <div className="at-stat-card">
          <div className="at-stat-icon rejected">
            <XCircle size={21} />
          </div>

          <div>
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="at-toolbar">
        <div className="at-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search author, category, role, or testimonial..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter testimonials by status"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* TESTIMONIAL LIST */}
      <div className="at-list-card">
        <div className="at-list-heading">
          <div>
            <h2>All Testimonials</h2>
            <p>
              Showing {filteredTestimonials.length} of{" "}
              {testimonials.length} submissions
            </p>
          </div>
        </div>

        {loading ? (
          <div className="at-loading">
            <Loader2 size={30} className="at-spinning" />
            <span>Loading testimonials...</span>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="at-empty">
            <div className="at-empty-icon">
              <MessageSquare size={35} />
            </div>

            <h3>
              {testimonials.length === 0
                ? "No testimonials yet"
                : "No matching testimonials"}
            </h3>

            <p>
              {testimonials.length === 0
                ? "Testimonials submitted through your website will appear here."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="at-table-scroll">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Testimonial</th>
                  <th>Category</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTestimonials.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="at-author-cell">
                        <div className="at-author-avatar">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.author_name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            getAuthorInitials(item.author_name)
                          )}
                        </div>

                        <div className="at-author-info">
                          <strong>{item.author_name}</strong>
                          <span>
                            {item.author_role || "No role provided"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="at-content-preview">
                        <Quote size={15} />
                        <span>{item.content}</span>
                      </div>
                    </td>

                    <td>
                      {item.category ? (
                        <span className="at-category">
                          <Tag size={13} />
                          {item.category}
                        </span>
                      ) : (
                        <span className="at-muted">—</span>
                      )}
                    </td>

                    <td>
                      <div className="at-date">
                        <CalendarDays size={15} />
                        {formatDate(item.created_at)}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`at-status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "pending"}
                      </span>
                    </td>

                    <td>
                      <div className="at-actions">
                        <button
                          type="button"
                          className="at-action view"
                          title="View testimonial"
                          onClick={() => setSelectedTestimonial(item)}
                        >
                          <Eye size={16} />
                        </button>

                        {canManage && item.status !== "approved" && (
                          <button
                            type="button"
                            className="at-action approve"
                            title="Approve testimonial"
                            onClick={() =>
                              handleStatusUpdate(item, "approved")
                            }
                            disabled={
                              updatingId !== null ||
                              deletingId !== null
                            }
                          >
                            {updatingId === item.id ? (
                              <Loader2 size={16} className="at-spinning" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>
                        )}

                        {canManage && item.status !== "rejected" && (
                          <button
                            type="button"
                            className="at-action reject"
                            title="Reject testimonial"
                            onClick={() =>
                              handleStatusUpdate(item, "rejected")
                            }
                            disabled={
                              updatingId !== null ||
                              deletingId !== null
                            }
                          >
                            <XCircle size={16} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="at-action delete"
                            title="Delete testimonial"
                            onClick={() => handleDelete(item)}
                            disabled={
                              deletingId !== null ||
                              updatingId !== null
                            }
                          >
                            {deletingId === item.id ? (
                              <Loader2 size={16} className="at-spinning" />
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

      {/* TESTIMONIAL DETAILS MODAL */}
      {selectedTestimonial && (
        <div
          className="at-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTestimonial(null);
            }
          }}
        >
          <div className="at-modal">
            <div className="at-modal-header">
              <div>
                <span>TESTIMONIAL DETAILS</span>
                <h2>Submitted Feedback</h2>
              </div>

              <button
                type="button"
                className="at-modal-close"
                onClick={() => setSelectedTestimonial(null)}
                aria-label="Close testimonial details"
              >
                <X size={21} />
              </button>
            </div>

            <div className="at-modal-body">
              <div className="at-detail-author">
                <div className="at-detail-avatar">
                  {selectedTestimonial.image ? (
                    <img
                      src={selectedTestimonial.image}
                      alt={selectedTestimonial.author_name}
                    />
                  ) : (
                    getAuthorInitials(selectedTestimonial.author_name)
                  )}
                </div>

                <div>
                  <h3>{selectedTestimonial.author_name}</h3>
                  <p>
                    {selectedTestimonial.author_role ||
                      "Role not provided"}
                  </p>
                </div>
              </div>

              <div className="at-detail-status-row">
                <span
                  className={`at-status ${getStatusClass(
                    selectedTestimonial.status
                  )}`}
                >
                  {selectedTestimonial.status || "pending"}
                </span>

                {selectedTestimonial.category && (
                  <span className="at-category">
                    <Tag size={13} />
                    {selectedTestimonial.category}
                  </span>
                )}
              </div>

              <div className="at-detail-content">
                <Quote size={26} />
                <p>{selectedTestimonial.content}</p>
              </div>

              <div className="at-detail-date">
                <CalendarDays size={16} />
                <span>
                  Submitted:{" "}
                  {formatDateTime(selectedTestimonial.created_at)}
                </span>
              </div>

              {selectedTestimonial.updated_at && (
                <div className="at-detail-date">
                  <Clock size={16} />
                  <span>
                    Last updated:{" "}
                    {formatDateTime(selectedTestimonial.updated_at)}
                  </span>
                </div>
              )}
            </div>

            <div className="at-modal-footer">
              {canManage && selectedTestimonial.status !== "approved" && (
                <button
                  type="button"
                  className="at-modal-approve"
                  onClick={() =>
                    handleStatusUpdate(
                      selectedTestimonial,
                      "approved"
                    )
                  }
                  disabled={Boolean(updatingId)}
                >
                  <ThumbsUp size={16} />
                  Approve
                </button>
              )}

              {canManage && selectedTestimonial.status !== "rejected" && (
                <button
                  type="button"
                  className="at-modal-reject"
                  onClick={() =>
                    handleStatusUpdate(
                      selectedTestimonial,
                      "rejected"
                    )
                  }
                  disabled={Boolean(updatingId)}
                >
                  <ThumbsDown size={16} />
                  Reject
                </button>
              )}

              {canManage && selectedTestimonial.status !== "pending" && (
                <button
                  type="button"
                  className="at-modal-pending"
                  onClick={() =>
                    handleStatusUpdate(
                      selectedTestimonial,
                      "pending"
                    )
                  }
                  disabled={Boolean(updatingId)}
                >
                  <Clock size={16} />
                  Return to Pending
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  className="at-modal-delete"
                  onClick={() => handleDelete(selectedTestimonial)}
                  disabled={Boolean(deletingId)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
