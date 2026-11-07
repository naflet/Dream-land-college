
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  Upload,
  Newspaper,
  Eye,
  Archive,
  FileText,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Send,
  RotateCcw,
  EyeOff,
  UserRound,
  Tag,
} from "lucide-react";

import api, { getStoredAdmin } from "../services/api";
import "../styles/admin-news.css";

const initialForm = {
  title: "",
  excerpt: "",
  content: "",
  image: "",
  category: "",
  author: "",
  status: "draft",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/* ==========================================================
   ROLE HELPERS
========================================================== */

const normalizeRole = (role) =>
  String(role || "").trim().toLowerCase();

const VALID_ADMIN_ROLES = ["super_admin", "admin"];

/* ==========================================================
   API HELPERS
========================================================== */

function unwrapResponse(response) {
  let result = response;

  for (let i = 0; i < 3; i += 1) {
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      result.data !== undefined &&
      result.news === undefined &&
      result.events === undefined
    ) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
}

function getNewsFromResponse(response) {
  const result = unwrapResponse(response);

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.news)) return result.news;
  if (Array.isArray(result?.data?.news)) return result.data.news;
  if (Array.isArray(result?.articles)) return result.articles;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;

  return [];
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeNews(item = {}) {
  return {
    ...item,
    id: item.id || item.news_id || item.newsId,
    title: item.title || "",
    excerpt: item.excerpt || "",
    content: item.content || "",
    image: item.image || item.image_url || "",
    category: item.category || "",
    author: item.author || "",
    status: item.status || "draft",
  };
}

/* ==========================================================
   ADMIN NEWS
========================================================== */

export default function AdminNews() {
  const admin = getStoredAdmin();
  const role = normalizeRole(admin?.role);

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";

  const isAuthorized = VALID_ADMIN_ROLES.includes(role);

  // Both Super Admin and Admin have full News management access.
  const canManage = isAuthorized;
  const canDelete = isAuthorized;

  /* ========================================================
     STATE
  ======================================================== */

  const [news, setNews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [viewingNews, setViewingNews] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [changingStatusId, setChangingStatusId] = useState(null);

  const [alert, setAlert] = useState(null);

  /* ========================================================
     ALERT
  ======================================================== */

  const showAlert = useCallback((message, type = "success") => {
    setAlert({ message, type });
  }, []);

  /* ========================================================
     LOAD NEWS FROM BACKEND
  ======================================================== */

  const loadNews = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await api.get("/news");
      const articles = getNewsFromResponse(response);

      setNews(articles.map(normalizeNews));
    } catch (error) {
      console.error("Failed to load news:", error);

      showAlert(
        getErrorMessage(error, "Failed to load news articles."),
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  /* ========================================================
     IMAGE PREVIEW
  ======================================================== */

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  /* ========================================================
     STATISTICS
  ======================================================== */

  const stats = useMemo(() => ({
    total: news.length,
    published: news.filter(
      (item) => item.status === "published"
    ).length,
    drafts: news.filter(
      (item) => item.status === "draft"
    ).length,
    archived: news.filter(
      (item) => item.status === "archived"
    ).length,
  }), [news]);

  /* ========================================================
     SEARCH AND FILTER
  ======================================================== */

  const filteredNews = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return news.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.title.toLowerCase().includes(searchValue) ||
        item.category.toLowerCase().includes(searchValue) ||
        item.author.toLowerCase().includes(searchValue) ||
        item.excerpt.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [news, search, statusFilter]);

  /* ========================================================
     MODAL HANDLERS
  ======================================================== */

  const openCreateModal = () => {
    if (!canManage) return;

    setEditingNews(null);
    setForm({ ...initialForm });
    setSelectedImage(null);
    setImagePreview("");
    setAlert(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    if (!canManage || !item) return;

    const article = normalizeNews(item);

    if (!article.id) {
      showAlert(
        "Cannot edit this article because its ID is missing.",
        "error"
      );

      console.error("News article is missing an ID:", item);
      return;
    }

    setEditingNews(article);

    setForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      image: article.image,
      category: article.category,
      author: article.author,
      status: article.status,
    });

    setSelectedImage(null);
    setImagePreview("");
    setAlert(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || uploadingImage) return;

    setModalOpen(false);
    setEditingNews(null);
    setForm({ ...initialForm });
    setSelectedImage(null);
    setImagePreview("");
  };

  const openViewModal = (item) => {
    setViewingNews(normalizeNews(item));
  };

  const closeViewModal = () => {
    setViewingNews(null);
  };

  /* ========================================================
     FORM HANDLERS
  ======================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showAlert(
        "Please select a JPG, PNG, or WEBP image.",
        "error"
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showAlert(
        "Image size must not exceed 5 MB.",
        "error"
      );

      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    event.target.value = "";
  };

  /* ========================================================
     UPLOAD IMAGE
  ======================================================== */

  const uploadImage = async () => {
    if (!selectedImage) return form.image;

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      setUploadingImage(true);

      const response = await api.post(
        "/news/upload-image",
        formData
      );

      const result = unwrapResponse(response);

      const imageUrl =
        result?.image ||
        result?.image_url ||
        result?.url ||
        result?.data?.image ||
        result?.data?.image_url;

      if (!imageUrl) {
        throw new Error(
          "Image upload did not return an image URL."
        );
      }

      return imageUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  /* ========================================================
     CREATE / UPDATE NEWS
  ======================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canManage) {
      showAlert(
        "You do not have permission to manage news articles.",
        "error"
      );
      return;
    }

    if (form.title.trim().length < 3) {
      showAlert(
        "Title must contain at least 3 characters.",
        "error"
      );
      return;
    }

    if (form.content.trim().length < 10) {
      showAlert(
        "Content must contain at least 10 characters.",
        "error"
      );
      return;
    }

    if (editingNews && !editingNews.id) {
      showAlert(
        "Cannot update this article because its ID is missing.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);
      setAlert(null);

      let imageUrl = form.image;

      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        image: imageUrl || null,
        category: form.category.trim() || null,
        author: form.author.trim() || null,
        status: form.status,
      };

      if (editingNews) {
        await api.patch(
          `/news/${editingNews.id}`,
          payload
        );

        showAlert("News article updated successfully.");
      } else {
        await api.post("/news", payload);

        showAlert("News article created successfully.");
      }

      setModalOpen(false);
      setEditingNews(null);
      setForm({ ...initialForm });
      setSelectedImage(null);
      setImagePreview("");

      await loadNews(false);
    } catch (error) {
      console.error("Failed to save news:", error);

      showAlert(
        getErrorMessage(
          error,
          "Failed to save the news article."
        ),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================
     PUBLISH / UNPUBLISH / ARCHIVE / RESTORE
  ======================================================== */

  const handleStatusChange = async (item, newStatus) => {
    if (!canManage) {
      showAlert(
        "You do not have permission to change news status.",
        "error"
      );
      return;
    }

    const actionMessages = {
      published: "publish",
      draft: "move back to drafts",
      archived: "archive",
    };

    const action = actionMessages[newStatus] || "update";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      setChangingStatusId(item.id);

      await api.patch(`/news/${item.id}`, {
        status: newStatus,
      });

      setNews((previous) =>
        previous.map((newsItem) =>
          newsItem.id === item.id
            ? { ...newsItem, status: newStatus }
            : newsItem
        )
      );

      if (viewingNews?.id === item.id) {
        setViewingNews((previous) => ({
          ...previous,
          status: newStatus,
        }));
      }

      const successMessages = {
        published: "News article published successfully.",
        draft: "News article moved to drafts successfully.",
        archived: "News article archived successfully.",
      };

      showAlert(
        successMessages[newStatus] ||
        "News status updated successfully."
      );
    } catch (error) {
      console.error("Failed to update news status:", error);

      showAlert(
        getErrorMessage(
          error,
          "Failed to update news status."
        ),
        "error"
      );
    } finally {
      setChangingStatusId(null);
    }
  };

  /* ========================================================
     PERMANENT DELETE - SUPER ADMIN AND ADMIN
  ======================================================== */

  const handleDelete = async (item) => {
    if (!canDelete) {
      showAlert(
        "You do not have permission to permanently delete news articles.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete "${item.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      await api.delete(`/news/${item.id}`);

      setNews((previous) =>
        previous.filter(
          (newsItem) => newsItem.id !== item.id
        )
      );

      if (viewingNews?.id === item.id) {
        setViewingNews(null);
      }

      showAlert("News article permanently deleted.");
    } catch (error) {
      console.error("Failed to delete news:", error);

      showAlert(
        getErrorMessage(
          error,
          "Failed to delete the news article."
        ),
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ========================================================
     STATUS HELPERS
  ======================================================== */

  const getStatusClass = (status) => {
    switch (status) {
      case "published":
        return "published";
      case "archived":
        return "archived";
      default:
        return "draft";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "published":
        return "Published";
      case "archived":
        return "Archived";
      default:
        return "Draft";
    }
  };

  /* ========================================================
     RENDER ACTION BUTTONS
  ======================================================== */

  const renderActions = (item) => (
    <div className="admin-news-actions">
      <button
        type="button"
        className="admin-news-action-button view"
        title="View article"
        onClick={() => openViewModal(item)}
      >
        <Eye size={17} />
      </button>

      {canManage && (
        <button
          type="button"
          className="admin-news-action-button edit"
          title="Edit article"
          onClick={(event) => {
            event.stopPropagation();
            openEditModal(item);
          }}
        >
          <Edit size={17} />
        </button>
      )}

      {canManage && item.status === "draft" && (
        <button
          type="button"
          className="admin-news-action-button publish"
          title="Publish article"
          onClick={() => handleStatusChange(item, "published")}
          disabled={changingStatusId === item.id}
        >
          {changingStatusId === item.id ? (
            <RefreshCw size={17} className="admin-news-spinning" />
          ) : (
            <Send size={17} />
          )}
        </button>
      )}

      {canManage && item.status === "published" && (
        <button
          type="button"
          className="admin-news-action-button unpublish"
          title="Move to drafts"
          onClick={() => handleStatusChange(item, "draft")}
          disabled={changingStatusId === item.id}
        >
          {changingStatusId === item.id ? (
            <RefreshCw size={17} className="admin-news-spinning" />
          ) : (
            <EyeOff size={17} />
          )}
        </button>
      )}

      {canManage && item.status !== "archived" && (
        <button
          type="button"
          className="admin-news-action-button archive"
          title="Archive article"
          onClick={() => handleStatusChange(item, "archived")}
          disabled={changingStatusId === item.id}
        >
          {changingStatusId === item.id ? (
            <RefreshCw size={17} className="admin-news-spinning" />
          ) : (
            <Archive size={17} />
          )}
        </button>
      )}

      {canManage && item.status === "archived" && (
        <button
          type="button"
          className="admin-news-action-button restore"
          title="Restore to drafts"
          onClick={() => handleStatusChange(item, "draft")}
          disabled={changingStatusId === item.id}
        >
          {changingStatusId === item.id ? (
            <RefreshCw size={17} className="admin-news-spinning" />
          ) : (
            <RotateCcw size={17} />
          )}
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          className="admin-news-action-button delete"
          title="Permanently delete article"
          onClick={() => handleDelete(item)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <RefreshCw
              size={17}
              className="admin-news-spinning"
            />
          ) : (
            <Trash2 size={17} />
          )}
        </button>
      )}
    </div>
  );

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="admin-news-page">

      {/* HEADER */}

      <div className="admin-news-header">
        <div className="admin-news-heading">
          <div className="admin-news-heading-icon">
            <Newspaper size={23} />
          </div>

          <div>
            <h1>News & Updates</h1>
            <p>
              Create, manage, publish, and organize college news.
            </p>
          </div>
        </div>

        <div className="admin-news-header-actions">
          <button
            type="button"
            className="admin-news-refresh"
            onClick={() => loadNews(false)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "admin-news-spinning" : ""
              }
            />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              className="admin-news-add-button"
              onClick={openCreateModal}
            >
              <Plus size={19} />
              Add News
            </button>
          )}
        </div>
      </div>

      {/* ROLE INFORMATION */}

      <div className="admin-news-role-info">
        <span className="admin-news-role-indicator">
          <UserRound size={16} />
        </span>

        <span>
          Signed in as <strong>{admin?.full_name || admin?.email || "Admin"}</strong>
          {" · "}
          <strong>
            {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Unauthorized"}
          </strong>
        </span>

        {isAuthorized && (
          <span
            className={
              isSuperAdmin
                ? "admin-news-super-label"
                : "admin-news-admin-label"
            }
          >
            Full management access
          </span>
        )}
      </div>

      {/* ALERT */}

      {alert && (
        <div
          className={`admin-news-alert admin-news-alert-${alert.type}`}
          role="alert"
        >
          {alert.type === "success" ? (
            <CheckCircle size={19} />
          ) : (
            <AlertCircle size={19} />
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

      <div className="admin-news-stats">
        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon total">
            <Newspaper size={21} />
          </div>
          <div>
            <span>Total Articles</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon published">
            <Eye size={21} />
          </div>
          <div>
            <span>Published</span>
            <strong>{stats.published}</strong>
          </div>
        </div>

        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon drafts">
            <FileText size={21} />
          </div>
          <div>
            <span>Drafts</span>
            <strong>{stats.drafts}</strong>
          </div>
        </div>

        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon archived">
            <Archive size={21} />
          </div>
          <div>
            <span>Archived</span>
            <strong>{stats.archived}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER */}

      <div className="admin-news-toolbar">
        <div className="admin-news-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search by title, category, or author..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="admin-news-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter news by status"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* NEWS TABLE */}

      <div className="admin-news-list-container">
        <div className="admin-news-list-heading">
          <div>
            <h2>All News Articles</h2>
            <p>
              Showing {filteredNews.length} of {news.length} articles
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-news-loading">
            <RefreshCw
              size={27}
              className="admin-news-spinning"
            />
            <p>Loading news articles...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="admin-news-empty">
            <div className="admin-news-empty-icon">
              <Newspaper size={34} />
            </div>

            <h3>
              {news.length === 0
                ? "No news articles yet"
                : "No matching articles"}
            </h3>

            <p>
              {news.length === 0
                ? "Create your first news article to get started."
                : "Try changing your search or status filter."}
            </p>

            {canManage && news.length === 0 && (
              <button
                type="button"
                className="admin-news-add-button"
                onClick={openCreateModal}
              >
                <Plus size={18} />
                Create First Article
              </button>
            )}
          </div>
        ) : (
          <div className="admin-news-table-wrapper">
            <table className="admin-news-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredNews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-news-article-cell">
                        <div className="admin-news-thumbnail">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                            />
                          ) : (
                            <ImageIcon size={22} />
                          )}
                        </div>

                        <div className="admin-news-article-info">
                          <strong>{item.title}</strong>
                          <span>
                            {item.excerpt || "No excerpt provided"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="admin-news-category">
                        {item.category || "Uncategorized"}
                      </span>
                    </td>

                    <td>{item.author || "—"}</td>

                    <td>
                      <span
                        className={`admin-news-status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>

                    <td>
                      <div className="admin-news-date">
                        <CalendarDays size={15} />
                        {formatDate(
                          item.published_at || item.created_at
                        )}
                      </div>
                    </td>

                    <td>{renderActions(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTION LEGEND */}

        {!loading && news.length > 0 && (
          <div className="admin-news-permission-note">
            <div>
              <Eye size={15} />
              View
            </div>
            <div>
              <Edit size={15} />
              Edit
            </div>
            <div>
              <Send size={15} />
              Publish
            </div>
            <div>
              <Archive size={15} />
              Archive
            </div>
            {canDelete && (
              <div>
                <Trash2 size={15} />
                Delete permanently
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}

      {modalOpen && (
        <div
          className="admin-news-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-news-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-modal-title"
          >
            <div className="admin-news-modal-header">
              <div>
                <h2 id="news-modal-title">
                  {editingNews
                    ? "Edit News Article"
                    : "Create News Article"}
                </h2>

                <p>
                  {editingNews
                    ? "Update the article details below."
                    : "Add a new news article to your website."}
                </p>
              </div>

              <button
                type="button"
                className="admin-news-modal-close"
                onClick={closeModal}
                disabled={saving || uploadingImage}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-news-modal-body">
                <div className="admin-news-form-group">
                  <label htmlFor="news-title">
                    Article Title <span>*</span>
                  </label>

                  <input
                    id="news-title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter news article title"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="admin-news-form-row">
                  <div className="admin-news-form-group">
                    <label htmlFor="news-category">
                      Category
                    </label>

                    <input
                      id="news-category"
                      name="category"
                      type="text"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="e.g. College News"
                      maxLength={100}
                    />
                  </div>

                  <div className="admin-news-form-group">
                    <label htmlFor="news-author">Author</label>

                    <input
                      id="news-author"
                      name="author"
                      type="text"
                      value={form.author}
                      onChange={handleChange}
                      placeholder="Author name"
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="admin-news-form-group">
                  <label htmlFor="news-excerpt">
                    Short Description
                  </label>

                  <textarea
                    id="news-excerpt"
                    name="excerpt"
                    value={form.excerpt}
                    onChange={handleChange}
                    placeholder="Write a short summary of this article..."
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                <div className="admin-news-form-group">
                  <label htmlFor="news-content">
                    Article Content <span>*</span>
                  </label>

                  <textarea
                    id="news-content"
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Write the full news article here..."
                    rows={9}
                    maxLength={50000}
                    required
                  />

                  <small>
                    {form.content.length}/50,000 characters
                  </small>
                </div>

                <div className="admin-news-form-group">
                  <label>Cover Image</label>

                  <div className="admin-news-image-upload">
                    {(imagePreview || form.image) && (
                      <div className="admin-news-image-preview">
                        <img
                          src={imagePreview || form.image}
                          alt="News cover preview"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview("");

                            setForm((previous) => ({
                              ...previous,
                              image: "",
                            }));
                          }}
                          aria-label="Remove cover image"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    )}

                    <label className="admin-news-upload-label">
                      <Upload size={20} />

                      <span>
                        {selectedImage
                          ? "Choose a different image"
                          : form.image
                            ? "Replace cover image"
                            : "Upload cover image"}
                      </span>

                      <small>
                        JPG, PNG, or WEBP. Maximum 5 MB.
                      </small>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                </div>

                <div className="admin-news-form-group">
                  <label htmlFor="news-status">
                    Publication Status
                  </label>

                  <select
                    id="news-status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>

                  <small>
                    Published articles are available through the public News API.
                  </small>
                </div>
              </div>

              <div className="admin-news-modal-footer">
                <button
                  type="button"
                  className="admin-news-cancel-button"
                  onClick={closeModal}
                  disabled={saving || uploadingImage}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-news-save-button"
                  disabled={saving || uploadingImage}
                >
                  {saving || uploadingImage ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="admin-news-spinning"
                      />
                      {uploadingImage
                        ? "Uploading image..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      {editingNews
                        ? "Save Changes"
                        : "Create Article"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ARTICLE MODAL */}

      {viewingNews && (
        <div
          className="admin-news-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewModal();
            }
          }}
        >
          <div
            className="admin-news-modal admin-news-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-view-title"
          >
            <div className="admin-news-modal-header">
              <div>
                <h2 id="news-view-title">Article Details</h2>
                <p>Preview the complete news article.</p>
              </div>

              <button
                type="button"
                className="admin-news-modal-close"
                onClick={closeViewModal}
                aria-label="Close article preview"
              >
                <X size={21} />
              </button>
            </div>

            <div className="admin-news-modal-body">
              {viewingNews.image && (
                <div className="admin-news-view-image">
                  <img
                    src={viewingNews.image}
                    alt={viewingNews.title}
                  />
                </div>
              )}

              <div className="admin-news-view-meta">
                <span
                  className={`admin-news-status ${getStatusClass(
                    viewingNews.status
                  )}`}
                >
                  {getStatusLabel(viewingNews.status)}
                </span>

                {viewingNews.category && (
                  <span>
                    <Tag size={15} />
                    {viewingNews.category}
                  </span>
                )}

                {viewingNews.author && (
                  <span>
                    <UserRound size={15} />
                    {viewingNews.author}
                  </span>
                )}

                <span>
                  <CalendarDays size={15} />
                  {formatDate(viewingNews.published_at || viewingNews.created_at)}
                </span>
              </div>

              <h2 className="admin-news-view-title">
                {viewingNews.title}
              </h2>

              {viewingNews.excerpt && (
                <p className="admin-news-view-excerpt">
                  {viewingNews.excerpt}
                </p>
              )}

              <div className="admin-news-view-content">
                {viewingNews.content || "No article content available."}
              </div>
            </div>

            <div className="admin-news-modal-footer">
              <button
                type="button"
                className="admin-news-cancel-button"
                onClick={closeViewModal}
              >
                Close
              </button>

              {canManage && (
                <button
                  type="button"
                  className="admin-news-save-button"
                  onClick={() => {
                    const article = viewingNews;
                    setViewingNews(null);
                    openEditModal(article);
                  }}
                >
                  <Edit size={17} />
                  Edit Article
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
