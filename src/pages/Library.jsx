
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  Search,
  Bookmark,
  Building2,
  FileText,
  Sparkles,
  CheckCircle2,
  X,
  Clock,
  Phone,
  MapPin,
  Compass,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  LoaderCircle,
  ImageOff,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../admin/services/api";
import "../styles/Library.css";

/* ==========================================================
   CACHE CONFIGURATION
========================================================== */

const LIBRARY_CACHE_KEY = "dream_land_public_library_cache";

/* ==========================================================
   HELPERS
========================================================== */

const normalizeResponse = (response) =>
  response?.data ?? response ?? {};

const normalizeArray = (value) =>
  Array.isArray(value) ? value : [];

/*
  Read previously saved library information.
  This allows the page to display content immediately,
  even when the backend is unavailable.
*/

const readLibraryCache = () => {
  try {
    const cached = localStorage.getItem(LIBRARY_CACHE_KEY);

    if (!cached) {
      return {
        branches: [],
        books: [],
      };
    }

    const parsed = JSON.parse(cached);

    return {
      branches: Array.isArray(parsed.branches)
        ? parsed.branches
        : [],

      books: Array.isArray(parsed.books)
        ? parsed.books
        : [],
    };
  } catch (error) {
    console.warn("Unable to read library cache:", error);

    return {
      branches: [],
      books: [],
    };
  }
};

/*
  Save successful library information.
  Never overwrite the cache with failed or empty responses.
*/

const saveLibraryCache = (branches, books) => {
  try {
    if (
      !Array.isArray(branches) ||
      !Array.isArray(books)
    ) {
      return;
    }

    localStorage.setItem(
      LIBRARY_CACHE_KEY,
      JSON.stringify({
        branches,
        books,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.warn("Unable to save library cache:", error);
  }
};

const normalizeAmenities = (amenities) => {
  if (Array.isArray(amenities)) {
    return amenities;
  }

  if (typeof amenities === "string") {
    try {
      const parsed = JSON.parse(amenities);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const formatOpeningHours = (hours) => {
  if (!hours) {
    return "Contact the library for opening hours.";
  }

  if (typeof hours === "string") {
    try {
      const parsed = JSON.parse(hours);

      if (parsed && typeof parsed === "object") {
        return formatOpeningHours(parsed);
      }
    } catch {
      return hours;
    }

    return hours;
  }

  if (typeof hours !== "object") {
    return "Contact the library for opening hours.";
  }

  if (hours.open || hours.close) {
    return `${hours.open || ""} - ${hours.close || ""}`;
  }

  return (
    Object.entries(hours)
      .map(([day, time]) => {
        const formattedDay =
          day.charAt(0).toUpperCase() + day.slice(1);

        if (!time) return null;

        if (typeof time === "string") {
          return `${formattedDay}: ${time}`;
        }

        if (typeof time === "object") {
          if (time.closed) {
            return `${formattedDay}: Closed`;
          }

          if (time.open && time.close) {
            return `${formattedDay}: ${time.open} - ${time.close}`;
          }
        }

        return null;
      })
      .filter(Boolean)
      .join(" | ") ||
    "Contact the library for opening hours."
  );
};

const getVolumeNumber = (value) => {
  const number = Number(
    String(value || "").replace(/[^0-9]/g, "")
  );

  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (number) =>
  new Intl.NumberFormat("en-US").format(number);

const normalizeStatus = (status) =>
  String(status || "").trim().toLowerCase();

const getBookStatusClass = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "available") return "available";
  if (normalized === "reserved") return "reserved";

  return "checked-out";
};

const isBookAvailable = (book) =>
  normalizeStatus(book?.status) === "available";

const getBranchImage = (branch) =>
  branch?.image_url ||
  branch?.image ||
  branch?.image_path ||
  "";

const normalizeBook = (book, branchMap) => {
  const branch =
    branchMap.get(String(book.branch_id)) ||
    book.branch ||
    null;

  return {
    ...book,

    campus:
      branch?.name ||
      book.branch_name ||
      book.campus ||
      "Library Branch",

    branchName:
      branch?.name ||
      book.branch_name ||
      "Library Branch",

    branchCampus: branch?.campus || "",
    branchSlug: branch?.slug || "",

    format: book.format || "Not specified",
    category: book.category || "General",
    status: book.status || "Unavailable",
    isbn: book.isbn || "Not available",
    description: book.description || "",
  };
};

/*
  Never display raw database, Supabase, SQL, or RLS errors
  to public visitors.
*/

const getFriendlyErrorMessage = (error) => {
  const status = error?.response?.status;

  if (status === 404) {
    return "Library information is temporarily unavailable. Please try again later.";
  }

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (status >= 500) {
    return "Our library service is temporarily unavailable. Please try again shortly.";
  }

  if (
    error?.code === "ECONNABORTED" ||
    error?.name === "AbortError"
  ) {
    return "The request took too long. Please check your connection and try again.";
  }

  return "We couldn't load the library information. Please check your connection and try again.";
};

const getFriendlyReservationError = (error) => {
  const status = error?.response?.status;

  if (status === 409) {
    return "This book may have just been reserved by another student. Please refresh the library catalog and check its availability.";
  }

  if (status === 400 || status === 422) {
    return "We couldn't process your reservation details. Please check your Student ID and try again.";
  }

  if (status === 429) {
    return "Too many reservation attempts. Please wait a moment before trying again.";
  }

  if (status >= 500) {
    return "Our reservation service is temporarily unavailable. Your request was not confirmed. Please try again later.";
  }

  return "We couldn't submit your reservation. Please check your connection and try again.";
};

/* ==========================================================
   LIBRARY IMAGE COMPONENT
========================================================== */

function LibraryBranchImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <>
      {src && !failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}

      {(!src || failed) && (
        <div className="dl-library-image-placeholder">
          <ImageOff size={36} />
          <span>Library Image</span>
        </div>
      )}
    </>
  );
}

/* ==========================================================
   LIBRARY PAGE
========================================================== */

function Library() {
  /* ========================================================
     INITIAL CACHED DATA
  ======================================================== */

  const [initialCache] = useState(() => readLibraryCache());

  const [branches, setBranches] = useState(
    initialCache.branches
  );

  const [books, setBooks] = useState(
    initialCache.books
  );

  const [loading, setLoading] = useState(
    initialCache.branches.length === 0 &&
      initialCache.books.length === 0
  );

  const [error, setError] = useState("");

  /* ========================================================
     FILTERS
  ======================================================== */

  const [selectedBranch, setSelectedBranch] =
    useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  /* ========================================================
     MODALS
  ======================================================== */

  const [activeBookModal, setActiveBookModal] =
    useState(null);

  const [activeBranchModal, setActiveBranchModal] =
    useState(null);

  /* ========================================================
     RESERVATIONS
  ======================================================== */

  const [studentId, setStudentId] = useState("");

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [bookingError, setBookingError] = useState("");

  const [bookingSuccess, setBookingSuccess] =
    useState(false);

  /* ========================================================
     BOOKMARKS
  ======================================================== */

  const [savedBooks, setSavedBooks] = useState([]);

  /* ========================================================
     LOAD LIBRARY DATA
     GET /api/library/active

     Online:
       Fetch latest branches and books.
       Update page and cache.

     Offline:
       Keep previously saved branches and books.
       Never clear existing data.
  ======================================================== */

  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/library/active", {
        timeout: 15000,
      });

      const result = normalizeResponse(response);

      if (result.success === false) {
        throw new Error("Library information unavailable.");
      }

      const branchData = normalizeArray(result.branches);
      const bookData = normalizeArray(result.books);

      /*
        Update displayed information.
      */

      setBranches(branchData);
      setBooks(bookData);

      /*
        Save only successful responses.
      */

      saveLibraryCache(branchData, bookData);

      setError("");
    } catch (err) {
      console.error("Library loading error:", err);

      /*
        Recover cached information.
      */

      const cached = readLibraryCache();

      setBranches((previous) =>
        previous.length > 0
          ? previous
          : cached.branches
      );

      setBooks((previous) =>
        previous.length > 0
          ? previous
          : cached.books
      );

      /*
        Do not show an error message if cached content exists.
      */

      if (
        cached.branches.length === 0 &&
        cached.books.length === 0
      ) {
        setError(getFriendlyErrorMessage(err));
      } else {
        setError("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  /* ========================================================
     AUTOMATIC RECONNECTION

     Refresh when the browser comes back online.
  ======================================================== */

  useEffect(() => {
    const handleOnline = () => {
      loadLibrary();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [loadLibrary]);

  /* ========================================================
     BRANCH LOOKUP
  ======================================================== */

  const branchMap = useMemo(() => {
    return new Map(
      branches.map((branch) => [
        String(branch.id),
        branch,
      ])
    );
  }, [branches]);

  /* ========================================================
     BOOK DATA WITH BRANCH INFORMATION
  ======================================================== */

  const catalogItems = useMemo(() => {
    return books.map((book) =>
      normalizeBook(book, branchMap)
    );
  }, [books, branchMap]);

  /* ========================================================
     FILTER BOOKS
  ======================================================== */

  const filteredCatalog = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return catalogItems.filter((book) => {
      const matchesBranch =
        selectedBranch === "all" ||
        String(book.branch_id) === String(selectedBranch);

      const searchableValues = [
        book.title,
        book.category,
        book.description,
        book.isbn,
        book.campus,
        book.format,
        book.status,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      return matchesBranch && matchesSearch;
    });
  }, [catalogItems, selectedBranch, searchQuery]);

  /* ========================================================
     BRANCH STATISTICS
  ======================================================== */

  const totalVolumes = useMemo(() => {
    return branches.reduce(
      (total, branch) =>
        total + getVolumeNumber(branch.book_count),
      0
    );
  }, [branches]);

  const totalPublishedBooks = catalogItems.length;

  const totalAvailableBooks = useMemo(
    () => catalogItems.filter(isBookAvailable).length,
    [catalogItems]
  );

  /* ========================================================
     RESET BOOK MODAL
  ======================================================== */

  const closeBookModal = () => {
    if (bookingLoading) return;

    setActiveBookModal(null);
    setStudentId("");
    setBookingError("");
    setBookingSuccess(false);
  };

  /* ========================================================
     SUBMIT BOOK RESERVATION
     POST /api/library/reservations
  ======================================================== */

  const handleReserveBook = async (e) => {
    e.preventDefault();

    if (!activeBookModal) return;

    const trimmedStudentId = studentId.trim();

    if (!trimmedStudentId) {
      setBookingError("Please enter your Student ID.");
      return;
    }

    if (!isBookAvailable(activeBookModal)) {
      setBookingError(
        "This book is currently unavailable for reservation."
      );
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      const response = await api.post(
        "/library/reservations",
        {
          book_id: activeBookModal.id,
          student_id: trimmedStudentId,
        },
        {
          timeout: 15000,
        }
      );

      const result = normalizeResponse(response);

      if (result.success === false) {
        throw new Error("Reservation could not be submitted.");
      }

      setBookingSuccess(true);
    } catch (err) {
      console.error("Library reservation error:", err);

      setBookingError(
        getFriendlyReservationError(err)
      );
    } finally {
      setBookingLoading(false);
    }
  };

  /* ========================================================
     BOOKMARKS
  ======================================================== */

  const toggleBookmark = (bookId, e) => {
    e.stopPropagation();

    setSavedBooks((previous) =>
      previous.includes(bookId)
        ? previous.filter((id) => id !== bookId)
        : [...previous, bookId]
    );
  };

  /* ========================================================
     BRANCH FILTER
  ======================================================== */

  const handleBranchCardClick = (branchId) => {
    setSelectedBranch(String(branchId));

    document
      .getElementById("dl-catalog-section-anchor")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const handleHoursInfoClick = (e, branch) => {
    e.stopPropagation();

    setActiveBranchModal({
      ...branch,
      hours: formatOpeningHours(branch.opening_hours),
      amenities: normalizeAmenities(branch.amenities),
    });
  };

  /* ========================================================
     LOADING STATE
  ======================================================== */

  const renderLoadingState = () => (
    <div
      className="dl-library-state dl-library-loading"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        size={38}
        className="dl-library-spinner"
      />

      <h3>Loading library information</h3>

      <p>
        Please wait while we load library branches and catalog
        materials.
      </p>
    </div>
  );

  /* ========================================================
     FRIENDLY ERROR STATE
  ======================================================== */

  const renderErrorState = () => (
    <div
      className="dl-library-state dl-library-error"
      role="alert"
    >
      <div className="dl-library-state-icon">
        <AlertCircle size={34} />
      </div>

      <h3>Library Information Temporarily Unavailable</h3>

      <p>
        {error ||
          "We're having trouble loading the library information. Please try again shortly."}
      </p>

      <button
        type="button"
        className="dl-btn dl-btn-primary"
        onClick={loadLibrary}
        disabled={loading}
      >
        {loading ? (
          <LoaderCircle
            size={15}
            className="dl-library-spinner"
          />
        ) : (
          <RefreshCw size={15} />
        )}

        {loading ? "Loading..." : "Try Again"}
      </button>
    </div>
  );

  /* ========================================================
     EMPTY BRANCH STATE
  ======================================================== */

  const renderEmptyBranches = () => (
    <div className="dl-library-state dl-library-empty-state">
      <Building2 size={38} />

      <h3>No Library Branches Available</h3>

      <p>
        Library branch information will appear here once it has
        been published.
      </p>
    </div>
  );

  /* ========================================================
     EMPTY CATALOG STATE
  ======================================================== */

  const renderEmptyCatalog = () => (
    <div className="dl-lib-empty dl-fade-in">
      <Search size={36} />

      <h3>No Library Materials Found</h3>

      <p>
        No books match your current branch filter and search
        combination.
      </p>

      <button
        type="button"
        className="dl-btn dl-btn-sm dl-btn-primary"
        onClick={() => {
          setSelectedBranch("all");
          setSearchQuery("");
        }}
      >
        Reset All Filters
      </button>
    </div>
  );

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* ==================================================
            HERO SECTION
        ================================================== */}

        <section className="dl-page-hero dl-library-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                Institutional Knowledge Hub
              </span>

              {savedBooks.length > 0 && (
                <span className="dl-hero-saved-pill">
                  <Bookmark size={13} />

                  {savedBooks.length} Saved in Reading List
                </span>
              )}
            </div>

            <h1>Dream Land College Libraries</h1>

            <p>
              Explore our comprehensive physical book collections,
              digital research archives, study spaces, and academic
              journals across all regional campus branches.
            </p>

            <div className="dl-hero-stats-grid">
              <div className="dl-stat-pill">
                <BookOpen size={18} />

                <div>
                  <strong>
                    {loading && !branches.length && !books.length
                      ? "..."
                      : `${formatNumber(totalVolumes)}+`}
                  </strong>

                  <span>Total Volumes</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Building2 size={18} />

                <div>
                  <strong>
                    {loading && !branches.length
                      ? "..."
                      : `${branches.length} Campuses`}
                  </strong>

                  <span>Connected Branches</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Sparkles size={18} />

                <div>
                  <strong>
                    {loading && !books.length
                      ? "..."
                      : formatNumber(totalPublishedBooks)}
                  </strong>

                  <span>Catalog Materials</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            BRANCHES SECTION
        ================================================== */}

        <section className="dl-library-branches-section">
          <div className="dl-shell">
            <div className="dl-section-heading">
              <span className="dl-section-badge">
                <Building2 size={14} />
                Campus Facilities & Filtering
              </span>

              <h2>Explore Our Regional Library Branches</h2>

              <p>
                Click any campus card below to filter catalog
                books or view operating schedules.
              </p>
            </div>

            {loading &&
            branches.length === 0 &&
            books.length === 0 ? (
              renderLoadingState()
            ) : error &&
              branches.length === 0 &&
              books.length === 0 ? (
              renderErrorState()
            ) : branches.length === 0 ? (
              renderEmptyBranches()
            ) : (
              <div className="dl-branches-grid">
                {branches.map((lib) => {
                  const isSelected =
                    String(selectedBranch) === String(lib.id);

                  const imageUrl = getBranchImage(lib);

                  return (
                    <div
                      key={lib.id}
                      className={`dl-branch-card ${
                        isSelected
                          ? "dl-branch-card-active"
                          : ""
                      }`}
                      onClick={() =>
                        handleBranchCardClick(lib.id)
                      }
                    >
                      <div className="dl-branch-img">
                        <LibraryBranchImage
                          src={imageUrl}
                          alt={lib.name || "Library branch"}
                        />

                        {lib.book_count && (
                          <span className="dl-branch-badge-vol">
                            {formatNumber(
                              getVolumeNumber(lib.book_count)
                            )}{" "}
                            Volumes
                          </span>
                        )}

                        {isSelected && (
                          <span className="dl-branch-active-indicator">
                            <CheckCircle2 size={14} />
                            Active Filter
                          </span>
                        )}
                      </div>

                      <div className="dl-branch-body">
                        <h3>{lib.name}</h3>

                        <p className="dl-branch-loc">
                          <MapPin size={13} />

                          {lib.location || lib.campus}
                        </p>

                        <p>{lib.description}</p>

                        <div className="dl-branch-card-actions">
                          <button
                            type="button"
                            className="dl-btn dl-btn-sm dl-btn-outline"
                            onClick={(e) =>
                              handleHoursInfoClick(e, lib)
                            }
                          >
                            <Clock size={13} />
                            Hours & Info
                          </button>

                          <button
                            type="button"
                            className="dl-btn dl-btn-sm dl-btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();

                              handleBranchCardClick(lib.id);
                            }}
                          >
                            <Compass size={13} />
                            Filter Books
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            CATALOG SECTION
        ================================================== */}

        <section
          id="dl-catalog-section-anchor"
          className="dl-library-catalog-section"
        >
          <div className="dl-shell">
            <div className="dl-section-heading">
              <span className="dl-section-badge">
                <BookOpen size={14} />
                Catalog Search & Filtering
              </span>

              <h2>Search Books & Digital Journals</h2>

              <p>
                Find available textbooks, reference guides, and
                course materials across our branches.
              </p>
            </div>

            {/* BRANCH FILTER TABS */}

            <div className="dl-lib-tabs">
              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedBranch === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedBranch("all")}
              >
                All Branches ({catalogItems.length})
              </button>

              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  className={`dl-lib-tab ${
                    String(selectedBranch) === String(branch.id)
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedBranch(String(branch.id))
                  }
                >
                  {branch.name}
                </button>
              ))}
            </div>

            {/* SEARCH */}

            <div className="dl-lib-search">
              <Search size={18} />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search by book title, subject category, ISBN, or keywords..."
                aria-label="Search library books"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="dl-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </button>
              )}
            </div>

            {/* CATALOG CONTENT */}

            {loading &&
            catalogItems.length === 0 &&
            branches.length === 0 ? (
              renderLoadingState()
            ) : error && catalogItems.length === 0 ? (
              renderErrorState()
            ) : (
              <div className="dl-catalog-grid">
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map((book) => {
                    const isBookSaved = savedBooks.includes(
                      book.id
                    );

                    return (
                      <div
                        key={book.id}
                        className="dl-catalog-card"
                      >
                        <div className="dl-catalog-top">
                          <span className="dl-catalog-cat">
                            {book.category}
                          </span>

                          <div className="dl-catalog-top-right">
                            <span
                              className={`dl-catalog-status ${getBookStatusClass(
                                book.status
                              )}`}
                            >
                              {book.status}
                            </span>

                            <button
                              type="button"
                              className={`dl-bookmark-btn ${
                                isBookSaved ? "saved" : ""
                              }`}
                              onClick={(e) =>
                                toggleBookmark(book.id, e)
                              }
                              title={
                                isBookSaved
                                  ? "Remove from reading list"
                                  : "Save to reading list"
                              }
                              aria-label={
                                isBookSaved
                                  ? "Remove from reading list"
                                  : "Save to reading list"
                              }
                            >
                              <Bookmark
                                size={15}
                                fill={
                                  isBookSaved
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                        </div>

                        <h3>{book.title}</h3>

                        <p className="dl-catalog-desc">
                          {book.description}
                        </p>

                        <div className="dl-catalog-meta">
                          <span>
                            <Building2 size={13} />
                            {book.campus}
                          </span>

                          <span>
                            <FileText size={13} />
                            {book.format}
                          </span>
                        </div>

                        <div className="dl-catalog-footer">
                          <span className="dl-catalog-isbn">
                            ISBN: {book.isbn}
                          </span>

                          <button
                            type="button"
                            className="dl-btn dl-btn-sm dl-btn-primary"
                            onClick={() => {
                              setActiveBookModal(book);
                              setBookingError("");
                              setBookingSuccess(false);
                              setStudentId("");
                            }}
                          >
                            <Bookmark size={14} />
                            Reserve / View
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  renderEmptyCatalog()
                )}
              </div>
            )}

            {/* AVAILABILITY SUMMARY */}

            {catalogItems.length > 0 && (
              <div className="dl-library-availability-summary">
                <span>
                  <CheckCircle2 size={15} />
                  {formatNumber(totalAvailableBooks)} books currently
                  listed as available
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ======================================================
          BOOK RESERVATION MODAL
      ====================================================== */}

      {activeBookModal && (
        <div
          className="dl-modal-overlay"
          onClick={closeBookModal}
        >
          <div
            className="dl-modal-card dl-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dl-book-modal-title"
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={closeBookModal}
              aria-label="Close modal"
              disabled={bookingLoading}
            >
              <X size={20} />
            </button>

            {bookingSuccess ? (
              <div className="dl-modal-success dl-fade-in">
                <CheckCircle2
                  size={60}
                  className="dl-success-icon"
                />

                <h3>Reservation Request Submitted!</h3>

                <p>
                  Your request for{" "}
                  <strong>{activeBookModal.title}</strong> has
                  been submitted successfully. It is now awaiting
                  library staff review.
                </p>

                <p>
                  Your Student ID: <strong>{studentId}</strong>
                </p>

                <button
                  type="button"
                  className="dl-btn dl-btn-primary dl-btn-block"
                  onClick={closeBookModal}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="dl-modal-content-box">
                <span className="dl-modal-badge">
                  {activeBookModal.category}
                </span>

                <h2 id="dl-book-modal-title">
                  {activeBookModal.title}
                </h2>

                <p className="dl-modal-text">
                  {activeBookModal.description}
                </p>

                <div className="dl-modal-details-grid">
                  <div>
                    <strong>Location Branch:</strong>
                    <span>{activeBookModal.campus}</span>
                  </div>

                  <div>
                    <strong>Format Type:</strong>
                    <span>{activeBookModal.format}</span>
                  </div>

                  <div>
                    <strong>Standard ISBN:</strong>
                    <span>{activeBookModal.isbn}</span>
                  </div>

                  <div>
                    <strong>Current Status:</strong>

                    <span
                      className={
                        isBookAvailable(activeBookModal)
                          ? "dl-text-green"
                          : ""
                      }
                    >
                      {activeBookModal.status}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div
                    className="dl-library-inline-error"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle size={17} />
                    <span>{bookingError}</span>
                  </div>
                )}

                {isBookAvailable(activeBookModal) ? (
                  <form
                    onSubmit={handleReserveBook}
                    className="dl-modal-form"
                  >
                    <label>
                      Enter Student ID Number *

                      <input
                        required
                        type="text"
                        value={studentId}
                        onChange={(e) =>
                          setStudentId(e.target.value)
                        }
                        placeholder="e.g., DLC/2049/23"
                        maxLength={100}
                        disabled={bookingLoading}
                      />
                    </label>

                    <button
                      type="submit"
                      className="dl-btn dl-btn-primary dl-btn-block"
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? (
                        <>
                          <LoaderCircle
                            size={17}
                            className="dl-library-spinner"
                          />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <Bookmark size={15} />
                          Confirm Reservation Request
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="dl-library-unavailable">
                    <AlertCircle size={18} />

                    This book is currently unavailable for
                    reservation.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================
          BRANCH INFORMATION MODAL
      ====================================================== */}

      {activeBranchModal && (
        <div
          className="dl-modal-overlay"
          onClick={() => setActiveBranchModal(null)}
        >
          <div
            className="dl-modal-card dl-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dl-branch-modal-title"
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={() => setActiveBranchModal(null)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="dl-modal-content-box">
              <span className="dl-modal-badge">
                Branch Information
              </span>

              <h2 id="dl-branch-modal-title">
                {activeBranchModal.name}
              </h2>

              <p className="dl-modal-text">
                {activeBranchModal.description}
              </p>

              <div className="dl-branch-info-list">
                <div className="dl-branch-info-row">
                  <MapPin size={16} />

                  <span>
                    {activeBranchModal.location ||
                      activeBranchModal.campus ||
                      "Location not provided"}
                  </span>
                </div>

                <div className="dl-branch-info-row">
                  <Clock size={16} />

                  <span>
                    {formatOpeningHours(
                      activeBranchModal.opening_hours
                    )}
                  </span>
                </div>

                <div className="dl-branch-info-row">
                  <Phone size={16} />

                  <span>
                    {activeBranchModal.phone ||
                      "Not provided"}
                  </span>
                </div>
              </div>

              {normalizeAmenities(
                activeBranchModal.amenities
              ).length > 0 && (
                <div className="dl-branch-amenities-box">
                  <strong>
                    Campus Amenities & Facilities:
                  </strong>

                  <ul>
                    {normalizeAmenities(
                      activeBranchModal.amenities
                    ).map((amenity, idx) => (
                      <li key={`${amenity}-${idx}`}>
                        <CheckCircle2
                          size={13}
                          className="dl-text-green"
                        />

                        {amenity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                className="dl-btn dl-btn-primary dl-btn-block"
                onClick={() => {
                  handleBranchCardClick(
                    activeBranchModal.id
                  );

                  setActiveBranchModal(null);
                }}
              >
                Filter Books for this Branch Now
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Library;
