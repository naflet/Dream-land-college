
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  X,
  CalendarDays,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-academic-calendar.css";

/* ==========================================================
   API HELPERS
========================================================== */

const getResponseData = (response) => {
  let result = response;

  for (let i = 0; i < 3; i += 1) {
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      result.data !== undefined &&
      result.events === undefined &&
      result.calendarEvents === undefined
    ) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
};

const getEventsFromResponse = (response) => {
  const result = getResponseData(response);

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.events)) return result.events;
  if (Array.isArray(result?.calendarEvents)) {
    return result.calendarEvents;
  }
  if (Array.isArray(result?.data?.events)) {
    return result.data.events;
  }
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;

  return [];
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

const normalizeEvent = (event) => ({
  ...event,
  title: event.title || "",
  description: event.description || "",
  event_date: event.event_date || "",
  event_type: event.event_type || "Other",
  academic_year: event.academic_year || "",
  is_published:
    event.is_published === true ||
    event.is_published === "true" ||
    event.is_published === 1,
});

/* ==========================================================
   DATE HELPERS
========================================================== */

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatEventDate = (date) => {
  if (!date) return "—";

  const dateValue = String(date).slice(0, 10);
  const parsedDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ==========================================================
   EVENT TYPE
========================================================== */

const getEventTypeClass = (type) => {
  const normalizedType = String(type || "Other").toLowerCase();

  const allowedTypes = [
    "academic",
    "registration",
    "examination",
    "holiday",
    "admission",
    "event",
  ];

  return allowedTypes.includes(normalizedType)
    ? normalizedType
    : "other";
};

/* ==========================================================
   EMPTY FORM
========================================================== */

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  event_type: "Academic",
  academic_year: "",
  is_published: false,
};

/* ==========================================================
   ADMIN ACADEMIC CALENDAR
========================================================== */

export default function AdminAcademicCalendar() {
  const admin = getStoredAdmin();
  const role = admin?.role || "";

  // Only Super Admin and Admin can manage calendar events.
  const canManage = ["super_admin", "admin"].includes(role);

  // Only Super Admin can delete calendar events.
  const canDelete = role === "super_admin";

  /* ========================================================
     STATE
  ======================================================== */

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [alert, setAlert] = useState(null);

  /* ========================================================
     ALERT
  ======================================================== */

  const showAlert = useCallback((type, message) => {
    setAlert({ type, message });
  }, []);

  /* ========================================================
     FETCH EVENTS FROM BACKEND
  ======================================================== */

  const fetchEvents = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Admin endpoint returns both published and draft events.
      const response = await api.get("/academic-calendar/admin");

      const fetchedEvents = getEventsFromResponse(response);

      setEvents(fetchedEvents.map(normalizeEvent));
    } catch (error) {
      console.error(
        "Failed to load academic calendar:",
        error
      );

      showAlert(
        "error",
        getErrorMessage(
          error,
          "Unable to load academic calendar events."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ========================================================
     STATISTICS
  ======================================================== */

  const today = getTodayDate();

  const statistics = useMemo(() => {
    const total = events.length;

    const published = events.filter(
      (event) => event.is_published
    ).length;

    const drafts = total - published;

    const upcoming = events.filter(
      (event) =>
        event.is_published &&
        event.event_date >= today
    ).length;

    return {
      total,
      published,
      drafts,
      upcoming,
    };
  }, [events, today]);

  /* ========================================================
     SEARCH AND FILTER
  ======================================================== */

  const filteredEvents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !searchValue ||
        event.title.toLowerCase().includes(searchValue) ||
        event.description.toLowerCase().includes(searchValue) ||
        event.event_type.toLowerCase().includes(searchValue) ||
        event.academic_year.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && event.is_published) ||
        (statusFilter === "draft" && !event.is_published);

      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  /* ========================================================
     FORM HANDLERS
  ======================================================== */

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ========================================================
     MODAL HANDLERS
  ======================================================== */

  const openCreateModal = () => {
    if (!canManage) return;

    setEditingEvent(null);
    setForm({ ...emptyForm });
    setAlert(null);
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    if (!canManage) return;

    setEditingEvent(event);

    setForm({
      title: event.title || "",
      description: event.description || "",
      event_date: event.event_date
        ? String(event.event_date).slice(0, 10)
        : "",
      event_type: event.event_type || "Academic",
      academic_year: event.academic_year || "",
      is_published: event.is_published === true,
    });

    setAlert(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingEvent(null);
    setForm({ ...emptyForm });
  };

  /* ========================================================
     CREATE / UPDATE EVENT
  ======================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canManage) {
      showAlert(
        "error",
        "You do not have permission to manage calendar events."
      );
      return;
    }

    if (form.title.trim().length < 3) {
      showAlert(
        "error",
        "Event title must contain at least 3 characters."
      );
      return;
    }

    if (!form.event_date) {
      showAlert("error", "Please select an event date.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      event_type: form.event_type.trim() || "Academic",
      academic_year: form.academic_year.trim() || null,
      is_published: Boolean(form.is_published),
    };

    try {
      setSaving(true);
      setAlert(null);

      if (editingEvent) {
        await api.patch(
          `/academic-calendar/${editingEvent.id}`,
          payload
        );

        showAlert(
          "success",
          "Academic calendar event updated successfully."
        );
      } else {
        await api.post(
          "/academic-calendar",
          payload
        );

        showAlert(
          "success",
          "Academic calendar event created successfully."
        );
      }

      setModalOpen(false);
      setEditingEvent(null);
      setForm({ ...emptyForm });

      await fetchEvents(true);
    } catch (error) {
      console.error(
        "Failed to save calendar event:",
        error
      );

      showAlert(
        "error",
        getErrorMessage(
          error,
          "Unable to save academic calendar event."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================
     DELETE EVENT
  ======================================================== */

  const handleDelete = async (event) => {
    if (!canDelete) {
      showAlert(
        "error",
        "Only the Super Admin can delete calendar events."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(event.id);
      setAlert(null);

      await api.delete(
        `/academic-calendar/${event.id}`
      );

      setEvents((previous) =>
        previous.filter((item) => item.id !== event.id)
      );

      showAlert(
        "success",
        "Academic calendar event deleted successfully."
      );
    } catch (error) {
      console.error(
        "Failed to delete calendar event:",
        error
      );

      showAlert(
        "error",
        getErrorMessage(
          error,
          "Unable to delete academic calendar event."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="admin-calendar-page">

      {/* PAGE HEADER */}

      <div className="admin-calendar-header">
        <div className="admin-calendar-header-content">
          <h1>Academic Calendar</h1>

          <p>
            Manage academic schedules, registration dates,
            examinations, holidays, and important college events.
          </p>
        </div>

        <div className="admin-calendar-header-actions">
          <button
            type="button"
            className="admin-calendar-btn admin-calendar-btn-secondary"
            onClick={() => fetchEvents(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {canManage && (
            <button
              type="button"
              className="admin-calendar-btn admin-calendar-btn-primary"
              onClick={openCreateModal}
            >
              <Plus size={17} />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* ALERT */}

      {alert && (
        <div
          className={`admin-calendar-alert ${alert.type}`}
          role="alert"
        >
          {alert.type === "success" ? (
            <CheckCircle size={17} />
          ) : (
            <AlertCircle size={17} />
          )}

          <span>{alert.message}</span>

          <button
            type="button"
            onClick={() => setAlert(null)}
            aria-label="Close alert"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="admin-calendar-stats">
        <div className="admin-calendar-stat-card">
          <div className="admin-calendar-stat-icon total">
            <CalendarDays size={21} />
          </div>

          <div className="admin-calendar-stat-info">
            <span>Total Events</span>
            <strong>{statistics.total}</strong>
          </div>
        </div>

        <div className="admin-calendar-stat-card">
          <div className="admin-calendar-stat-icon published">
            <CheckCircle size={21} />
          </div>

          <div className="admin-calendar-stat-info">
            <span>Published</span>
            <strong>{statistics.published}</strong>
          </div>
        </div>

        <div className="admin-calendar-stat-card">
          <div className="admin-calendar-stat-icon draft">
            <FileText size={21} />
          </div>

          <div className="admin-calendar-stat-info">
            <span>Drafts</span>
            <strong>{statistics.drafts}</strong>
          </div>
        </div>

        <div className="admin-calendar-stat-card">
          <div className="admin-calendar-stat-icon upcoming">
            <Clock size={21} />
          </div>

          <div className="admin-calendar-stat-info">
            <span>Upcoming Published</span>
            <strong>{statistics.upcoming}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER */}

      <div className="admin-calendar-toolbar">
        <div className="admin-calendar-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search calendar events..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-calendar-filter">
          <label htmlFor="calendar-status-filter">
            Status:
          </label>

          <select
            id="calendar-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Events</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* EVENTS TABLE */}

      <div className="admin-calendar-table-container">
        {loading ? (
          <div className="admin-calendar-loading">
            <RefreshCw
              size={25}
              className="animate-spin"
            />
            <p>Loading academic calendar events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="admin-calendar-empty">
            <CalendarDays size={38} />

            <strong>
              {search || statusFilter !== "all"
                ? "No matching events found"
                : "No calendar events yet"}
            </strong>

            <p>
              {search || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Add your first academic calendar event to get started."}
            </p>

            {canManage &&
              events.length === 0 &&
              !search &&
              statusFilter === "all" && (
                <button
                  type="button"
                  className="admin-calendar-btn admin-calendar-btn-primary"
                  onClick={openCreateModal}
                >
                  <Plus size={17} />
                  Add First Event
                </button>
              )}
          </div>
        ) : (
          <table className="admin-calendar-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Event Type</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <span className="admin-calendar-event-title">
                      {event.title}
                    </span>

                    {event.description && (
                      <span className="admin-calendar-event-description">
                        {event.description}
                      </span>
                    )}
                  </td>

                  <td>
                    <span className="admin-calendar-date">
                      {formatEventDate(event.event_date)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-calendar-type ${getEventTypeClass(
                        event.event_type
                      )}`}
                    >
                      {event.event_type || "Other"}
                    </span>
                  </td>

                  <td>
                    <span className="admin-calendar-year">
                      {event.academic_year || "—"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-calendar-status ${
                        event.is_published
                          ? "published"
                          : "draft"
                      }`}
                    >
                      {event.is_published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-calendar-actions">
                      {canManage && (
                        <button
                          type="button"
                          className="admin-calendar-action-btn"
                          title="Edit event"
                          onClick={() => openEditModal(event)}
                        >
                          <Edit size={15} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="admin-calendar-action-btn delete"
                          title="Delete event"
                          onClick={() => handleDelete(event)}
                          disabled={deletingId === event.id}
                        >
                          {deletingId === event.id ? (
                            <RefreshCw
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      )}

                      {!canManage && !canDelete && (
                        <span title="View only">
                          <Eye size={16} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}

      {modalOpen && (
        <div
          className="admin-calendar-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-modal-title"
          >
            <div className="admin-calendar-modal-header">
              <div>
                <h2 id="calendar-modal-title">
                  {editingEvent
                    ? "Edit Calendar Event"
                    : "Add Calendar Event"}
                </h2>

                <p>
                  {editingEvent
                    ? "Update the details of this academic event."
                    : "Enter the details for your new academic event."}
                </p>
              </div>

              <button
                type="button"
                className="admin-calendar-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-calendar-modal-body">
                <div className="admin-calendar-form">

                  {/* EVENT TITLE */}

                  <div className="admin-calendar-form-group">
                    <label htmlFor="calendar-title">
                      Event Title <span>*</span>
                    </label>

                    <input
                      id="calendar-title"
                      type="text"
                      name="title"
                      placeholder="Enter event title"
                      value={form.title}
                      onChange={handleFormChange}
                      maxLength={255}
                      required
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="admin-calendar-form-group">
                    <label htmlFor="calendar-description">
                      Description
                    </label>

                    <textarea
                      id="calendar-description"
                      name="description"
                      placeholder="Enter event description..."
                      value={form.description}
                      onChange={handleFormChange}
                      rows={4}
                      maxLength={5000}
                    />
                  </div>

                  {/* DATE AND EVENT TYPE */}

                  <div className="admin-calendar-form-row">
                    <div className="admin-calendar-form-group">
                      <label htmlFor="calendar-date">
                        Event Date <span>*</span>
                      </label>

                      <input
                        id="calendar-date"
                        type="date"
                        name="event_date"
                        value={form.event_date}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="admin-calendar-form-group">
                      <label htmlFor="calendar-event-type">
                        Event Type
                      </label>

                      <select
                        id="calendar-event-type"
                        name="event_type"
                        value={form.event_type}
                        onChange={handleFormChange}
                      >
                        <option value="Academic">Academic</option>
                        <option value="Registration">Registration</option>
                        <option value="Examination">Examination</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Event">Event</option>
                        <option value="Admission">Admission</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* ACADEMIC YEAR */}

                  <div className="admin-calendar-form-group">
                    <label htmlFor="calendar-academic-year">
                      Academic Year
                    </label>

                    <input
                      id="calendar-academic-year"
                      type="text"
                      name="academic_year"
                      placeholder="Example: 2026/2027"
                      value={form.academic_year}
                      onChange={handleFormChange}
                      maxLength={50}
                    />
                  </div>

                  {/* PUBLISH OPTION */}

                  <div className="admin-calendar-publish-option">
                    <input
                      id="calendar-publish"
                      type="checkbox"
                      name="is_published"
                      checked={form.is_published}
                      onChange={handleFormChange}
                    />

                    <label htmlFor="calendar-publish">
                      Publish this event

                      <span>
                        Published events will be visible on the public
                        college website.
                      </span>
                    </label>
                  </div>

                </div>
              </div>

              {/* MODAL FOOTER */}

              <div className="admin-calendar-modal-footer">
                <button
                  type="button"
                  className="admin-calendar-btn admin-calendar-btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-calendar-btn admin-calendar-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} />
                      {editingEvent
                        ? "Update Event"
                        : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
