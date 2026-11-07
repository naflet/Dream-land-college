
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Library,
  X,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Building2,
  MapPin,
  Phone,
  Clock,
  Users,
  Bookmark,
  Check,
  Ban,
  Filter,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../AuthContext";
import "../styles/admin-library.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const RESERVATION_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Completed",
  "Cancelled",
];

const BOOK_STATUSES = [
  "Available",
  "Reserved",
  "Unavailable",
];

const emptyBranch = {
  name: "",
  slug: "",
  campus: "",
  location: "",
  book_count: "",
  opening_hours: {
    monday_friday: "8:00 AM - 8:00 PM",
    saturday: "8:00 AM - 5:00 PM",
    sunday: "Closed",
  },
  phone: "",
  amenities: [],
  description: "",
  is_published: false,
  display_order: 0,
};

const emptyBook = {
  branch_id: "",
  title: "",
  category: "",
  format: "Physical",
  status: "Available",
  isbn: "",
  description: "",
  is_published: false,
  display_order: 0,
};

const emptyReservation = {
  status: "Pending",
  admin_note: "",
};

const getErrorMessage = (error) =>
  error?.message || "Something went wrong. Please try again.";

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

const parseArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const parseObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
};

const makeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatOpeningHours = (value) => {
  const hours = parseObject(value);

  return Object.entries(hours)
    .map(([day, time]) => `${day.replaceAll("_", " ")}: ${time}`)
    .join(" · ");
};

const getBranchName = (book, branches) => {
  const nestedName =
    book?.library_branches?.name ||
    book?.branch?.name;

  if (nestedName) return nestedName;

  return branches.find(
    (branch) => String(branch.id) === String(book.branch_id)
  )?.name || "Unknown branch";
};

export default function AdminLibrary() {
  const { admin } = useAuth();

  const imageInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [activeTab, setActiveTab] = useState("Branches");

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

  const [branchForm, setBranchForm] = useState(emptyBranch);
  const [bookForm, setBookForm] = useState(emptyBook);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [reservationModal, setReservationModal] = useState(null);
  const [reservationForm, setReservationForm] = useState(emptyReservation);
  const [updatingReservation, setUpdatingReservation] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const role = String(admin?.role || "").toLowerCase();

  const canManage = ["super_admin", "admin"].includes(role);
  const canDelete = role === "super_admin";

  const totalPublishedBranches = branches.filter(
    (branch) => branch.is_published
  ).length;

  const totalPublishedBooks = books.filter(
    (book) => book.is_published
  ).length;

  const pendingReservations = reservations.filter(
    (item) => item.status === "Pending"
  ).length;

  const releaseImagePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const loadLibrary = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [branchResponse, bookResponse, reservationResponse] =
        await Promise.all([
          api.get("/library/branches"),
          api.get("/library/books"),
          api.get("/library/reservations"),
        ]);

      if (!branchResponse?.success) {
        throw new Error(
          branchResponse?.message || "Unable to load library branches."
        );
      }

      if (!bookResponse?.success) {
        throw new Error(
          bookResponse?.message || "Unable to load library books."
        );
      }

      if (!reservationResponse?.success) {
        throw new Error(
          reservationResponse?.message ||
            "Unable to load library reservations."
        );
      }

      setBranches(branchResponse.branches || []);
      setBooks(bookResponse.books || []);
      setReservations(reservationResponse.reservations || []);
    } catch (err) {
      console.error("Admin library loading error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [loadLibrary]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (activeTab === "Branches") {
      return branches.filter((branch) => {
        const matchesSearch =
          !query ||
          branch.name?.toLowerCase().includes(query) ||
          branch.campus?.toLowerCase().includes(query) ||
          branch.location?.toLowerCase().includes(query) ||
          branch.description?.toLowerCase().includes(query);

        const matchesFilter =
          activeFilter === "All" ||
          (activeFilter === "Published" && branch.is_published) ||
          (activeFilter === "Drafts" && !branch.is_published);

        return matchesSearch && matchesFilter;
      });
    }

    if (activeTab === "Books") {
      return books.filter((book) => {
        const matchesSearch =
          !query ||
          book.title?.toLowerCase().includes(query) ||
          book.category?.toLowerCase().includes(query) ||
          book.isbn?.toLowerCase().includes(query) ||
          getBranchName(book, branches).toLowerCase().includes(query);

        const matchesFilter =
          activeFilter === "All" ||
          (activeFilter === "Published" && book.is_published) ||
          (activeFilter === "Drafts" && !book.is_published) ||
          (activeFilter === "Available" && book.status === "Available") ||
          (activeFilter === "Reserved" && book.status === "Reserved") ||
          (activeFilter === "Unavailable" && book.status === "Unavailable");

        return matchesSearch && matchesFilter;
      });
    }

    return reservations.filter((reservation) => {
      const book = reservation.library_books || {};
      const branch = book.library_branches || {};

      const matchesSearch =
        !query ||
        reservation.student_id?.toLowerCase().includes(query) ||
        book.title?.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query) ||
        branch.name?.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === "All" ||
        reservation.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [
    activeTab,
    branches,
    books,
    reservations,
    searchQuery,
    activeFilter,
  ]);

  const filters = useMemo(() => {
    if (activeTab === "Branches") {
      return ["All", "Published", "Drafts"];
    }

    if (activeTab === "Books") {
      return [
        "All",
        "Published",
        "Drafts",
        "Available",
        "Reserved",
        "Unavailable",
      ];
    }

    return ["All", ...RESERVATION_STATUSES];
  }, [activeTab]);

  const updateBranchForm = (field, value) => {
    setBranchForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateBookForm = (field, value) => {
    setBookForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetModal = () => {
    releaseImagePreview();

    setBranchForm(emptyBranch);
    setBookForm(emptyBook);
    setSelectedImage(null);
    setImagePreview("");
    setEditingItem(null);
    setFormError("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetModal();
  };

  const openCreateModal = () => {
    if (!canManage) return;

    resetModal();

    if (activeTab === "Books" && branches.length > 0) {
      setBookForm({
        ...emptyBook,
        branch_id: branches[0].id,
      });
    }

    setModalOpen(true);
  };

  const openEditBranch = (branch) => {
    resetModal();

    setEditingItem(branch);

    setBranchForm({
      ...emptyBranch,
      ...branch,
      opening_hours: parseObject(branch.opening_hours),
      amenities: parseArray(branch.amenities),
      display_order: branch.display_order ?? 0,
      is_published: Boolean(branch.is_published),
    });

    setImagePreview(branch.image_url || "");
    setModalOpen(true);
  };

  const openEditBook = (book) => {
    resetModal();

    setEditingItem(book);

    setBookForm({
      ...emptyBook,
      ...book,
      display_order: book.display_order ?? 0,
      is_published: Boolean(book.is_published),
    });

    setModalOpen(true);
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFormError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFormError("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    releaseImagePreview();

    const preview = URL.createObjectURL(file);

    previewUrlRef.current = preview;

    setSelectedImage(file);
    setImagePreview(preview);
  };

  const updateOpeningHours = (field, value) => {
    setBranchForm((current) => ({
      ...current,
      opening_hours: {
        ...current.opening_hours,
        [field]: value,
      },
    }));
  };

  const addAmenity = (value) => {
    const amenity = value.trim();

    if (!amenity) return;

    setBranchForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities
        : [...current.amenities, amenity],
    }));
  };

  const removeAmenity = (amenity) => {
    setBranchForm((current) => ({
      ...current,
      amenities: current.amenities.filter(
        (item) => item !== amenity
      ),
    }));
  };

  const handleBranchSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!canManage) {
      setFormError("You do not have permission to manage library branches.");
      return;
    }

    if (!branchForm.name.trim()) {
      setFormError("Please enter the branch name.");
      return;
    }

    if (!branchForm.slug.trim()) {
      setFormError("Please enter a branch slug.");
      return;
    }

    if (!editingItem && !selectedImage) {
      setFormError("Please select a branch image.");
      return;
    }

    if (
      !branchForm.opening_hours ||
      typeof branchForm.opening_hours !== "object"
    ) {
      setFormError("Please provide valid opening hours.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", branchForm.name.trim());
      formData.append("slug", makeSlug(branchForm.slug));
      formData.append("campus", branchForm.campus.trim());
      formData.append("location", branchForm.location.trim());
      formData.append("book_count", branchForm.book_count.trim());
      formData.append(
        "opening_hours",
        JSON.stringify(branchForm.opening_hours)
      );
      formData.append("phone", branchForm.phone.trim());
      formData.append(
        "amenities",
        JSON.stringify(branchForm.amenities)
      );
      formData.append("description", branchForm.description.trim());
      formData.append(
        "display_order",
        String(Number(branchForm.display_order) || 0)
      );
      formData.append(
        "is_published",
        String(branchForm.is_published)
      );

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      if (editingItem) {
        await api.patch(
          `/library/branches/${editingItem.id}`,
          formData
        );

        setNotice("Library branch updated successfully.");
      } else {
        await api.post("/library/branches", formData);

        setNotice("Library branch created successfully.");
      }

      setModalOpen(false);
      resetModal();

      await loadLibrary(true);
    } catch (err) {
      console.error("Library branch save error:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBookSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!canManage) {
      setFormError("You do not have permission to manage library books.");
      return;
    }

    if (!bookForm.branch_id) {
      setFormError("Please select a library branch.");
      return;
    }

    if (!bookForm.title.trim()) {
      setFormError("Please enter the book title.");
      return;
    }

    if (!BOOK_STATUSES.includes(bookForm.status)) {
      setFormError("Please select a valid book status.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        branch_id: bookForm.branch_id,
        title: bookForm.title.trim(),
        category: bookForm.category.trim(),
        format: bookForm.format.trim(),
        status: bookForm.status,
        isbn: bookForm.isbn.trim(),
        description: bookForm.description.trim(),
        is_published: Boolean(bookForm.is_published),
        display_order: Number(bookForm.display_order) || 0,
      };

      if (editingItem) {
        await api.patch(
          `/library/books/${editingItem.id}`,
          payload
        );

        setNotice("Library book updated successfully.");
      } else {
        await api.post("/library/books", payload);

        setNotice("Library book added successfully.");
      }

      setModalOpen(false);
      resetModal();

      await loadLibrary(true);
    } catch (err) {
      console.error("Library book save error:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openReservationModal = (reservation) => {
    setReservationModal(reservation);

    setReservationForm({
      status: reservation.status || "Pending",
      admin_note: reservation.admin_note || "",
    });
  };

  const closeReservationModal = () => {
    if (updatingReservation) return;

    setReservationModal(null);
    setReservationForm(emptyReservation);
  };

  const handleReservationUpdate = async (event) => {
    event.preventDefault();

    if (!reservationModal) return;

    if (!RESERVATION_STATUSES.includes(reservationForm.status)) {
      setError("Please select a valid reservation status.");
      return;
    }

    try {
      setUpdatingReservation(true);
      setError("");

      await api.patch(
        `/library/reservations/${reservationModal.id}`,
        {
          status: reservationForm.status,
          admin_note: reservationForm.admin_note.trim(),
        }
      );

      setReservationModal(null);
      setReservationForm(emptyReservation);
      setNotice("Reservation updated successfully.");

      await loadLibrary(true);
    } catch (err) {
      console.error("Reservation update error:", err);
      setError(getErrorMessage(err));
    } finally {
      setUpdatingReservation(false);
    }
  };

  const handleTogglePublish = async (item, type) => {
    if (!canManage) return;

    try {
      if (type === "branch") {
        const formData = new FormData();

        formData.append("name", item.name || "");
        formData.append("slug", item.slug || "");
        formData.append("campus", item.campus || "");
        formData.append("location", item.location || "");
        formData.append("book_count", item.book_count || "");
        formData.append(
          "opening_hours",
          JSON.stringify(parseObject(item.opening_hours))
        );
        formData.append("phone", item.phone || "");
        formData.append(
          "amenities",
          JSON.stringify(parseArray(item.amenities))
        );
        formData.append("description", item.description || "");
        formData.append(
          "display_order",
          String(item.display_order ?? 0)
        );
        formData.append(
          "is_published",
          String(!item.is_published)
        );

        await api.patch(
          `/library/branches/${item.id}`,
          formData
        );
      } else {
        await api.patch(`/library/books/${item.id}`, {
          branch_id: item.branch_id,
          title: item.title || "",
          category: item.category || "",
          format: item.format || "",
          status: item.status || "Available",
          isbn: item.isbn || "",
          description: item.description || "",
          display_order: item.display_order ?? 0,
          is_published: !item.is_published,
        });
      }

      setNotice(
        !item.is_published
          ? `${type === "branch" ? "Branch" : "Book"} published successfully.`
          : `${type === "branch" ? "Branch" : "Book"} moved to drafts.`
      );

      await loadLibrary(true);
    } catch (err) {
      console.error("Library publish update error:", err);
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !canDelete) return;

    try {
      setDeleting(true);

      if (deleteTarget.type === "branch") {
        await api.delete(
          `/library/branches/${deleteTarget.item.id}`
        );
      } else {
        await api.delete(
          `/library/books/${deleteTarget.item.id}`
        );
      }

      setDeleteTarget(null);

      setNotice(
        `${deleteTarget.type === "branch" ? "Library branch" : "Library book"} deleted successfully.`
      );

      await loadLibrary(true);
    } catch (err) {
      console.error("Library deletion error:", err);
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const getStatusClass = (status) =>
    String(status || "")
      .toLowerCase()
      .replace(/[^a-z]+/g, "-");

  const renderBranchCard = (branch) => {
    const amenities = parseArray(branch.amenities);
    const hours = parseObject(branch.opening_hours);

    const branchBookCount = books.filter(
      (book) => String(book.branch_id) === String(branch.id)
    ).length;

    return (
      <article className="al-card" key={branch.id}>
        <div className="al-card-cover">
          {branch.image_url ? (
            <img
              src={branch.image_url}
              alt={branch.name}
              loading="lazy"
            />
          ) : (
            <div className="al-no-image">
              <Building2 size={35} />
              <span>No branch image</span>
            </div>
          )}

          <span
            className={`al-status ${
              branch.is_published ? "published" : "draft"
            }`}
          >
            {branch.is_published ? (
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

          <span className="al-card-count">
            <BookOpen size={14} />
            {branchBookCount} Books
          </span>
        </div>

        <div className="al-card-body">
          <div className="al-card-meta">
            <span className="al-category">
              {branch.campus || "Library Branch"}
            </span>
            <span className="al-order">
              Order: {branch.display_order ?? 0}
            </span>
          </div>

          <h3>{branch.name}</h3>

          <div className="al-detail-line">
            <MapPin size={14} />
            <span>{branch.location || "Location not provided"}</span>
          </div>

          <div className="al-detail-line">
            <Phone size={14} />
            <span>{branch.phone || "No phone number"}</span>
          </div>

          <div className="al-detail-line">
            <Clock size={14} />
            <span>
              {formatOpeningHours(hours) || "Opening hours not provided"}
            </span>
          </div>

          <p className="al-description">
            {branch.description || "No description provided."}
          </p>

          {amenities.length > 0 && (
            <div className="al-amenities">
              {amenities.slice(0, 3).map((amenity) => (
                <span key={amenity}>{amenity}</span>
              ))}
              {amenities.length > 3 && (
                <span>+{amenities.length - 3}</span>
              )}
            </div>
          )}

          <div className="al-card-date">
            <span>Book collection</span>
            <strong>{branch.book_count || `${branchBookCount} books`}</strong>
          </div>

          <div className="al-card-actions">
            {canManage && (
              <>
                <button
                  type="button"
                  className="al-action-btn al-action-edit"
                  onClick={() => openEditBranch(branch)}
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  className={`al-action-btn ${
                    branch.is_published
                      ? "al-action-unpublish"
                      : "al-action-publish"
                  }`}
                  onClick={() => handleTogglePublish(branch, "branch")}
                >
                  {branch.is_published ? (
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
                className="al-action-btn al-action-delete"
                onClick={() =>
                  setDeleteTarget({ type: "branch", item: branch })
                }
                aria-label={`Delete ${branch.name}`}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderBookCard = (book) => (
    <article className="al-book-card" key={book.id}>
      <div className="al-book-cover">
        <div className="al-book-cover-icon">
          <BookOpen size={34} />
        </div>

        <span className={`al-book-status ${getStatusClass(book.status)}`}>
          {book.status || "Unknown"}
        </span>

        <span
          className={`al-status al-book-published ${
            book.is_published ? "published" : "draft"
          }`}
        >
          {book.is_published ? "Published" : "Draft"}
        </span>
      </div>

      <div className="al-card-body">
        <div className="al-card-meta">
          <span className="al-category">
            {book.category || "Uncategorized"}
          </span>
          <span className="al-order">
            Order: {book.display_order ?? 0}
          </span>
        </div>

        <h3>{book.title}</h3>

        <div className="al-detail-line">
          <Building2 size={14} />
          <span>{getBranchName(book, branches)}</span>
        </div>

        <div className="al-detail-line">
          <Bookmark size={14} />
          <span>{book.format || "Format not specified"}</span>
        </div>

        <div className="al-detail-line">
          <Library size={14} />
          <span>ISBN: {book.isbn || "Not provided"}</span>
        </div>

        <p className="al-description">
          {book.description || "No description provided."}
        </p>

        <div className="al-card-actions">
          {canManage && (
            <>
              <button
                type="button"
                className="al-action-btn al-action-edit"
                onClick={() => openEditBook(book)}
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                type="button"
                className={`al-action-btn ${
                  book.is_published
                    ? "al-action-unpublish"
                    : "al-action-publish"
                }`}
                onClick={() => handleTogglePublish(book, "book")}
              >
                {book.is_published ? (
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
              className="al-action-btn al-action-delete"
              onClick={() =>
                setDeleteTarget({ type: "book", item: book })
              }
              aria-label={`Delete ${book.title}`}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );

  const renderReservationRow = (reservation) => {
    const book = reservation.library_books || {};
    const branch = book.library_branches || {};

    return (
      <article className="al-reservation-card" key={reservation.id}>
        <div className="al-reservation-main">
          <div className="al-reservation-icon">
            <Bookmark size={21} />
          </div>

          <div className="al-reservation-info">
            <h3>{book.title || "Book information unavailable"}</h3>
            <p>
              Student ID: <strong>{reservation.student_id}</strong>
            </p>
            <div className="al-reservation-details">
              <span>
                <Building2 size={13} />
                {branch.name || "Unknown branch"}
              </span>
              <span>
                <Clock size={13} />
                {formatDate(reservation.created_at)}
              </span>
              {book.isbn && <span>ISBN: {book.isbn}</span>}
            </div>
            {reservation.admin_note && (
              <p className="al-admin-note">
                Admin note: {reservation.admin_note}
              </p>
            )}
          </div>
        </div>

        <div className="al-reservation-actions">
          <span
            className={`al-reservation-status ${getStatusClass(
              reservation.status
            )}`}
          >
            {reservation.status}
          </span>

          <button
            type="button"
            className="al-action-btn al-action-edit"
            onClick={() => openReservationModal(reservation)}
          >
            <Pencil size={15} />
            Manage
          </button>
        </div>
      </article>
    );
  };

  const currentEmpty = filteredItems.length === 0;

  return (
    <div className="admin-library-page">
      {/* PAGE HEADER */}

      <div className="admin-library-header">
        <div>
          <div className="al-eyebrow">
            <Library size={15} />
            WEBSITE CONTENT
          </div>

          <h1>Library Management</h1>

          <p>
            Manage library branches, book collections, and student
            reservations across Dream Land College campuses.
          </p>
        </div>

        <div className="al-header-actions">
          <button
            type="button"
            className="al-btn al-btn-secondary"
            onClick={() => loadLibrary(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "al-spin" : ""}
            />
            Refresh
          </button>

          {canManage && activeTab !== "Reservations" && (
            <button
              type="button"
              className="al-btn al-btn-primary"
              onClick={openCreateModal}
              disabled={activeTab === "Books" && branches.length === 0}
            >
              <Plus size={18} />
              {activeTab === "Branches" ? "Add Branch" : "Add Book"}
            </button>
          )}
        </div>
      </div>

      {/* ALERTS */}

      {notice && (
        <div className="al-alert al-alert-success">
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
        <div className="al-alert al-alert-error">
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

      <div className="al-stats-grid">
        <div className="al-stat-card">
          <div className="al-stat-icon al-stat-blue">
            <Building2 size={21} />
          </div>
          <div>
            <span>Total Branches</span>
            <strong>{branches.length}</strong>
            <small>{totalPublishedBranches} published</small>
          </div>
        </div>

        <div className="al-stat-card">
          <div className="al-stat-icon al-stat-teal">
            <BookOpen size={21} />
          </div>
          <div>
            <span>Total Books</span>
            <strong>{books.length}</strong>
            <small>{totalPublishedBooks} published</small>
          </div>
        </div>

        <div className="al-stat-card">
          <div className="al-stat-icon al-stat-green">
            <Users size={21} />
          </div>
          <div>
            <span>Reservations</span>
            <strong>{reservations.length}</strong>
            <small>{pendingReservations} pending</small>
          </div>
        </div>

        <div className="al-stat-card">
          <div className="al-stat-icon al-stat-orange">
            <Bookmark size={21} />
          </div>
          <div>
            <span>Available Books</span>
            <strong>
              {books.filter((book) => book.status === "Available").length}
            </strong>
            <small>Across all branches</small>
          </div>
        </div>
      </div>

      {/* MAIN TABS */}

      <div className="al-main-tabs">
        <button
          type="button"
          className={activeTab === "Branches" ? "active" : ""}
          onClick={() => {
            setActiveTab("Branches");
            setActiveFilter("All");
            setSearchQuery("");
          }}
        >
          <Building2 size={17} />
          Branches
          <span>{branches.length}</span>
        </button>

        <button
          type="button"
          className={activeTab === "Books" ? "active" : ""}
          onClick={() => {
            setActiveTab("Books");
            setActiveFilter("All");
            setSearchQuery("");
          }}
        >
          <BookOpen size={17} />
          Books
          <span>{books.length}</span>
        </button>

        <button
          type="button"
          className={activeTab === "Reservations" ? "active" : ""}
          onClick={() => {
            setActiveTab("Reservations");
            setActiveFilter("All");
            setSearchQuery("");
          }}
        >
          <Bookmark size={17} />
          Reservations
          <span className={pendingReservations ? "al-tab-pending" : ""}>
            {reservations.length}
          </span>
        </button>
      </div>

      {/* TOOLBAR */}

      <div className="al-toolbar">
        <div className="al-search">
          <Search size={18} />

          <input
            type="text"
            placeholder={
              activeTab === "Branches"
                ? "Search branches, campuses, locations..."
                : activeTab === "Books"
                  ? "Search books, ISBN, categories..."
                  : "Search student ID, book, branch..."
            }
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

        <div className="al-filter-tabs">
          <Filter size={15} />

          {filters.map((filter) => (
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

      {/* CONTENT */}

      {loading ? (
        <div className="al-state">
          <RefreshCw size={30} className="al-spin" />
          <h3>Loading library information</h3>
          <p>Please wait while your library data is being loaded.</p>
        </div>
      ) : currentEmpty ? (
        <div className="al-state">
          <div className="al-state-icon">
            {activeTab === "Branches" ? (
              <Building2 size={35} />
            ) : activeTab === "Books" ? (
              <BookOpen size={35} />
            ) : (
              <Bookmark size={35} />
            )}
          </div>

          <h3>
            {searchQuery || activeFilter !== "All"
              ? "No Matching Results"
              : activeTab === "Branches"
                ? "No Library Branches Yet"
                : activeTab === "Books"
                  ? "No Library Books Yet"
                  : "No Reservations Yet"}
          </h3>

          <p>
            {searchQuery || activeFilter !== "All"
              ? "Try another search term or change the selected filter."
              : activeTab === "Branches"
                ? "Create your first library branch to start managing your campus libraries."
                : activeTab === "Books"
                  ? "Add books to your library branches to make them available in the public catalog."
                  : "Student book reservations will appear here when submitted."}
          </p>

          {canManage &&
            activeTab !== "Reservations" &&
            !searchQuery &&
            activeFilter === "All" && (
              <button
                type="button"
                className="al-btn al-btn-primary"
                onClick={openCreateModal}
                disabled={activeTab === "Books" && branches.length === 0}
              >
                <Plus size={18} />
                {activeTab === "Branches"
                  ? "Create First Branch"
                  : "Add First Book"}
              </button>
            )}
        </div>
      ) : activeTab === "Reservations" ? (
        <div className="al-reservation-list">
          {filteredItems.map(renderReservationRow)}
        </div>
      ) : activeTab === "Branches" ? (
        <div className="al-grid">
          {filteredItems.map(renderBranchCard)}
        </div>
      ) : (
        <div className="al-book-grid">
          {filteredItems.map(renderBookCard)}
        </div>
      )}

      {/* BRANCH / BOOK CREATE AND EDIT MODAL */}

      {modalOpen && (
        <div
          className="al-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="al-modal">
            <div className="al-modal-header">
              <div>
                <span className="al-modal-kicker">
                  LIBRARY CONTENT
                </span>

                <h2>
                  {activeTab === "Branches"
                    ? editingItem
                      ? "Edit Library Branch"
                      : "Create Library Branch"
                    : editingItem
                      ? "Edit Library Book"
                      : "Add Library Book"}
                </h2>

                <p>
                  {activeTab === "Branches"
                    ? "Enter branch information and upload its image."
                    : "Add book details and assign it to a library branch."}
                </p>
              </div>

              <button
                type="button"
                className="al-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={
                activeTab === "Branches"
                  ? handleBranchSubmit
                  : handleBookSubmit
              }
            >
              <div className="al-modal-content">
                {formError && (
                  <div className="al-alert al-alert-error">
                    <AlertCircle size={17} />
                    <span>{formError}</span>
                  </div>
                )}

                {activeTab === "Branches" ? (
                  <>
                    <div className="al-form-grid">
                      <div className="al-form-group al-form-full">
                        <label htmlFor="branch-name">
                          Branch Name <span>*</span>
                        </label>
                        <input
                          id="branch-name"
                          type="text"
                          placeholder="e.g. Addis Ababa Main Library"
                          value={branchForm.name}
                          onChange={(event) => {
                            const name = event.target.value;
                            setBranchForm((current) => ({
                              ...current,
                              name,
                              slug: editingItem
                                ? current.slug
                                : makeSlug(name),
                            }));
                          }}
                          maxLength={255}
                          required
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="branch-slug">
                          Branch Slug <span>*</span>
                        </label>
                        <input
                          id="branch-slug"
                          type="text"
                          placeholder="addis-ababa-main-library"
                          value={branchForm.slug}
                          onChange={(event) =>
                            updateBranchForm(
                              "slug",
                              makeSlug(event.target.value)
                            )
                          }
                          maxLength={255}
                          required
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="branch-campus">Campus</label>
                        <input
                          id="branch-campus"
                          type="text"
                          placeholder="Main Campus"
                          value={branchForm.campus}
                          onChange={(event) =>
                            updateBranchForm("campus", event.target.value)
                          }
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="branch-location">Location</label>
                        <input
                          id="branch-location"
                          type="text"
                          placeholder="Addis Ababa"
                          value={branchForm.location}
                          onChange={(event) =>
                            updateBranchForm("location", event.target.value)
                          }
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="branch-phone">Phone</label>
                        <input
                          id="branch-phone"
                          type="tel"
                          placeholder="+251..."
                          value={branchForm.phone}
                          onChange={(event) =>
                            updateBranchForm("phone", event.target.value)
                          }
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="branch-book-count">
                          Book Collection
                        </label>
                        <input
                          id="branch-book-count"
                          type="text"
                          placeholder="15,000+ Volumes"
                          value={branchForm.book_count}
                          onChange={(event) =>
                            updateBranchForm("book_count", event.target.value)
                          }
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="branch-order">Display Order</label>
                        <input
                          id="branch-order"
                          type="number"
                          min="0"
                          value={branchForm.display_order}
                          onChange={(event) =>
                            updateBranchForm(
                              "display_order",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="al-form-group al-form-full">
                        <label htmlFor="branch-description">
                          Description
                        </label>
                        <textarea
                          id="branch-description"
                          rows={4}
                          placeholder="Describe this library branch..."
                          value={branchForm.description}
                          onChange={(event) =>
                            updateBranchForm("description", event.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* OPENING HOURS */}

                    <div className="al-section-divider">
                      <h3>
                        <Clock size={17} />
                        Opening Hours
                      </h3>
                    </div>

                    <div className="al-form-grid">
                      <div className="al-form-group">
                        <label htmlFor="hours-weekdays">
                          Monday - Friday
                        </label>
                        <input
                          id="hours-weekdays"
                          type="text"
                          value={branchForm.opening_hours.monday_friday || ""}
                          onChange={(event) =>
                            updateOpeningHours(
                              "monday_friday",
                              event.target.value
                            )
                          }
                          placeholder="8:00 AM - 8:00 PM"
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="hours-saturday">Saturday</label>
                        <input
                          id="hours-saturday"
                          type="text"
                          value={branchForm.opening_hours.saturday || ""}
                          onChange={(event) =>
                            updateOpeningHours("saturday", event.target.value)
                          }
                          placeholder="8:00 AM - 5:00 PM"
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="hours-sunday">Sunday</label>
                        <input
                          id="hours-sunday"
                          type="text"
                          value={branchForm.opening_hours.sunday || ""}
                          onChange={(event) =>
                            updateOpeningHours("sunday", event.target.value)
                          }
                          placeholder="Closed"
                        />
                      </div>
                    </div>

                    {/* AMENITIES */}

                    <div className="al-section-divider">
                      <h3>
                        <CheckCircle2 size={17} />
                        Branch Amenities
                      </h3>
                    </div>

                    <div className="al-amenity-editor">
                      <div className="al-amenity-input-row">
                        <input
                          type="text"
                          id="new-amenity"
                          placeholder="Type an amenity and press Add"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addAmenity(event.currentTarget.value);
                              event.currentTarget.value = "";
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="al-btn al-btn-secondary"
                          onClick={() => {
                            const input =
                              document.getElementById("new-amenity");
                            if (input) {
                              addAmenity(input.value);
                              input.value = "";
                            }
                          }}
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>

                      <div className="al-amenity-list">
                        {branchForm.amenities.map((amenity) => (
                          <span key={amenity}>
                            {amenity}
                            <button
                              type="button"
                              onClick={() => removeAmenity(amenity)}
                              aria-label={`Remove ${amenity}`}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}

                        {branchForm.amenities.length === 0 && (
                          <small>No amenities added yet.</small>
                        )}
                      </div>
                    </div>

                    {/* BRANCH IMAGE */}

                    <div className="al-section-divider">
                      <h3>
                        <ImageIcon size={17} />
                        Branch Image
                      </h3>
                    </div>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={handleImageSelection}
                    />

                    <button
                      type="button"
                      className="al-upload-dropzone"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <div className="al-upload-icon">
                        <Upload size={24} />
                      </div>
                      <strong>
                        {selectedImage
                          ? "Choose a different image"
                          : "Click to select branch image"}
                      </strong>
                      <span>
                        Select an image file from your computer
                      </span>
                      <small>JPG, PNG, WEBP · Maximum 5 MB</small>
                    </button>

                    {imagePreview && (
                      <div className="al-branch-image-preview">
                        <img src={imagePreview} alt="Branch preview" />
                        <div>
                          <strong>
                            {selectedImage ? selectedImage.name : "Current image"}
                          </strong>
                          <span>
                            {selectedImage
                              ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`
                              : "Existing uploaded image"}
                          </span>
                        </div>
                        {selectedImage && (
                          <button
                            type="button"
                            onClick={() => {
                              releaseImagePreview();
                              setSelectedImage(null);
                              setImagePreview(editingItem?.image_url || "");
                              if (imageInputRef.current) {
                                imageInputRef.current.value = "";
                              }
                            }}
                            aria-label="Remove selected replacement image"
                          >
                            <X size={17} />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="al-publish-option">
                      <div className="al-publish-icon">
                        {branchForm.is_published ? (
                          <Eye size={19} />
                        ) : (
                          <EyeOff size={19} />
                        )}
                      </div>
                      <div className="al-publish-text">
                        <strong>
                          {branchForm.is_published
                            ? "Publish this branch"
                            : "Save as a draft"}
                        </strong>
                        <span>
                          {branchForm.is_published
                            ? "This branch will be visible on the public Library page."
                            : "This branch will remain hidden from public visitors."}
                        </span>
                      </div>
                      <label className="al-switch">
                        <input
                          type="checkbox"
                          checked={branchForm.is_published}
                          onChange={(event) =>
                            updateBranchForm(
                              "is_published",
                              event.target.checked
                            )
                          }
                        />
                        <span className="al-switch-slider" />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="al-form-grid">
                      <div className="al-form-group al-form-full">
                        <label htmlFor="book-title">
                          Book Title <span>*</span>
                        </label>
                        <input
                          id="book-title"
                          type="text"
                          placeholder="Enter book title"
                          value={bookForm.title}
                          onChange={(event) =>
                            updateBookForm("title", event.target.value)
                          }
                          maxLength={255}
                          required
                        />
                      </div>

                      <div className="al-form-group al-form-full">
                        <label htmlFor="book-branch">
                          Library Branch <span>*</span>
                        </label>
                        <select
                          id="book-branch"
                          value={bookForm.branch_id}
                          onChange={(event) =>
                            updateBookForm("branch_id", event.target.value)
                          }
                          required
                        >
                          <option value="">Select a library branch</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name} {branch.campus ? `— ${branch.campus}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="book-category">Category</label>
                        <input
                          id="book-category"
                          type="text"
                          placeholder="e.g. Computer Science"
                          value={bookForm.category}
                          onChange={(event) =>
                            updateBookForm("category", event.target.value)
                          }
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="book-format">Format</label>
                        <select
                          id="book-format"
                          value={bookForm.format}
                          onChange={(event) =>
                            updateBookForm("format", event.target.value)
                          }
                        >
                          <option value="Physical">Physical</option>
                          <option value="Digital">Digital</option>
                          <option value="Reference">Reference</option>
                          <option value="Journal">Journal</option>
                          <option value="Thesis">Thesis</option>
                          <option value="Magazine">Magazine</option>
                        </select>
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="book-isbn">ISBN</label>
                        <input
                          id="book-isbn"
                          type="text"
                          placeholder="Enter ISBN"
                          value={bookForm.isbn}
                          onChange={(event) =>
                            updateBookForm("isbn", event.target.value)
                          }
                        />
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="book-status">Availability Status</label>
                        <select
                          id="book-status"
                          value={bookForm.status}
                          onChange={(event) =>
                            updateBookForm("status", event.target.value)
                          }
                        >
                          {BOOK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="al-form-group">
                        <label htmlFor="book-order">Display Order</label>
                        <input
                          id="book-order"
                          type="number"
                          min="0"
                          value={bookForm.display_order}
                          onChange={(event) =>
                            updateBookForm(
                              "display_order",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="al-form-group al-form-full">
                        <label htmlFor="book-description">Description</label>
                        <textarea
                          id="book-description"
                          rows={4}
                          placeholder="Describe this book..."
                          value={bookForm.description}
                          onChange={(event) =>
                            updateBookForm("description", event.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="al-publish-option">
                      <div className="al-publish-icon">
                        {bookForm.is_published ? (
                          <Eye size={19} />
                        ) : (
                          <EyeOff size={19} />
                        )}
                      </div>
                      <div className="al-publish-text">
                        <strong>
                          {bookForm.is_published
                            ? "Publish this book"
                            : "Save as a draft"}
                        </strong>
                        <span>
                          {bookForm.is_published
                            ? "This book will appear in the public library catalog."
                            : "This book will remain hidden from public visitors."}
                        </span>
                      </div>
                      <label className="al-switch">
                        <input
                          type="checkbox"
                          checked={bookForm.is_published}
                          onChange={(event) =>
                            updateBookForm(
                              "is_published",
                              event.target.checked
                            )
                          }
                        />
                        <span className="al-switch-slider" />
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="al-modal-footer">
                <button
                  type="button"
                  className="al-btn al-btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="al-btn al-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="al-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingItem ? (
                        <Save size={17} />
                      ) : (
                        <Plus size={17} />
                      )}
                      {editingItem
                        ? "Save Changes"
                        : activeTab === "Branches"
                          ? "Create Branch"
                          : "Add Book"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESERVATION MANAGEMENT MODAL */}

      {reservationModal && (
        <div
          className="al-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReservationModal();
            }
          }}
        >
          <div className="al-modal al-reservation-modal">
            <div className="al-modal-header">
              <div>
                <span className="al-modal-kicker">
                  STUDENT REQUEST
                </span>
                <h2>Manage Reservation</h2>
                <p>Review the request and update its status.</p>
              </div>

              <button
                type="button"
                className="al-modal-close"
                onClick={closeReservationModal}
                disabled={updatingReservation}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleReservationUpdate}>
              <div className="al-modal-content">
                <div className="al-reservation-summary">
                  <div>
                    <span>Book</span>
                    <strong>
                      {reservationModal.library_books?.title ||
                        "Book information unavailable"}
                    </strong>
                  </div>

                  <div>
                    <span>Student ID</span>
                    <strong>{reservationModal.student_id}</strong>
                  </div>

                  <div>
                    <span>Branch</span>
                    <strong>
                      {reservationModal.library_books?.library_branches?.name ||
                        "Unknown branch"}
                    </strong>
                  </div>

                  <div>
                    <span>Requested</span>
                    <strong>{formatDate(reservationModal.created_at)}</strong>
                  </div>
                </div>

                <div className="al-form-group">
                  <label htmlFor="reservation-status">
                    Reservation Status <span>*</span>
                  </label>
                  <select
                    id="reservation-status"
                    value={reservationForm.status}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    required
                  >
                    {RESERVATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="al-form-group al-note-group">
                  <label htmlFor="reservation-note">Admin Note</label>
                  <textarea
                    id="reservation-note"
                    rows={4}
                    placeholder="Add an optional note about this reservation..."
                    value={reservationForm.admin_note}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        admin_note: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="al-modal-footer">
                <button
                  type="button"
                  className="al-btn al-btn-secondary"
                  onClick={closeReservationModal}
                  disabled={updatingReservation}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="al-btn al-btn-primary"
                  disabled={updatingReservation}
                >
                  {updatingReservation ? (
                    <>
                      <RefreshCw size={17} className="al-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Update Reservation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteTarget && (
        <div className="al-confirm-backdrop">
          <div className="al-confirm-modal">
            <div className="al-confirm-icon">
              <Trash2 size={25} />
            </div>

            <h2>
              Delete {deleteTarget.type === "branch" ? "Library Branch" : "Book"}?
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.item.name || deleteTarget.item.title}</strong>?
              This action cannot be undone.
            </p>

            <div className="al-confirm-actions">
              <button
                type="button"
                className="al-btn al-btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="al-btn al-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={16} className="al-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
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
