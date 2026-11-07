import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Images,
  X,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Save,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../AuthContext";
import "../styles/admin-gallery.css";

const MAX_IMAGES = 30;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const emptyForm = {
  title: "",
  description: "",
  category: "Campus Life",
  display_order: 0,
  is_published: false,
};

const getGalleryImages = (item) => {
  let urls = [];

  if (Array.isArray(item?.image_urls)) {
    urls = item.image_urls;
  } else if (typeof item?.image_urls === "string") {
    try {
      const parsed = JSON.parse(item.image_urls);
      if (Array.isArray(parsed)) urls = parsed;
    } catch {
      urls = [];
    }
  }

  if (!urls.length && item?.image_url) {
    urls = [item.image_url];
  }

  return [...new Set(urls.filter(
    (url) => typeof url === "string" && url.trim()
  ))];
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getErrorMessage = (error) =>
  error?.message || "Something went wrong. Please try again.";

export default function AdminGallery() {
  const { admin } = useAuth();

  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [newFiles, setNewFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  const [previewImage, setPreviewImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const role = String(admin?.role || "").toLowerCase();
  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const totalImages = gallery.reduce(
    (total, item) => total + getGalleryImages(item).length,
    0
  );

  const publishedCount = gallery.filter(
    (item) => item.is_published
  ).length;

  const draftCount = gallery.length - publishedCount;

  const releasePreviewUrls = () => {
    previewUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    previewUrlsRef.current = [];
  };

  const loadGallery = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/gallery");

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load gallery collections."
        );
      }

      setGallery(response.gallery || []);
    } catch (err) {
      console.error("Admin gallery loading error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGallery();

    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [loadGallery]);

  const filteredGallery = gallery.filter((item) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query);

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Published" && item.is_published) ||
      (activeFilter === "Drafts" && !item.is_published);

    return matchesSearch && matchesFilter;
  });

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    releasePreviewUrls();

    setForm(emptyForm);
    setNewFiles([]);
    setExistingImages([]);
    setRemovedImages([]);
    setEditingItem(null);
    setFormError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    resetForm();

    setEditingItem(item);

    setForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Campus Life",
      display_order: item.display_order ?? 0,
      is_published: Boolean(item.is_published),
    });

    setExistingImages(getGalleryImages(item));
    setModalOpen(true);
  };

  const handleFileSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    setFormError("");

    const validFiles = [];
    const rejectedFiles = [];

    selectedFiles.forEach((file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        rejectedFiles.push(`${file.name}: unsupported format`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name}: exceeds 5 MB`);
        return;
      }

      validFiles.push(file);
    });

    const currentCount = existingImages.length + newFiles.length;
    const availableSlots = MAX_IMAGES - currentCount;

    const acceptedFiles = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      rejectedFiles.push(
        `Only ${availableSlots} additional image(s) can be added. Maximum is ${MAX_IMAGES}.`
      );
    }

    const additions = acceptedFiles.map((file) => {
      const preview = URL.createObjectURL(file);

      previewUrlsRef.current.push(preview);

      return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        preview,
      };
    });

    setNewFiles((current) => [...current, ...additions]);

    if (rejectedFiles.length) {
      setFormError(rejectedFiles.join(". "));
    }

    event.target.value = "";
  };

  const removeNewFile = (fileId) => {
    setNewFiles((current) => {
      const fileToRemove = current.find((item) => item.id === fileId);

      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);

        previewUrlsRef.current = previewUrlsRef.current.filter(
          (url) => url !== fileToRemove.preview
        );
      }

      return current.filter((item) => item.id !== fileId);
    });
  };

  const removeExistingImage = (url) => {
    setExistingImages((current) =>
      current.filter((image) => image !== url)
    );

    setRemovedImages((current) =>
      current.includes(url) ? current : [...current, url]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setNotice("");

    if (!canManage) {
      setFormError("You do not have permission to manage gallery content.");
      return;
    }

    if (!form.title.trim()) {
      setFormError("Please enter a gallery title.");
      return;
    }

    if (!form.category.trim()) {
      setFormError("Please enter a gallery category.");
      return;
    }

    const finalImageCount = existingImages.length + newFiles.length;

    if (!finalImageCount) {
      setFormError("Please add at least one image to this gallery.");
      return;
    }

    if (finalImageCount > MAX_IMAGES) {
      setFormError(`A gallery collection cannot exceed ${MAX_IMAGES} images.`);
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("category", form.category.trim());
      formData.append(
        "display_order",
        String(Number(form.display_order) || 0)
      );
      formData.append("is_published", String(form.is_published));

      newFiles.forEach((item) => {
        formData.append("images", item.file);
      });

      if (editingItem) {
        formData.append(
          "remove_image_urls",
          JSON.stringify(removedImages)
        );

        await api.patch(`/gallery/${editingItem.id}`, formData);

        setNotice("Gallery collection updated successfully.");
      } else {
        await api.post("/gallery", formData);

        setNotice("Gallery collection created successfully.");
      }

      setModalOpen(false);
      resetForm();

      await loadGallery(true);
    } catch (err) {
      console.error("Gallery save error:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !canDelete) return;

    try {
      setDeleting(true);

      await api.delete(`/gallery/${deleteTarget.id}`);

      setDeleteTarget(null);
      setNotice("Gallery collection deleted successfully.");

      await loadGallery(true);
    } catch (err) {
      console.error("Gallery deletion error:", err);
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (item) => {
    if (!canManage) return;

    try {
      const formData = new FormData();

      formData.append("title", item.title || "");
      formData.append("description", item.description || "");
      formData.append("category", item.category || "Campus Life");
      formData.append(
        "display_order",
        String(item.display_order ?? 0)
      );
      formData.append(
        "is_published",
        String(!item.is_published)
      );
      formData.append("remove_image_urls", JSON.stringify([]));

      await api.patch(`/gallery/${item.id}`, formData);

      setNotice(
        !item.is_published
          ? "Gallery collection published."
          : "Gallery collection moved to drafts."
      );

      await loadGallery(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="admin-gallery-page">
      {/* PAGE HEADER */}

      <div className="admin-gallery-header">
        <div>
          <div className="admin-gallery-eyebrow">
            <Images size={15} />
            WEBSITE CONTENT
          </div>

          <h1>Gallery Management</h1>

          <p>
            Upload, organize, and manage Dream Land College photos
            displayed on your public website.
          </p>
        </div>

        <div className="admin-gallery-header-actions">
          <button
            type="button"
            className="ag-btn ag-btn-secondary"
            onClick={() => loadGallery(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "ag-spin" : ""}
            />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              className="ag-btn ag-btn-primary"
              onClick={openCreateModal}
            >
              <Plus size={18} />
              Add Gallery
            </button>
          )}
        </div>
      </div>

      {/* ALERTS */}

      {notice && (
        <div className="ag-alert ag-alert-success">
          <CheckCircle2 size={18} />
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div className="ag-alert ag-alert-error">
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

      <div className="ag-stats-grid">
        <div className="ag-stat-card">
          <div className="ag-stat-icon ag-stat-icon-blue">
            <Images size={21} />
          </div>

          <div>
            <span>Total Collections</span>
            <strong>{gallery.length}</strong>
          </div>
        </div>

        <div className="ag-stat-card">
          <div className="ag-stat-icon ag-stat-icon-teal">
            <ImageIcon size={21} />
          </div>

          <div>
            <span>Total Photos</span>
            <strong>{totalImages}</strong>
          </div>
        </div>

        <div className="ag-stat-card">
          <div className="ag-stat-icon ag-stat-icon-green">
            <Eye size={21} />
          </div>

          <div>
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </div>
        </div>

        <div className="ag-stat-card">
          <div className="ag-stat-icon ag-stat-icon-orange">
            <EyeOff size={21} />
          </div>

          <div>
            <span>Drafts</span>
            <strong>{draftCount}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="ag-toolbar">
        <div className="ag-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search gallery collections..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="ag-filter-tabs">
          {["All", "Published", "Drafts"].map((filter) => (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* COLLECTIONS */}

      {loading ? (
        <div className="ag-state">
          <RefreshCw size={30} className="ag-spin" />
          <h3>Loading gallery collections</h3>
          <p>Please wait while your gallery is being loaded.</p>
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="ag-state">
          <div className="ag-state-icon">
            <Images size={35} />
          </div>

          <h3>
            {gallery.length === 0
              ? "No Gallery Collections Yet"
              : "No Matching Collections"}
          </h3>

          <p>
            {gallery.length === 0
              ? "Create your first collection and upload photos from your computer."
              : "Try another search term or change the selected filter."}
          </p>

          {gallery.length === 0 && canManage && (
            <button
              type="button"
              className="ag-btn ag-btn-primary"
              onClick={openCreateModal}
            >
              <Plus size={18} />
              Create First Gallery
            </button>
          )}
        </div>
      ) : (
        <div className="ag-grid">
          {filteredGallery.map((item) => {
            const imageUrls = getGalleryImages(item);

            return (
              <article className="ag-card" key={item.id}>
                <div className="ag-card-cover">
                  {imageUrls[0] ? (
                    <img
                      src={imageUrls[0]}
                      alt={item.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="ag-no-image">
                      <ImageIcon size={35} />
                      <span>No image</span>
                    </div>
                  )}

                  <span
                    className={`ag-status ${
                      item.is_published ? "published" : "draft"
                    }`}
                  >
                    {item.is_published ? (
                      <>
                        <Eye size={13} />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff size={13} />
                        Draft
                      </>
                    )}
                  </span>

                  <span className="ag-photo-count">
                    <Images size={14} />
                    {imageUrls.length} Photos
                  </span>

                  {imageUrls.length > 1 && (
                    <div className="ag-cover-stack">
                      {imageUrls.slice(1, 4).map((url, index) => (
                        <img
                          key={`${item.id}-stack-${index}`}
                          src={url}
                          alt=""
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="ag-card-body">
                  <div className="ag-card-meta">
                    <span className="ag-category">
                      {item.category || "Campus Life"}
                    </span>

                    <span className="ag-order">
                      Order: {item.display_order ?? 0}
                    </span>
                  </div>

                  <h3>{item.title}</h3>

                  <p className="ag-description">
                    {item.description || "No description provided."}
                  </p>

                  <div className="ag-card-date">
                    <span>Created</span>
                    <strong>{formatDate(item.created_at)}</strong>
                  </div>

                  <div className="ag-card-actions">
                    <button
                      type="button"
                      className="ag-action-btn ag-action-view"
                      onClick={() => setPreviewImage(item)}
                    >
                      <Eye size={15} />
                      View
                    </button>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="ag-action-btn ag-action-edit"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className={`ag-action-btn ${
                            item.is_published
                              ? "ag-action-unpublish"
                              : "ag-action-publish"
                          }`}
                          onClick={() => handleTogglePublish(item)}
                        >
                          {item.is_published ? (
                            <>
                              <EyeOff size={15} />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye size={15} />
                              Publish
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="ag-action-btn ag-action-delete"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}

      {modalOpen && (
        <div
          className="ag-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="ag-modal">
            <div className="ag-modal-header">
              <div>
                <span className="ag-modal-kicker">
                  GALLERY CONTENT
                </span>

                <h2>
                  {editingItem ? "Edit Gallery Collection" : "Create Gallery Collection"}
                </h2>

                <p>
                  Add a collection and upload its original photo files.
                </p>
              </div>

              <button
                type="button"
                className="ag-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ag-modal-content">
                {formError && (
                  <div className="ag-alert ag-alert-error">
                    <AlertCircle size={17} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="ag-form-grid">
                  <div className="ag-form-group ag-form-full">
                    <label htmlFor="gallery-title">
                      Gallery Title <span>*</span>
                    </label>

                    <input
                      id="gallery-title"
                      type="text"
                      placeholder="e.g. Campus Life and Activities"
                      value={form.title}
                      onChange={(event) =>
                        updateForm("title", event.target.value)
                      }
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="ag-form-group ag-form-full">
                    <label htmlFor="gallery-description">
                      Description
                    </label>

                    <textarea
                      id="gallery-description"
                      rows={4}
                      placeholder="Describe this gallery collection..."
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                    />
                  </div>

                  <div className="ag-form-group">
                    <label htmlFor="gallery-category">
                      Category <span>*</span>
                    </label>

                    <input
                      id="gallery-category"
                      type="text"
                      list="gallery-category-options"
                      placeholder="Select or enter category"
                      value={form.category}
                      onChange={(event) =>
                        updateForm("category", event.target.value)
                      }
                      maxLength={100}
                      required
                    />

                    <datalist id="gallery-category-options">
                      <option value="Campus Life" />
                      <option value="Facilities" />
                      <option value="Students" />
                      <option value="Events" />
                      <option value="Academic Activities" />
                    </datalist>
                  </div>

                  <div className="ag-form-group">
                    <label htmlFor="gallery-order">
                      Display Order
                    </label>

                    <input
                      id="gallery-order"
                      type="number"
                      min="0"
                      value={form.display_order}
                      onChange={(event) =>
                        updateForm("display_order", event.target.value)
                      }
                    />
                  </div>
                </div>

                {/* IMAGE UPLOAD */}

                <div className="ag-upload-section">
                  <div className="ag-upload-heading">
                    <div>
                      <h3>Gallery Photos</h3>
                      <p>
                        Select actual JPG, PNG, or WEBP files from your device.
                      </p>
                    </div>

                    <span className="ag-image-limit">
                      {existingImages.length + newFiles.length}/{MAX_IMAGES}
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={handleFileSelection}
                  />

                  <button
                    type="button"
                    className="ag-upload-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      existingImages.length + newFiles.length >= MAX_IMAGES
                    }
                  >
                    <div className="ag-upload-icon">
                      <Upload size={25} />
                    </div>

                    <strong>Click to select photos</strong>

                    <span>
                      Select multiple images from your computer
                    </span>

                    <small>
                      JPG, PNG, WEBP · Maximum 5 MB per image · Up to 30 photos
                    </small>
                  </button>

                  {(existingImages.length > 0 || newFiles.length > 0) && (
                    <div className="ag-preview-heading">
                      <strong>Selected Photos</strong>

                      <span>
                        {existingImages.length + newFiles.length} images
                      </span>
                    </div>
                  )}

                  <div className="ag-image-preview-grid">
                    {existingImages.map((url, index) => (
                      <div
                        className="ag-image-preview"
                        key={`existing-${url}`}
                      >
                        <img
                          src={url}
                          alt={`Existing gallery photo ${index + 1}`}
                        />

                        <span className="ag-image-existing-label">
                          Uploaded
                        </span>

                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          aria-label="Remove existing image"
                          title="Remove this image"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}

                    {newFiles.map((item, index) => (
                      <div
                        className="ag-image-preview ag-image-new"
                        key={item.id}
                      >
                        <img
                          src={item.preview}
                          alt={`New gallery photo ${index + 1}`}
                        />

                        <span className="ag-image-new-label">
                          New
                        </span>

                        <button
                          type="button"
                          onClick={() => removeNewFile(item.id)}
                          aria-label="Remove selected image"
                          title="Remove this image"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {existingImages.length + newFiles.length === 0 && (
                    <div className="ag-no-selected-images">
                      <ImageIcon size={24} />
                      <span>No photos selected yet.</span>
                    </div>
                  )}
                </div>

                {/* PUBLISH STATUS */}

                <div className="ag-publish-option">
                  <div className="ag-publish-icon">
                    {form.is_published ? (
                      <Eye size={19} />
                    ) : (
                      <EyeOff size={19} />
                    )}
                  </div>

                  <div className="ag-publish-text">
                    <strong>
                      {form.is_published
                        ? "Publish this collection"
                        : "Save as a draft"}
                    </strong>

                    <span>
                      {form.is_published
                        ? "This collection will be visible on the public Gallery page."
                        : "This collection will remain visible only in the admin panel."}
                    </span>
                  </div>

                  <label className="ag-switch">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(event) =>
                        updateForm("is_published", event.target.checked)
                      }
                    />

                    <span className="ag-switch-slider" />
                  </label>
                </div>
              </div>

              <div className="ag-modal-footer">
                <button
                  type="button"
                  className="ag-btn ag-btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ag-btn ag-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="ag-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      {editingItem ? (
                        <Save size={17} />
                      ) : (
                        <Upload size={17} />
                      )}

                      {editingItem
                        ? "Save Changes"
                        : "Create Gallery"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECTION IMAGE PREVIEW */}

      {previewImage && (
        <div
          className="ag-view-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeImagePreview();
            }
          }}
        >
          <div className="ag-view-modal">
            <div className="ag-view-header">
              <div>
                <h2>{previewImage.title}</h2>
                <p>
                  {getGalleryImages(previewImage).length} photos ·{" "}
                  {previewImage.category}
                </p>
              </div>

              <button
                type="button"
                onClick={closeImagePreview}
                aria-label="Close preview"
              >
                <X size={21} />
              </button>
            </div>

            <div className="ag-view-description">
              {previewImage.description || "No description provided."}
            </div>

            <div className="ag-view-grid">
              {getGalleryImages(previewImage).map((url, index) => (
                <button
                  type="button"
                  key={`${previewImage.id}-view-${index}`}
                  onClick={() =>
                    setPreviewImage({
                      ...previewImage,
                      selectedPreview: url,
                    })
                  }
                  className="ag-view-image"
                >
                  <img
                    src={url}
                    alt={`${previewImage.title} ${index + 1}`}
                  />

                  <span>{index + 1}</span>
                </button>
              ))}
            </div>

            {previewImage.selectedPreview && (
              <div
                className="ag-full-image-backdrop"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setPreviewImage((current) => ({
                      ...current,
                      selectedPreview: null,
                    }));
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImage((current) => ({
                      ...current,
                      selectedPreview: null,
                    }))
                  }
                  aria-label="Close photo preview"
                >
                  <X size={24} />
                </button>

                <img
                  src={previewImage.selectedPreview}
                  alt={previewImage.title}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteTarget && (
        <div className="ag-confirm-backdrop">
          <div className="ag-confirm-modal">
            <div className="ag-confirm-icon">
              <Trash2 size={25} />
            </div>

            <h2>Delete Gallery Collection?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.title}</strong> and its uploaded
              images? This action cannot be undone.
            </p>

            <div className="ag-confirm-actions">
              <button
                type="button"
                className="ag-btn ag-btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ag-btn ag-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={16} className="ag-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Collection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}