
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  RefreshCw,
  Mail,
  Phone,
  UserRound,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import campusService from "../services/campusService";
import "../styles/admin-staff.css";

const emptyForm = {
  full_name: "",
  position: "",
  department: "",
  bio: "",
  email: "",
  phone: "",
  image: "",
  campus_id: "",
  is_active: true,
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function AdminStaff() {
  const admin = getStoredAdmin();
  const role = admin?.role;

  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [staff, setStaff] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");

  const clearImagePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setImagePreview("");
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [staffResponse, campusData] = await Promise.all([
        api.get("/staff"),
        campusService.getAllCampuses(),
      ]);

      // The backend returns { success, count, staff: [...] }
      setStaff(
        Array.isArray(staffResponse?.staff)
          ? staffResponse.staff
          : []
      );

      setCampuses(Array.isArray(campusData) ? campusData : []);
    } catch (err) {
      setError(err.message || "Failed to load staff information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [loadData]);

  const openCreateModal = () => {
    clearImagePreview();
    setEditingStaff(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    clearImagePreview();
    setEditingStaff(member);

    setForm({
      full_name: member.full_name || "",
      position: member.position || "",
      department: member.department || "",
      bio: member.bio || "",
      email: member.email || "",
      phone: member.phone || "",
      image: member.image || "",
      campus_id: member.campus_id || "",
      is_active: member.is_active ?? true,
    });

    setImagePreview(member.image || "");
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || uploadingImage) return;

    clearImagePreview();
    setModalOpen(false);
    setEditingStaff(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearImagePreviewIfFailed = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError("");
    setSuccess("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must not exceed 5 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = localPreview;
    setImagePreview(localPreview);

    const imageData = new FormData();
    imageData.append("image", file);

    setUploadingImage(true);

    try {
      const response = await api.post("/staff/upload-image", imageData);

      if (!response?.image) {
        throw new Error("Image upload did not return an image URL.");
      }

      setForm((current) => ({
        ...current,
        image: response.image,
      }));

      setSuccess("Image uploaded successfully.");
    } catch (err) {
      setError(err.message || "Failed to upload image.");

      setForm((current) => ({
        ...current,
        image: editingStaff?.image || "",
      }));

      setImagePreview(editingStaff?.image || "");
      clearImagePreviewIfFailed();
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    if (uploadingImage) return;

    clearImagePreview();

    setForm((current) => ({
      ...current,
      image: "",
    }));

    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.full_name.trim()) {
      setError("Please enter the staff member's full name.");
      return;
    }

    if (uploadingImage) {
      setError("Please wait for the image upload to finish.");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      position: form.position.trim() || null,
      department: form.department.trim() || null,
      bio: form.bio.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      image: form.image.trim() || null,
      campus_id: form.campus_id || null,
    };

    try {
      if (editingStaff) {
        await api.patch(`/staff/${editingStaff.id}`, payload);
        setSuccess("Staff member updated successfully.");
      } else {
        await api.post("/staff", payload);
        setSuccess("Staff member added successfully.");
      }

      clearImagePreview();
      setModalOpen(false);
      setEditingStaff(null);
      setForm({ ...emptyForm });

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save staff information.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.full_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/staff/${member.id}`);
      setSuccess("Staff member deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete staff member.");
    }
  };

  const filteredStaff = staff.filter((member) => {
    const searchValue = search.toLowerCase();

    const matchesSearch = [
      member.full_name,
      member.position,
      member.department,
      member.email,
      member.phone,
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchValue)
    );

    const matchesCampus =
      campusFilter === "all" || member.campus_id === campusFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.is_active) ||
      (statusFilter === "inactive" && !member.is_active);

    return matchesSearch && matchesCampus && matchesStatus;
  });

  const activeCount = staff.filter((member) => member.is_active).length;
  const inactiveCount = staff.length - activeCount;

  return (
    <div className="admin-staff-page">
      <div className="admin-staff-header">
        <div>
          <span className="admin-staff-eyebrow">ADMINISTRATION</span>
          <h1>Staff Management</h1>
          <p>Manage college staff members and their campus assignments.</p>
        </div>

        <div className="admin-staff-header-actions">
          <button
            type="button"
            className="staff-refresh-button"
            onClick={loadData}
            disabled={loading}
            title="Refresh staff"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              className="staff-primary-button"
              onClick={openCreateModal}
            >
              <Plus size={18} />
              Add Staff
            </button>
          )}
        </div>
      </div>

      {error && !modalOpen && (
        <div className="staff-alert staff-alert-error">{error}</div>
      )}

      {success && (
        <div className="staff-alert staff-alert-success">{success}</div>
      )}

      <div className="staff-stat-grid">
        <div className="staff-stat-card">
          <div className="staff-stat-icon">
            <Users size={21} />
          </div>
          <div>
            <span>Total Staff</span>
            <strong>{staff.length}</strong>
          </div>
        </div>

        <div className="staff-stat-card">
          <div className="staff-stat-icon staff-stat-active">
            <UserRound size={21} />
          </div>
          <div>
            <span>Active Staff</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="staff-stat-card">
          <div className="staff-stat-icon staff-stat-inactive">
            <UserRound size={21} />
          </div>
          <div>
            <span>Inactive Staff</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </div>

      <div className="staff-content-card">
        <div className="staff-toolbar">
          <div className="staff-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, position, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="staff-filters">
            <select
              value={campusFilter}
              onChange={(event) => setCampusFilter(event.target.value)}
              aria-label="Filter by campus"
            >
              <option value="all">All Campuses</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="staff-loading">
            <RefreshCw size={22} className="staff-spin" />
            <p>Loading staff members...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="staff-empty">
            <Users size={38} />
            <h3>No staff members found</h3>
            <p>
              {staff.length === 0
                ? "Add your first staff member to get started."
                : "Try changing your search or filters."}
            </p>

            {canManage && staff.length === 0 && (
              <button
                type="button"
                className="staff-primary-button"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                Add Staff
              </button>
            )}
          </div>
        ) : (
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Campus</th>
                  <th>Status</th>
                  <th>Contact</th>
                  {(canManage || canDelete) && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="staff-person-cell">
                        <div className="staff-avatar">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.full_name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <UserRound size={21} />
                          )}
                        </div>

                        <div>
                          <strong>{member.full_name}</strong>
                          <span>{member.email || "No email provided"}</span>
                        </div>
                      </div>
                    </td>

                    <td>{member.position || "—"}</td>
                    <td>{member.department || "—"}</td>

                    <td>
                      {member.campus?.name ||
                        campuses.find(
                          (campus) => campus.id === member.campus_id
                        )?.name ||
                        "Not assigned"}
                    </td>

                    <td>
                      <span
                        className={`staff-status ${
                          member.is_active ? "is-active" : "is-inactive"
                        }`}
                      >
                        {member.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="staff-contact-cell">
                        {member.email && (
                          <span>
                            <Mail size={13} />
                            {member.email}
                          </span>
                        )}

                        {member.phone && (
                          <span>
                            <Phone size={13} />
                            {member.phone}
                          </span>
                        )}

                        {!member.email && !member.phone && "—"}
                      </div>
                    </td>

                    {(canManage || canDelete) && (
                      <td>
                        <div className="staff-row-actions">
                          {canManage && (
                            <button
                              type="button"
                              className="staff-icon-button"
                              onClick={() => openEditModal(member)}
                              title="Edit staff"
                            >
                              <Pencil size={16} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="staff-icon-button staff-delete-button"
                              onClick={() => handleDelete(member)}
                              title="Delete staff"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredStaff.length > 0 && (
          <div className="staff-table-footer">
            Showing {filteredStaff.length} of {staff.length} staff members
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="staff-modal-overlay" onMouseDown={closeModal}>
          <div
            className="staff-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="staff-modal-header">
              <div>
                <h2>
                  {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
                </h2>
                <p>
                  {editingStaff
                    ? "Update the staff member's information."
                    : "Enter the details of the new staff member."}
                </p>
              </div>

              <button
                type="button"
                className="staff-modal-close"
                onClick={closeModal}
                disabled={saving || uploadingImage}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="staff-alert staff-alert-error">{error}</div>
              )}

              <div className="staff-form-grid">
                <label className="staff-form-field staff-field-full">
                  Full Name *
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                    maxLength={200}
                  />
                </label>

                <label className="staff-form-field">
                  Position
                  <input
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="e.g. Lecturer"
                  />
                </label>

                <label className="staff-form-field">
                  Department
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Information Technology"
                  />
                </label>

                <label className="staff-form-field">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="staff@example.com"
                  />
                </label>

                <label className="staff-form-field">
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </label>

                <label className="staff-form-field staff-field-full">
                  Campus
                  <select
                    name="campus_id"
                    value={form.campus_id}
                    onChange={handleChange}
                  >
                    <option value="">Not assigned to a campus</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="staff-form-field staff-field-full">
                  <span>Staff Photo</span>

                  <div className="staff-image-upload">
                    <div className="staff-image-preview">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Staff preview"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="staff-image-placeholder">
                          <ImageIcon size={30} />
                          <span>No image selected</span>
                        </div>
                      )}
                    </div>

                    <div className="staff-image-upload-actions">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                        hidden
                        disabled={uploadingImage || saving}
                      />

                      <button
                        type="button"
                        className="staff-upload-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage || saving}
                      >
                        {uploadingImage ? (
                          <>
                            <RefreshCw size={16} className="staff-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            {form.image ? "Change Image" : "Choose Image"}
                          </>
                        )}
                      </button>

                      {form.image && (
                        <button
                          type="button"
                          className="staff-remove-image-button"
                          onClick={removeImage}
                          disabled={uploadingImage || saving}
                        >
                          Remove Image
                        </button>
                      )}

                      <small>JPG, PNG or WEBP. Maximum size: 5 MB.</small>
                    </div>
                  </div>
                </div>

                <label className="staff-form-field staff-field-full">
                  Biography
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Write a short biography..."
                    rows={4}
                  />
                </label>

                <label className="staff-active-toggle staff-field-full">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />

                  <span>
                    <strong>Active staff member</strong>
                    <small>
                      Active staff members can appear on the public website.
                    </small>
                  </span>
                </label>
              </div>

              <div className="staff-modal-footer">
                <button
                  type="button"
                  className="staff-cancel-button"
                  onClick={closeModal}
                  disabled={saving || uploadingImage}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="staff-primary-button"
                  disabled={saving || uploadingImage}
                >
                  {uploadingImage
                    ? "Uploading Image..."
                    : saving
                      ? "Saving..."
                      : editingStaff
                        ? "Save Changes"
                        : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStaff;
