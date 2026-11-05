import { useEffect, useMemo, useState } from "react";
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

function formatDate(date) {
  if (!date) return "Not published";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export default function AdminNews() {
  const admin = getStoredAdmin();
  const role = admin?.role;

  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });

    window.setTimeout(() => {
      setAlert(null);
    }, 4000);
  };

  const loadNews = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const response = await api.get("/news");

      setNews(Array.isArray(response?.news) ? response.news : []);
    } catch (error) {
      showAlert(
        getErrorMessage(error, "Failed to load news articles."),
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const stats = useMemo(() => {
    return {
      total: news.length,
      published: news.filter((item) => item.status === "published").length,
      drafts: news.filter((item) => item.status === "draft").length,
      archived: news.filter((item) => item.status === "archived").length,
    };
  }, [news]);

  const filteredNews = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return news.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.title?.toLowerCase().includes(searchValue) ||
        item.category?.toLowerCase().includes(searchValue) ||
        item.author?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [news, search, statusFilter]);

  const openCreateModal = () => {
    setEditingNews(null);
    setForm({ ...initialForm });
    setSelectedImage(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingNews(item);

    setForm({
      title: item.title || "",
      excerpt: item.excerpt || "",
      content: item.content || "",
      image: item.image || "",
      category: item.category || "",
      author: item.author || "",
      status: item.status || "draft",
    });

    setSelectedImage(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || uploadingImage) return;

    setModalOpen(false);
    setEditingNews(null);
    setForm({ ...initialForm });
    setSelectedImage(null);
  };

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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      showAlert("Please select a JPG, PNG, or WEBP image.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showAlert("Image size must not exceed 5 MB.", "error");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    event.target.value = "";
  };

  const uploadImage = async () => {
    if (!selectedImage) return form.image;

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      setUploadingImage(true);

      const response = await api.post("/news/upload-image", formData);

      if (!response?.image) {
        throw new Error("Image upload did not return an image URL.");
      }

      return response.image;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canManage) return;

    if (form.title.trim().length < 3) {
      showAlert("Title must contain at least 3 characters.", "error");
      return;
    }

    if (form.content.trim().length < 10) {
      showAlert("Content must contain at least 10 characters.", "error");
      return;
    }

    try {
      setSaving(true);

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
        await api.patch(`/news/${editingNews.id}`, payload);
        showAlert("News article updated successfully.");
      } else {
        await api.post("/news", payload);
        showAlert("News article created successfully.");
      }

      setModalOpen(false);
      setEditingNews(null);
      setForm({ ...initialForm });
      setSelectedImage(null);

      await loadNews(false);
    } catch (error) {
      showAlert(
        getErrorMessage(error, "Failed to save the news article."),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      await api.delete(`/news/${item.id}`);

      setNews((previous) =>
        previous.filter((newsItem) => newsItem.id !== item.id)
      );

      showAlert("News article deleted successfully.");
    } catch (error) {
      showAlert(
        getErrorMessage(error, "Failed to delete the news article."),
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

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

  return (
    <div className="admin-news-page">
      <div className="admin-news-header">
        <div>
          <div className="admin-news-heading">
            <div className="admin-news-heading-icon">
              <Newspaper size={23} />
            </div>

            <div>
              <h1>News & Updates</h1>
              <p>
                Create, manage, and publish news and announcements.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-news-header-actions">
          <button
            type="button"
            className="admin-news-refresh"
            onClick={() => loadNews(false)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "admin-news-spinning" : ""}
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
            <RefreshCw size={27} className="admin-news-spinning" />
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
                            <img src={item.image} alt={item.title} />
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
                        {item.status || "draft"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-news-date">
                        <CalendarDays size={15} />
                        {formatDate(item.published_at || item.created_at)}
                      </div>
                    </td>

                    <td>
                      <div className="admin-news-actions">
                        {canManage && (
                          <button
                            type="button"
                            className="admin-news-action-button edit"
                            title="Edit article"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit size={17} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="admin-news-action-button delete"
                            title="Delete article"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="admin-news-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="admin-news-modal"
            style={{
              display: "flex",
              flexDirection: "column",
              height: "min(820px, calc(100vh - 50px))",
              maxHeight: "calc(100vh - 50px)",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div className="admin-news-modal-header">
              <div>
                <h2>
                  {editingNews ? "Edit News Article" : "Create News Article"}
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

            <form
              onSubmit={handleSubmit}
              style={{
                minHeight: 0,
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                className="admin-news-modal-body"
                style={{
                  minHeight: 0,
                  flex: "1 1 auto",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                }}
              >
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
                    <label htmlFor="news-category">Category</label>
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
                  <label htmlFor="news-excerpt">Short Description</label>
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
                  <small>{form.content.length}/50,000 characters</small>
                </div>

                <div className="admin-news-form-group">
                  <label>Cover Image</label>

                  <div className="admin-news-image-upload">
                    {(selectedImage || form.image) && (
                      <div className="admin-news-image-preview">
                        <img
                          src={
                            selectedImage
                              ? URL.createObjectURL(selectedImage)
                              : form.image
                          }
                          alt="News cover preview"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
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

                      <small>JPG, PNG, or WEBP. Maximum 5 MB.</small>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                </div>

                <div className="admin-news-form-group">
                  <label htmlFor="news-status">Publication Status</label>

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

              <div
                className="admin-news-modal-footer"
                style={{
                  flexShrink: 0,
                }}
              >
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
                      {uploadingImage ? "Uploading image..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      {editingNews ? "Save Changes" : "Create Article"}
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