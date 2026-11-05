import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  X,
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  Building2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-vacancies.css";

const EMPTY_FORM = {
  title: "",
  department: "",
  location: "",
  campus_id: "",
  employment_type: "",
  description: "",
  requirements: [""],
  deadline: "",
  status: "draft",
};

const getErrorMessage = (error) =>
  error?.message || "Something went wrong. Please try again.";

const getVacancyList = (response) =>
  response?.vacancies || response?.data || [];

const getCampusList = (response) =>
  response?.campuses || response?.data || [];

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AdminVacancies = () => {
  const admin = getStoredAdmin();
  const isSuperAdmin = admin?.role === "super_admin";

  const [vacancies, setVacancies] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [viewingVacancy, setViewingVacancy] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadVacancies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vacancies");

      if (!response?.success) {
        throw new Error(response?.message || "Unable to load vacancies.");
      }

      setVacancies(getVacancyList(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadCampuses = async () => {
    try {
      const response = await api.get("/campuses");
      setCampuses(getCampusList(response));
    } catch (err) {
      console.error("Unable to load campuses:", err);
      setCampuses([]);
    }
  };

  useEffect(() => {
    loadVacancies();
    loadCampuses();
  }, []);

  const filteredVacancies = useMemo(() => {
    const term = search.trim().toLowerCase();

    return vacancies.filter((vacancy) => {
      const matchesStatus =
        statusFilter === "all" || vacancy.status === statusFilter;

      const matchesSearch =
        !term ||
        [
          vacancy.title,
          vacancy.department,
          vacancy.location,
          vacancy.employment_type,
          vacancy.campus?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [vacancies, search, statusFilter]);

  const counts = useMemo(
    () => ({
      total: vacancies.length,
      open: vacancies.filter((item) => item.status === "open").length,
      draft: vacancies.filter((item) => item.status === "draft").length,
      closed: vacancies.filter((item) => item.status === "closed").length,
    }),
    [vacancies]
  );

  const showSuccess = (message) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 3500);
  };

  const openCreateForm = () => {
    setEditingVacancy(null);
    setForm({ ...EMPTY_FORM, requirements: [""] });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (vacancy) => {
    setEditingVacancy(vacancy);

    setForm({
      title: vacancy.title || "",
      department: vacancy.department || "",
      location: vacancy.location || "",
      campus_id: vacancy.campus_id || "",
      employment_type: vacancy.employment_type || "",
      description: vacancy.description || "",
      requirements:
        Array.isArray(vacancy.requirements) && vacancy.requirements.length
          ? vacancy.requirements
          : [""],
      deadline: vacancy.deadline || "",
      status: vacancy.status || "draft",
    });

    setError("");
    setViewingVacancy(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingVacancy(null);
    setForm({ ...EMPTY_FORM, requirements: [""] });
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateRequirement = (index, value) => {
    setForm((current) => ({
      ...current,
      requirements: current.requirements.map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  };

  const addRequirement = () => {
    setForm((current) => ({
      ...current,
      requirements: [...current.requirements, ""],
    }));
  };

  const removeRequirement = (index) => {
    setForm((current) => ({
      ...current,
      requirements:
        current.requirements.length === 1
          ? [""]
          : current.requirements.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || form.title.trim().length < 3) {
      setError("Please enter a vacancy title with at least 3 characters.");
      return;
    }

    const requirements = form.requirements
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      department: form.department.trim() || null,
      location: form.location.trim() || null,
      campus_id: form.campus_id || null,
      employment_type: form.employment_type.trim() || null,
      description: form.description.trim() || null,
      requirements,
      deadline: form.deadline || null,
      status: form.status,
    };

    try {
      setSaving(true);

      const response = editingVacancy
        ? await api.patch(`/vacancies/${editingVacancy.id}`, payload)
        : await api.post("/vacancies", payload);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to save vacancy.");
      }

      setShowForm(false);
      setEditingVacancy(null);
      setForm({ ...EMPTY_FORM, requirements: [""] });

      await loadVacancies();

      showSuccess(
        editingVacancy
          ? "Vacancy updated successfully."
          : "Vacancy created successfully."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (vacancy, status) => {
    try {
      setError("");

      const response = await api.patch(`/vacancies/${vacancy.id}`, {
        status,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Unable to update vacancy.");
      }

      await loadVacancies();

      if (viewingVacancy?.id === vacancy.id) {
        setViewingVacancy(response.vacancy || {
          ...vacancy,
          status,
        });
      }

      showSuccess(`Vacancy status changed to ${status}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (vacancy) => {
    if (!isSuperAdmin) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${vacancy.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await api.delete(`/vacancies/${vacancy.id}`);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to delete vacancy.");
      }

      setViewingVacancy(null);
      await loadVacancies();
      showSuccess("Vacancy deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="admin-vacancies">
      <div className="vacancies-header">
        <div>
          <span className="vacancies-eyebrow">CAREER MANAGEMENT</span>
          <h1>Vacancies</h1>
          <p>Create, manage, and publish college job opportunities.</p>
        </div>

        <div className="vacancies-header-actions">
          <button
            type="button"
            className="vacancy-btn vacancy-btn-secondary"
            onClick={loadVacancies}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "vacancy-spinning" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className="vacancy-btn vacancy-btn-primary"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Add Vacancy
          </button>
        </div>
      </div>

      {error && (
        <div className="vacancy-alert vacancy-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss">
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="vacancy-alert vacancy-alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="vacancy-stat-grid">
        <div className="vacancy-stat-card">
          <div className="vacancy-stat-icon vacancy-stat-total">
            <BriefcaseBusiness size={21} />
          </div>
          <div>
            <span>Total Vacancies</span>
            <strong>{counts.total}</strong>
          </div>
        </div>

        <div className="vacancy-stat-card">
          <div className="vacancy-stat-icon vacancy-stat-open">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Open</span>
            <strong>{counts.open}</strong>
          </div>
        </div>

        <div className="vacancy-stat-card">
          <div className="vacancy-stat-icon vacancy-stat-draft">
            <FileText size={21} />
          </div>
          <div>
            <span>Drafts</span>
            <strong>{counts.draft}</strong>
          </div>
        </div>

        <div className="vacancy-stat-card">
          <div className="vacancy-stat-icon vacancy-stat-closed">
            <Clock size={21} />
          </div>
          <div>
            <span>Closed</span>
            <strong>{counts.closed}</strong>
          </div>
        </div>
      </div>

      <section className="vacancy-content-card">
        <div className="vacancy-toolbar">
          <div>
            <h2>All Vacancies</h2>
            <p>Manage the job opportunities displayed on your website.</p>
          </div>

          <div className="vacancy-filters">
            <div className="vacancy-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search vacancies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="vacancy-state">
            <RefreshCw size={25} className="vacancy-spinning" />
            <p>Loading vacancies...</p>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="vacancy-state">
            <BriefcaseBusiness size={38} />
            <h3>No vacancies found</h3>
            <p>
              {search || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Create your first vacancy to get started."}
            </p>
            {!search && statusFilter === "all" && (
              <button
                type="button"
                className="vacancy-btn vacancy-btn-primary"
                onClick={openCreateForm}
              >
                <Plus size={17} />
                Add Vacancy
              </button>
            )}
          </div>
        ) : (
          <div className="vacancy-table-wrap">
            <table className="vacancy-table">
              <thead>
                <tr>
                  <th>Vacancy</th>
                  <th>Campus</th>
                  <th>Employment Type</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVacancies.map((vacancy) => (
                  <tr key={vacancy.id}>
                    <td>
                      <div className="vacancy-title-cell">
                        <strong>{vacancy.title}</strong>
                        <span>{vacancy.department || "No department specified"}</span>
                      </div>
                    </td>

                    <td>
                      <span className="vacancy-campus-cell">
                        <Building2 size={15} />
                        {vacancy.campus?.name || "All campuses"}
                      </span>
                    </td>

                    <td>{vacancy.employment_type || "Not specified"}</td>

                    <td>
                      <span className="vacancy-date-cell">
                        <CalendarDays size={15} />
                        {formatDate(vacancy.deadline)}
                      </span>
                    </td>

                    <td>
                      <span className={`vacancy-status status-${vacancy.status}`}>
                        {vacancy.status}
                      </span>
                    </td>

                    <td>
                      <div className="vacancy-row-actions">
                        <button
                          type="button"
                          title="View vacancy"
                          onClick={() => setViewingVacancy(vacancy)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="Edit vacancy"
                          onClick={() => openEditForm(vacancy)}
                        >
                          <Edit size={17} />
                        </button>

                        {isSuperAdmin && (
                          <button
                            type="button"
                            title="Delete vacancy"
                            className="vacancy-delete-action"
                            onClick={() => handleDelete(vacancy)}
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

        <div className="vacancy-table-footer">
          Showing {filteredVacancies.length} of {vacancies.length} vacancies
        </div>
      </section>

      {showForm && (
        <div className="vacancy-modal-backdrop" onMouseDown={closeForm}>
          <section
            className="vacancy-modal vacancy-form-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vacancy-form-title"
          >
            <div className="vacancy-modal-header">
              <div>
                <span>CAREER MANAGEMENT</span>
                <h2 id="vacancy-form-title">
                  {editingVacancy ? "Edit Vacancy" : "Create Vacancy"}
                </h2>
              </div>

              <button
                type="button"
                className="vacancy-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="vacancy-form-body">
                <div className="vacancy-form-grid">
                  <label className="vacancy-field vacancy-field-full">
                    <span>Vacancy Title *</span>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) => updateField("title", event.target.value)}
                      placeholder="e.g. Accountant"
                      required
                      minLength={3}
                      maxLength={255}
                    />
                  </label>

                  <label className="vacancy-field">
                    <span>Department</span>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(event) =>
                        updateField("department", event.target.value)
                      }
                      placeholder="e.g. Finance"
                      maxLength={150}
                    />
                  </label>

                  <label className="vacancy-field">
                    <span>Employment Type</span>
                    <select
                      value={form.employment_type}
                      onChange={(event) =>
                        updateField("employment_type", event.target.value)
                      }
                    >
                      <option value="">Select employment type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </label>

                  <label className="vacancy-field">
                    <span>Campus</span>
                    <select
                      value={form.campus_id}
                      onChange={(event) =>
                        updateField("campus_id", event.target.value)
                      }
                    >
                      <option value="">All campuses / Not specified</option>
                      {campuses.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                    {campuses.length === 0 && (
                      <small>
                        Campus list could not be loaded. You can still save without selecting a campus.
                      </small>
                    )}
                  </label>

                  <label className="vacancy-field">
                    <span>Location</span>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(event) =>
                        updateField("location", event.target.value)
                      }
                      placeholder="e.g. Asella, Ethiopia"
                      maxLength={255}
                    />
                  </label>

                  <label className="vacancy-field">
                    <span>Application Deadline</span>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(event) =>
                        updateField("deadline", event.target.value)
                      }
                    />
                  </label>

                  <label className="vacancy-field">
                    <span>Publication Status</span>
                    <select
                      value={form.status}
                      onChange={(event) => updateField("status", event.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>

                  <label className="vacancy-field vacancy-field-full">
                    <span>Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      placeholder="Describe the position and its responsibilities..."
                      rows={5}
                      maxLength={10000}
                    />
                  </label>
                </div>

                <div className="vacancy-requirements-section">
                  <div className="vacancy-requirements-heading">
                    <div>
                      <h3>
                        <ListChecks size={18} />
                        Requirements
                      </h3>
                      <p>Add the qualifications and requirements for this position.</p>
                    </div>

                    <button
                      type="button"
                      className="vacancy-add-requirement"
                      onClick={addRequirement}
                    >
                      <Plus size={16} />
                      Add Requirement
                    </button>
                  </div>

                  <div className="vacancy-requirements-list">
                    {form.requirements.map((requirement, index) => (
                      <div className="vacancy-requirement-row" key={index}>
                        <span>{index + 1}</span>
                        <input
                          type="text"
                          value={requirement}
                          onChange={(event) =>
                            updateRequirement(index, event.target.value)
                          }
                          placeholder="Enter a requirement..."
                          maxLength={500}
                        />
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          title="Remove requirement"
                          aria-label="Remove requirement"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="vacancy-modal-footer">
                <button
                  type="button"
                  className="vacancy-btn vacancy-btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vacancy-btn vacancy-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingVacancy ? "Save Changes" : "Create Vacancy"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {viewingVacancy && (
        <div
          className="vacancy-modal-backdrop"
          onMouseDown={() => setViewingVacancy(null)}
        >
          <section
            className="vacancy-modal vacancy-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vacancy-detail-title"
          >
            <div className="vacancy-modal-header">
              <div>
                <span>VACANCY DETAILS</span>
                <h2 id="vacancy-detail-title">{viewingVacancy.title}</h2>
              </div>

              <button
                type="button"
                className="vacancy-modal-close"
                onClick={() => setViewingVacancy(null)}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <div className="vacancy-detail-body">
              <div className="vacancy-detail-meta">
                <span className={`vacancy-status status-${viewingVacancy.status}`}>
                  {viewingVacancy.status}
                </span>
                <span><Building2 size={16} /> {viewingVacancy.campus?.name || "All campuses"}</span>
                <span><MapPin size={16} /> {viewingVacancy.location || "Location not specified"}</span>
                <span><CalendarDays size={16} /> Deadline: {formatDate(viewingVacancy.deadline)}</span>
              </div>

              <div className="vacancy-detail-section">
                <h3>Department</h3>
                <p>{viewingVacancy.department || "Not specified"}</p>
              </div>

              <div className="vacancy-detail-section">
                <h3>Employment Type</h3>
                <p>{viewingVacancy.employment_type || "Not specified"}</p>
              </div>

              <div className="vacancy-detail-section">
                <h3>Description</h3>
                <p className="vacancy-preserve-lines">
                  {viewingVacancy.description || "No description provided."}
                </p>
              </div>

              <div className="vacancy-detail-section">
                <h3>Requirements</h3>
                {Array.isArray(viewingVacancy.requirements) &&
                viewingVacancy.requirements.length > 0 ? (
                  <ul>
                    {viewingVacancy.requirements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No requirements listed.</p>
                )}
              </div>

              <div className="vacancy-detail-section">
                <h3>Created</h3>
                <p>
                  {viewingVacancy.created_at
                    ? new Date(viewingVacancy.created_at).toLocaleString()
                    : "Not available"}
                </p>
              </div>
            </div>

            <div className="vacancy-modal-footer vacancy-detail-footer">
              <div className="vacancy-status-actions">
                <span>Change status:</span>
                <select
                  value={viewingVacancy.status}
                  onChange={(event) =>
                    handleStatusChange(viewingVacancy, event.target.value)
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="vacancy-detail-buttons">
                {isSuperAdmin && (
                  <button
                    type="button"
                    className="vacancy-btn vacancy-btn-danger"
                    onClick={() => handleDelete(viewingVacancy)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  className="vacancy-btn vacancy-btn-secondary"
                  onClick={() => openEditForm(viewingVacancy)}
                >
                  <Edit size={16} />
                  Edit
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminVacancies;