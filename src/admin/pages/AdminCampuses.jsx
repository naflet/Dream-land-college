
import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  MapPin,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Phone,
  Mail,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Check,
  CirclePlus,
  CircleMinus,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import campusService from "../services/campusService";
import "../styles/admin-campuses.css";

const emptyForm = {
  name: "",
  slug: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  facilities: "",
  map_url: "",
  image_path: "",
  is_active: true,
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const AdminCampuses = () => {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Program assignment state
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [assignedProgramIds, setAssignedProgramIds] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [updatingProgramId, setUpdatingProgramId] = useState(null);
  const [programError, setProgramError] = useState("");
  const [programSearch, setProgramSearch] = useState("");

  const admin = getStoredAdmin();
  const canManagePrograms = ["super_admin", "admin"].includes(admin?.role);

  const loadCampuses = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await campusService.getAllCampuses();
      setCampuses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load campuses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampuses();
  }, []);

  const filteredCampuses = campuses.filter((campus) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      campus.name?.toLowerCase().includes(searchValue) ||
      campus.slug?.toLowerCase().includes(searchValue) ||
      campus.address?.toLowerCase().includes(searchValue);

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && campus.is_active) ||
      (filter === "inactive" && !campus.is_active);

    return matchesSearch && matchesFilter;
  });

  // Open add campus modal
  const openAddModal = () => {
    setEditingCampus(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview("");
    setError("");
    setModalOpen(true);
  };

  // Open edit campus modal
  const openEditModal = (campus) => {
    setEditingCampus(campus);

    setForm({
      name: campus.name || "",
      slug: campus.slug || "",
      address: campus.address || "",
      phone: campus.phone || "",
      email: campus.email || "",
      description: campus.description || "",
      facilities: Array.isArray(campus.facilities)
        ? campus.facilities.join(", ")
        : "",
      map_url: campus.map_url || "",
      image_path: campus.image_path || "",
      is_active: campus.is_active ?? true,
    });

    setSelectedImage(null);
    setImagePreview(campus.image || "");
    setError("");
    setModalOpen(true);
  };

  // Close campus modal
  const closeModal = () => {
    if (saving || uploadingImage) return;

    setModalOpen(false);
    setEditingCampus(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview("");
    setError("");
  };

  // Handle form changes
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Select campus image
  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));

    event.target.value = "";
  };

  // Remove selected or existing campus image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");

    setForm((previous) => ({
      ...previous,
      image_path: "",
    }));
  };

  // Upload selected image to Supabase Storage
  const uploadCampusImage = async () => {
    if (!selectedImage) {
      return form.image_path;
    }

    try {
      setUploadingImage(true);

      const response = await campusService.uploadImage(selectedImage);

      if (!response?.image_path) {
        throw new Error(
          "Image upload did not return an image path."
        );
      }

      return response.image_path;
    } finally {
      setUploadingImage(false);
    }
  };

  // Create or update campus
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.slug.trim()) {
      setError("Campus name and slug are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Upload image first, just like the News upload process.
      const imagePath = await uploadCampusImage();

      const campusData = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        description: form.description.trim() || null,
        map_url: form.map_url.trim() || null,
        image_path: imagePath || null,
        facilities: form.facilities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingCampus) {
        await campusService.updateCampus(
          editingCampus.id,
          campusData
        );

        setNotice("Campus updated successfully.");
      } else {
        await campusService.createCampus(campusData);

        setNotice("Campus created successfully.");
      }

      setModalOpen(false);
      setEditingCampus(null);
      setForm({ ...emptyForm });
      setSelectedImage(null);
      setImagePreview("");

      await loadCampuses();
    } catch (err) {
      setError(err.message || "Unable to save campus.");
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate campus
  const handleToggleStatus = async (campus) => {
    const action = campus.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${campus.name}?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setNotice("");

      await campusService.updateCampus(campus.id, {
        is_active: !campus.is_active,
      });

      setNotice(`${campus.name} ${action}d successfully.`);
      await loadCampuses();
    } catch (err) {
      setError(err.message || "Unable to update campus status.");
    }
  };

  // Delete campus
  const handleDelete = async (campus) => {
    if (
      !window.confirm(
        `Delete ${campus.name}? This action cannot be undone. Campuses assigned to programs cannot be deleted.`
      )
    ) {
      return;
    }

    try {
      setError("");
      setNotice("");

      await campusService.deleteCampus(campus.id);

      setNotice(`${campus.name} deleted successfully.`);
      await loadCampuses();
    } catch (err) {
      setError(err.message || "Unable to delete campus.");
    }
  };

  // Open program assignment manager
  const openProgramManager = async (campus) => {
    setSelectedCampus(campus);
    setProgramModalOpen(true);
    setProgramSearch("");
    setProgramError("");
    setPrograms([]);
    setAssignedProgramIds([]);

    try {
      setLoadingPrograms(true);

      const [programResponse, assignedResponse] = await Promise.all([
        api.get("/programs"),
        api.get(`/programs/campus/${campus.id}`),
      ]);

      const allPrograms = Array.isArray(programResponse?.data)
        ? programResponse.data
        : [];

      const assignedPrograms = Array.isArray(assignedResponse?.data)
        ? assignedResponse.data
        : [];

      setPrograms(allPrograms);

      setAssignedProgramIds(
        assignedPrograms.map((program) => program.id)
      );
    } catch (err) {
      setProgramError(
        err.message || "Unable to load campus program assignments."
      );
    } finally {
      setLoadingPrograms(false);
    }
  };

  const closeProgramManager = () => {
    if (updatingProgramId) return;

    setProgramModalOpen(false);
    setSelectedCampus(null);
    setPrograms([]);
    setAssignedProgramIds([]);
    setProgramError("");
    setProgramSearch("");
  };

  // Assign or remove one program
  const handleProgramAssignment = async (program) => {
    if (!selectedCampus || updatingProgramId) return;

    const isAssigned = assignedProgramIds.includes(program.id);
    const action = isAssigned ? "unassign" : "assign";

    try {
      setUpdatingProgramId(program.id);
      setProgramError("");
      setNotice("");

      const response = await api.patch(
        `/programs/campus/${selectedCampus.id}/assignment`,
        {
          programId: program.id,
          action,
        }
      );

      if (!response?.success) {
        throw new Error("Unable to update this program assignment.");
      }

      setAssignedProgramIds((previous) => {
        if (action === "assign") {
          return previous.includes(program.id)
            ? previous
            : [...previous, program.id];
        }

        return previous.filter((id) => id !== program.id);
      });

      setNotice(
        action === "assign"
          ? `${program.title} assigned to ${selectedCampus.name}.`
          : `${program.title} removed from ${selectedCampus.name}.`
      );
    } catch (err) {
      setProgramError(
        err.message || "Unable to update program assignment."
      );
    } finally {
      setUpdatingProgramId(null);
    }
  };

  const filteredPrograms = programs.filter((program) =>
    `${program.title} ${program.category || ""} ${program.level || ""}`
      .toLowerCase()
      .includes(programSearch.toLowerCase())
  );

  return (
    <div className="admin-campuses">
      <div className="campuses-header">
        <div>
          <span className="campuses-eyebrow">CAMPUS MANAGEMENT</span>
          <h1>Campuses</h1>
          <p>Manage your college branches and campus information.</p>
        </div>

        <button className="campus-primary-btn" onClick={openAddModal}>
          <Plus size={19} />
          Add Campus
        </button>
      </div>

      <div className="campus-stats">
        <div className="campus-stat-card">
          <div className="campus-stat-icon">
            <Building2 size={21} />
          </div>
          <div>
            <span>Total Campuses</span>
            <strong>{campuses.length}</strong>
          </div>
        </div>

        <div className="campus-stat-card">
          <div className="campus-stat-icon active">
            <CheckCircle size={21} />
          </div>
          <div>
            <span>Active Campuses</span>
            <strong>
              {campuses.filter((campus) => campus.is_active).length}
            </strong>
          </div>
        </div>

        <div className="campus-stat-card">
          <div className="campus-stat-icon inactive">
            <XCircle size={21} />
          </div>
          <div>
            <span>Inactive Campuses</span>
            <strong>
              {campuses.filter((campus) => !campus.is_active).length}
            </strong>
          </div>
        </div>
      </div>

      {notice && (
        <div className="campus-alert success">
          <CheckCircle size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={17} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="campus-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="campuses-toolbar">
        <div className="campus-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search campuses..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter campuses"
        >
          <option value="all">All Campuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <button
          className="campus-refresh-btn"
          onClick={loadCampuses}
          disabled={loading}
          title="Refresh campuses"
        >
          <RefreshCw
            size={18}
            className={loading ? "spinning" : ""}
          />
        </button>
      </div>

      <div className="campuses-table-card">
        <div className="campuses-table-heading">
          <div>
            <h2>All Campuses</h2>
            <p>{filteredCampuses.length} campus records found</p>
          </div>
        </div>

        {loading ? (
          <div className="campus-loading">
            <Loader2 size={30} className="spinning" />
            <span>Loading campuses...</span>
          </div>
        ) : filteredCampuses.length === 0 ? (
          <div className="campus-empty">
            <Building2 size={38} />
            <h3>No campuses found</h3>
            <p>Try another search or add a new campus.</p>
          </div>
        ) : (
          <div className="campuses-table-scroll">
            <table className="campuses-table">
              <thead>
                <tr>
                  <th>Campus</th>
                  <th>Contact Information</th>
                  <th>Facilities</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCampuses.map((campus) => (
                  <tr key={campus.id}>
                    <td>
                      <div className="campus-name-cell">
                        <div className="campus-avatar">
                          {campus.image ? (
                            <img
                              src={campus.image}
                              alt={campus.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "inherit",
                              }}
                            />
                          ) : (
                            <MapPin size={19} />
                          )}
                        </div>

                        <div>
                          <strong>{campus.name}</strong>
                          <span>/{campus.slug}</span>
                          {campus.address && (
                            <small>{campus.address}</small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="campus-contact-cell">
                        {campus.phone && (
                          <span>
                            <Phone size={14} />
                            {campus.phone}
                          </span>
                        )}

                        {campus.email && (
                          <span>
                            <Mail size={14} />
                            {campus.email}
                          </span>
                        )}

                        {!campus.phone && !campus.email && (
                          <span className="campus-muted">
                            Not provided
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="campus-facilities">
                        {Array.isArray(campus.facilities) &&
                        campus.facilities.length > 0 ? (
                          <>
                            {campus.facilities.slice(0, 2).map((facility) => (
                              <span key={facility}>{facility}</span>
                            ))}

                            {campus.facilities.length > 2 && (
                              <small>
                                +{campus.facilities.length - 2} more
                              </small>
                            )}
                          </>
                        ) : (
                          <span className="campus-muted">
                            None listed
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`campus-status ${
                          campus.is_active ? "is-active" : "is-inactive"
                        }`}
                      >
                        {campus.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="campus-actions">
                        <button
                          className="campus-action programs"
                          onClick={() => openProgramManager(campus)}
                          title="Manage campus programs"
                        >
                          <BookOpen size={16} />
                        </button>

                        <button
                          className="campus-action edit"
                          onClick={() => openEditModal(campus)}
                          title="Edit campus"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="campus-action status"
                          onClick={() => handleToggleStatus(campus)}
                          title={
                            campus.is_active
                              ? "Deactivate campus"
                              : "Activate campus"
                          }
                        >
                          {campus.is_active ? (
                            <XCircle size={16} />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                        </button>

                        <button
                          className="campus-action delete"
                          onClick={() => handleDelete(campus)}
                          title="Delete campus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CAMPUS INFORMATION MODAL */}
      {modalOpen && (
        <div
          className="campus-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="campus-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="campus-modal-header">
              <div>
                <span>CAMPUS INFORMATION</span>
                <h2>
                  {editingCampus ? "Edit Campus" : "Add New Campus"}
                </h2>
              </div>

              <button
                className="campus-modal-close"
                onClick={closeModal}
                disabled={saving || uploadingImage}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="campus-alert error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="campus-form-grid">
                <label>
                  Campus Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Addis Ababa"
                    required
                  />
                </label>

                <label>
                  Campus Slug *
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="e.g. addis-ababa"
                    required
                  />
                </label>

                <label className="full-width">
                  Address
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Campus address"
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+251..."
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="campus@example.com"
                  />
                </label>

                <label className="full-width">
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe this campus..."
                    rows={3}
                  />
                </label>

                <label className="full-width">
                  Facilities
                  <input
                    name="facilities"
                    value={form.facilities}
                    onChange={handleChange}
                    placeholder="Library, Computer Lab, Cafeteria"
                  />
                  <small>Separate facilities with commas.</small>
                </label>

                {/* CAMPUS IMAGE UPLOAD */}
                <div
                  className="full-width"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <label>Campus Image</label>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      padding: "16px",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "12px",
                      background: "#f8fafc",
                    }}
                  >
                    {imagePreview ? (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          maxWidth: "340px",
                        }}
                      >
                        <img
                          src={imagePreview}
                          alt="Campus preview"
                          style={{
                            display: "block",
                            width: "100%",
                            height: "190px",
                            objectFit: "cover",
                            borderRadius: "10px",
                          }}
                        />

                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={saving || uploadingImage}
                          aria-label="Remove campus image"
                          title="Remove image"
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "32px",
                            height: "32px",
                            display: "grid",
                            placeItems: "center",
                            border: "none",
                            borderRadius: "50%",
                            background: "#dc2626",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          minHeight: "130px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          color: "#64748b",
                        }}
                      >
                        <ImageIcon size={34} />
                        <span>No campus image selected</span>
                      </div>
                    )}

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "9px",
                        padding: "12px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "9px",
                        background: "#fff",
                        color: "#183b56",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Upload size={18} />
                      {selectedImage
                        ? "Choose a different image"
                        : imagePreview
                          ? "Replace campus image"
                          : "Upload campus image"}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                        disabled={saving || uploadingImage}
                        style={{ display: "none" }}
                      />
                    </label>

                    <small style={{ color: "#64748b" }}>
                      JPG, PNG, or WEBP. Maximum 5 MB.
                      {selectedImage && ` Selected: ${selectedImage.name}`}
                    </small>
                  </div>
                </div>

                <label className="full-width">
                  Google Maps URL
                  <input
                    type="url"
                    name="map_url"
                    value={form.map_url}
                    onChange={handleChange}
                    placeholder="https://maps.google.com/..."
                  />
                </label>

                <label className="campus-active-checkbox">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  <span>Campus is active</span>
                </label>
              </div>

              <div className="campus-modal-footer">
                <button
                  type="button"
                  className="campus-cancel-btn"
                  onClick={closeModal}
                  disabled={saving || uploadingImage}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="campus-primary-btn"
                  disabled={saving || uploadingImage}
                >
                  {saving || uploadingImage ? (
                    <>
                      <Loader2 size={17} className="spinning" />
                      {uploadingImage ? "Uploading image..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      {editingCampus ? "Save Changes" : "Create Campus"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMPUS PROGRAM ASSIGNMENT MODAL */}
      {programModalOpen && (
        <div
          className="campus-modal-overlay"
          onMouseDown={closeProgramManager}
        >
          <div
            className="campus-program-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="campus-modal-header">
              <div>
                <span>PROGRAM MANAGEMENT</span>
                <h2>{selectedCampus?.name}</h2>
                <p className="campus-program-subtitle">
                  Select the programs available at this campus.
                </p>
              </div>

              <button
                className="campus-modal-close"
                onClick={closeProgramManager}
                disabled={Boolean(updatingProgramId)}
                aria-label="Close program manager"
              >
                <X size={20} />
              </button>
            </div>

            <div className="campus-program-content">
              <div className="campus-program-summary">
                <div>
                  <span>Assigned Programs</span>
                  <strong>{assignedProgramIds.length}</strong>
                </div>

                <div>
                  <span>Available Programs</span>
                  <strong>{programs.length}</strong>
                </div>
              </div>

              {programError && (
                <div className="campus-alert error">
                  <AlertCircle size={18} />
                  <span>{programError}</span>
                  <button
                    onClick={() => setProgramError("")}
                    aria-label="Dismiss error"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              <div className="campus-program-search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search programs..."
                  value={programSearch}
                  onChange={(event) => setProgramSearch(event.target.value)}
                />
              </div>

              {loadingPrograms ? (
                <div className="campus-loading">
                  <Loader2 size={30} className="spinning" />
                  <span>Loading programs...</span>
                </div>
              ) : filteredPrograms.length === 0 ? (
                <div className="campus-empty">
                  <BookOpen size={36} />
                  <h3>No programs found</h3>
                  <p>There are no matching programs.</p>
                </div>
              ) : (
                <div className="campus-program-list">
                  {filteredPrograms.map((program) => {
                    const isAssigned = assignedProgramIds.includes(
                      program.id
                    );

                    const isUpdating = updatingProgramId === program.id;

                    return (
                      <div
                        className={`campus-program-item ${
                          isAssigned ? "assigned" : ""
                        }`}
                        key={program.id}
                      >
                        <div className="campus-program-info">
                          <div className="campus-program-icon">
                            <BookOpen size={19} />
                          </div>

                          <div>
                            <strong>{program.title}</strong>
                            <span>
                              {[program.category, program.level]
                                .filter(Boolean)
                                .join(" • ") || "Program"}
                            </span>

                            {program.duration && (
                              <small>{program.duration}</small>
                            )}
                          </div>
                        </div>

                        {canManagePrograms ? (
                          <button
                            className={`campus-program-toggle ${
                              isAssigned ? "remove" : "assign"
                            }`}
                            onClick={() =>
                              handleProgramAssignment(program)
                            }
                            disabled={Boolean(updatingProgramId)}
                            title={
                              isAssigned
                                ? "Remove from this campus"
                                : "Assign to this campus"
                            }
                          >
                            {isUpdating ? (
                              <Loader2 size={16} className="spinning" />
                            ) : isAssigned ? (
                              <>
                                <CircleMinus size={16} />
                                Remove
                              </>
                            ) : (
                              <>
                                <CirclePlus size={16} />
                                Assign
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`campus-program-status ${
                              isAssigned ? "assigned" : "not-assigned"
                            }`}
                          >
                            {isAssigned ? (
                              <>
                                <Check size={14} />
                                Assigned
                              </>
                            ) : (
                              "Not assigned"
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="campus-modal-footer">
              <button
                type="button"
                className="campus-cancel-btn"
                onClick={closeProgramManager}
                disabled={Boolean(updatingProgramId)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampuses;
