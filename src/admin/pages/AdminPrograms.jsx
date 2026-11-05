
import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  GraduationCap,
  Building2,
  Clock,
  Wallet,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-programs.css";

const emptyForm = {
  title: "",
  category: "",
  level: "",
  duration: "",
  monthly_payment: "",
  modes: "",
  image: "",
  description: "",
  overview: "",
  what_you_learn: "",
  skills: "",
  career_paths: "",
  payment_note: "",
  is_active: true,
};

const formatLines = (items) => {
  return Array.isArray(items) ? items.join("\n") : "";
};

const parseLines = (value) => {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatPayment = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "Not specified";
  }

  return Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
};

const AdminPrograms = () => {
  const admin = getStoredAdmin();
  const role = admin?.role;

  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPrograms = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("/programs/admin/all");

      setPrograms(
        Array.isArray(response?.data) ? response.data : []
      );
    } catch (err) {
      setError(err.message || "Unable to load programs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const stats = useMemo(() => {
    return {
      total: programs.length,
      active: programs.filter((program) => program.is_active).length,
      inactive: programs.filter((program) => !program.is_active).length,
    };
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesSearch =
        !searchValue ||
        program.title?.toLowerCase().includes(searchValue) ||
        program.category?.toLowerCase().includes(searchValue) ||
        program.level?.toLowerCase().includes(searchValue);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && program.is_active) ||
        (filter === "inactive" && !program.is_active);

      return matchesSearch && matchesFilter;
    });
  }, [programs, search, filter]);

  const openAddModal = () => {
    setEditingProgram(null);
    setForm({ ...emptyForm });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (program) => {
    setEditingProgram(program);

    setForm({
      title: program.title || "",
      category: program.category || "",
      level: program.level || "",
      duration: program.duration || "",
      monthly_payment:
        program.monthly_payment === null ||
        program.monthly_payment === undefined
          ? ""
          : String(program.monthly_payment),
      modes: formatLines(program.modes),
      image: program.image || "",
      description: program.description || "",
      overview: program.overview || "",
      what_you_learn: formatLines(program.what_you_learn),
      skills: formatLines(program.skills),
      career_paths: formatLines(program.career_paths),
      payment_note: program.payment_note || "",
      is_active: program.is_active ?? true,
    });

    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingProgram(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    category: form.category.trim() || null,
    level: form.level.trim() || null,
    duration: form.duration.trim() || null,

    monthly_payment:
      form.monthly_payment.trim() === ""
        ? null
        : Number(form.monthly_payment),

    modes: parseLines(form.modes),
    image: form.image.trim() || null,
    description: form.description.trim() || null,
    overview: form.overview.trim() || null,

    what_you_learn: parseLines(form.what_you_learn),
    skills: parseLines(form.skills),
    career_paths: parseLines(form.career_paths),

    payment_note: form.payment_note.trim() || null,
    is_active: form.is_active,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canManage) return;

    if (form.title.trim().length < 3) {
      setError("Program title must contain at least 3 characters.");
      return;
    }

    if (form.title.trim().length > 200) {
      setError("Program title cannot exceed 200 characters.");
      return;
    }

    if (
      form.monthly_payment.trim() !== "" &&
      (!Number.isFinite(Number(form.monthly_payment)) ||
        Number(form.monthly_payment) < 0)
    ) {
      setError("Enter a valid non-negative monthly payment.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const payload = buildPayload();

      if (editingProgram) {
        await api.patch(`/programs/${editingProgram.id}`, payload);
        setNotice("Program updated successfully.");
      } else {
        await api.post("/programs", payload);
        setNotice("Program created successfully.");
      }

      setModalOpen(false);
      setEditingProgram(null);
      setForm({ ...emptyForm });

      await loadPrograms(false);
    } catch (err) {
      setError(err.message || "Unable to save program.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (program) => {
    if (!canManage || updatingId) return;

    const action = program.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${program.title}?`
      )
    ) {
      return;
    }

    try {
      setUpdatingId(program.id);
      setError("");
      setNotice("");

      await api.patch(`/programs/${program.id}`, {
        is_active: !program.is_active,
      });

      setNotice(`${program.title} ${action}d successfully.`);
      await loadPrograms(false);
    } catch (err) {
      setError(err.message || "Unable to update program status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (program) => {
    if (!canDelete || deletingId) return;

    const confirmed = window.confirm(
      `Delete "${program.title}"? This cannot be undone. Its campus assignments will also be removed. Existing student applications will remain, but their program reference will become empty.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(program.id);
      setError("");
      setNotice("");

      await api.delete(`/programs/${program.id}`);

      setPrograms((previous) =>
        previous.filter((item) => item.id !== program.id)
      );

      setNotice(`${program.title} deleted successfully.`);
    } catch (err) {
      setError(err.message || "Unable to delete program.");
    } finally {
      setDeletingId(null);
    }
  };

  const dismissNotice = () => setNotice("");
  const dismissError = () => setError("");

  return (
    <div className="admin-programs-page">
      {/* HEADER */}
      <div className="ap-header">
        <div>
          <span className="ap-eyebrow">ACADEMIC MANAGEMENT</span>

          <div className="ap-heading">
            <div className="ap-heading-icon">
              <GraduationCap size={25} />
            </div>

            <div>
              <h1>Programs</h1>
              <p>
                Manage academic programs and their information.
              </p>
            </div>
          </div>
        </div>

        <div className="ap-header-actions">
          <button
            type="button"
            className="ap-secondary-btn"
            onClick={() => loadPrograms(false)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "ap-spinning" : ""}
            />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              className="ap-primary-btn"
              onClick={openAddModal}
            >
              <Plus size={19} />
              Add Program
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {notice && (
        <div className="ap-alert success">
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

      {error && !modalOpen && (
        <div className="ap-alert error">
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
      <div className="ap-stats">
        <div className="ap-stat-card">
          <div className="ap-stat-icon total">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Total Programs</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="ap-stat-card">
          <div className="ap-stat-icon active">
            <CheckCircle size={22} />
          </div>

          <div>
            <span>Active Programs</span>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="ap-stat-card">
          <div className="ap-stat-icon inactive">
            <XCircle size={22} />
          </div>

          <div>
            <span>Inactive Programs</span>
            <strong>{stats.inactive}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="ap-toolbar">
        <div className="ap-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search by program, category, or level..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter programs"
        >
          <option value="all">All Programs</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* PROGRAM TABLE */}
      <div className="ap-table-card">
        <div className="ap-table-heading">
          <div>
            <h2>All Programs</h2>
            <p>
              Showing {filteredPrograms.length} of {programs.length} programs
            </p>
          </div>
        </div>

        {loading ? (
          <div className="ap-loading">
            <Loader2 size={30} className="ap-spinning" />
            <span>Loading programs...</span>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-icon">
              <BookOpen size={38} />
            </div>

            <h3>
              {programs.length === 0
                ? "No programs found"
                : "No matching programs"}
            </h3>

            <p>
              {programs.length === 0
                ? "Add your first academic program to get started."
                : "Try changing your search or status filter."}
            </p>

            {canManage && programs.length === 0 && (
              <button
                type="button"
                className="ap-primary-btn"
                onClick={openAddModal}
              >
                <Plus size={18} />
                Add First Program
              </button>
            )}
          </div>
        ) : (
          <div className="ap-table-scroll">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Category & Level</th>
                  <th>Duration & Fee</th>
                  <th>Campuses</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPrograms.map((program) => (
                  <tr key={program.id}>
                    <td>
                      <div className="ap-program-cell">
                        <div className="ap-program-image">
                          {program.image ? (
                            <img
                              src={program.image}
                              alt={program.title}
                            />
                          ) : (
                            <ImageIcon size={22} />
                          )}
                        </div>

                        <div className="ap-program-info">
                          <strong>{program.title}</strong>
                          <span>/{program.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="ap-program-meta">
                        <strong>
                          {program.category || "Uncategorized"}
                        </strong>
                        <span>{program.level || "Level not specified"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="ap-program-meta">
                        <span>
                          <Clock size={14} />
                          {program.duration || "Not specified"}
                        </span>

                        <span>
                          <Wallet size={14} />
                          {formatPayment(program.monthly_payment)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="ap-campus-list">
                        {Array.isArray(program.campuses) &&
                        program.campuses.length > 0 ? (
                          <>
                            {program.campuses.slice(0, 2).map((campus) => (
                              <span key={campus.id}>
                                {campus.name}
                              </span>
                            ))}

                            {program.campuses.length > 2 && (
                              <small>
                                +{program.campuses.length - 2} more
                              </small>
                            )}
                          </>
                        ) : (
                          <span className="ap-muted">No campus assigned</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`ap-status ${
                          program.is_active ? "active" : "inactive"
                        }`}
                      >
                        {program.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="ap-actions">
                        {canManage && (
                          <button
                            type="button"
                            className="ap-action edit"
                            title="Edit program"
                            onClick={() => openEditModal(program)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            className="ap-action status"
                            title={
                              program.is_active
                                ? "Deactivate program"
                                : "Activate program"
                            }
                            onClick={() => handleToggleStatus(program)}
                            disabled={
                              updatingId !== null ||
                              deletingId !== null
                            }
                          >
                            {updatingId === program.id ? (
                              <Loader2 size={16} className="ap-spinning" />
                            ) : program.is_active ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="ap-action delete"
                            title="Delete program"
                            onClick={() => handleDelete(program)}
                            disabled={
                              deletingId !== null ||
                              updatingId !== null
                            }
                          >
                            {deletingId === program.id ? (
                              <Loader2 size={16} className="ap-spinning" />
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

      {/* ADD / EDIT PROGRAM MODAL */}
      {modalOpen && (
        <div
          className="ap-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="ap-modal">
            <div className="ap-modal-header">
              <div>
                <span>PROGRAM INFORMATION</span>
                <h2>
                  {editingProgram ? "Edit Program" : "Add New Program"}
                </h2>
                <p>
                  {editingProgram
                    ? "Update the academic program information."
                    : "Enter the details of the new academic program."}
                </p>
              </div>

              <button
                type="button"
                className="ap-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="ap-modal-form"
              onSubmit={handleSubmit}
            >
              <div className="ap-modal-body">
                {error && (
                  <div className="ap-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="ap-section-heading">
                  <BookOpen size={18} />
                  <h3>Basic Information</h3>
                </div>

                <div className="ap-form-grid">
                  <label className="ap-form-group ap-full-width">
                    Program Title *
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Business Management"
                      maxLength={200}
                      required
                    />
                  </label>

                  <label className="ap-form-group">
                    Category
                    <input
                      type="text"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="e.g. Degree Programs"
                      maxLength={100}
                    />
                  </label>

                  <label className="ap-form-group">
                    Education Level
                    <input
                      type="text"
                      name="level"
                      value={form.level}
                      onChange={handleChange}
                      placeholder="e.g. Degree"
                      maxLength={100}
                    />
                  </label>

                  <label className="ap-form-group">
                    Duration
                    <input
                      type="text"
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      placeholder="e.g. 4 Years"
                      maxLength={100}
                    />
                  </label>

                  <label className="ap-form-group">
                    Monthly Payment
                    <input
                      type="number"
                      name="monthly_payment"
                      value={form.monthly_payment}
                      onChange={handleChange}
                      placeholder="Enter monthly payment"
                      min="0"
                      step="0.01"
                    />
                  </label>

                  <label className="ap-form-group ap-full-width">
                    Program Image URL
                    <input
                      type="url"
                      name="image"
                      value={form.image}
                      onChange={handleChange}
                      placeholder="https://example.com/program-image.jpg"
                    />
                    <small>
                      Enter the public URL of the program image.
                    </small>
                  </label>

                  {form.image && (
                    <div className="ap-image-preview ap-full-width">
                      <img
                        src={form.image}
                        alt="Program preview"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <label className="ap-form-group ap-full-width">
                    Program Modes
                    <textarea
                      name="modes"
                      value={form.modes}
                      onChange={handleChange}
                      placeholder={"Regular\nExtension\nDistance\nRemedial"}
                      rows={4}
                    />
                    <small>Enter one mode per line.</small>
                  </label>
                </div>

                <div className="ap-section-heading">
                  <GraduationCap size={18} />
                  <h3>Program Description</h3>
                </div>

                <div className="ap-form-grid">
                  <label className="ap-form-group ap-full-width">
                    Short Description
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Write a short description of this program..."
                      rows={3}
                    />
                  </label>

                  <label className="ap-form-group ap-full-width">
                    Program Overview
                    <textarea
                      name="overview"
                      value={form.overview}
                      onChange={handleChange}
                      placeholder="Describe the program and what students can expect..."
                      rows={5}
                    />
                  </label>
                </div>

                <div className="ap-section-heading">
                  <CheckCircle size={18} />
                  <h3>Learning and Career Information</h3>
                </div>

                <div className="ap-form-grid">
                  <label className="ap-form-group ap-full-width">
                    What Students Will Learn
                    <textarea
                      name="what_you_learn"
                      value={form.what_you_learn}
                      onChange={handleChange}
                      placeholder={
                        "Business management principles\nMarketing fundamentals\nEntrepreneurship"
                      }
                      rows={5}
                    />
                    <small>Enter one learning outcome per line.</small>
                  </label>

                  <label className="ap-form-group ap-full-width">
                    Skills Students Will Develop
                    <textarea
                      name="skills"
                      value={form.skills}
                      onChange={handleChange}
                      placeholder={
                        "Leadership and teamwork\nCommunication\nProblem solving"
                      }
                      rows={5}
                    />
                    <small>Enter one skill per line.</small>
                  </label>

                  <label className="ap-form-group ap-full-width">
                    Career Opportunities
                    <textarea
                      name="career_paths"
                      value={form.career_paths}
                      onChange={handleChange}
                      placeholder={
                        "Business administration\nManagement support roles\nEntrepreneurship"
                      }
                      rows={5}
                    />
                    <small>Enter one career path per line.</small>
                  </label>
                </div>

                <div className="ap-section-heading">
                  <Wallet size={18} />
                  <h3>Payment Information</h3>
                </div>

                <label className="ap-form-group">
                  Payment Note
                  <textarea
                    name="payment_note"
                    value={form.payment_note}
                    onChange={handleChange}
                    placeholder="e.g. Contact the college for current monthly fee"
                    rows={3}
                  />
                </label>

                <label className="ap-active-checkbox">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />

                  <span>
                    <strong>Program is active</strong>
                    <small>
                      Active programs are displayed on the public website.
                    </small>
                  </span>
                </label>
              </div>

              <div className="ap-modal-footer">
                <button
                  type="button"
                  className="ap-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ap-primary-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="ap-spinning" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingProgram ? "Save Changes" : "Create Program"}
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
};

export default AdminPrograms;
