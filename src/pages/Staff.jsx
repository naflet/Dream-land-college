
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Mail,
  Calendar,
  Building2,
  Award,
  BookOpen,
  CheckCircle2,
  X,
  Clock,
  Bookmark,
  Sparkles,
  UserCheck,
  PhoneCall,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
  Image as ImageIcon,
  WifiOff,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../admin/services/api";
import "../styles/Staff.css";

/* ==========================================================
   CONFIGURATION
========================================================== */

const STAFF_CACHE_KEY = "dream_land_public_staff_cache";

const getErrorStatus = (error) =>
  error?.response?.status ||
  error?.status ||
  error?.statusCode ||
  0;

/* ==========================================================
   ERROR HELPERS
========================================================== */

const getStaffErrorMessage = (error) => {
  const status = getErrorStatus(error);

  if (!navigator.onLine) {
    return "You appear to be offline. Check your internet connection and try again.";
  }

  if (status === 404) {
    return "The staff directory is temporarily unavailable.";
  }

  if (status >= 500) {
    return "Our server is temporarily unavailable. Please try again shortly.";
  }

  return "We couldn't load the staff directory. Please try again.";
};

const getConsultErrorMessage = (error) => {
  const status = getErrorStatus(error);
  const message = String(error?.message || "").toLowerCase();

  if (
    !navigator.onLine ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return "Connection unavailable. Please check your internet connection and try again.";
  }

  if (status === 400 || status === 422) {
    return "Some information is missing or invalid. Please review your form.";
  }

  if (status === 404) {
    return "The consultation service is currently unavailable.";
  }

  if (status === 409) {
    return "This consultation request may already exist. Please review your details.";
  }

  if (status >= 500) {
    return "We couldn't process your request right now. Please try again later.";
  }

  return "Unable to submit your consultation request. Please try again.";
};

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const normalizeResponse = (response) =>
  response?.data ?? response ?? {};

const getStaffRecords = (response) => {
  const result = normalizeResponse(response);

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.staff)) {
    return result.staff;
  }

  if (Array.isArray(result.data?.staff)) {
    return result.data.staff;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return null;
};

/* ==========================================================
   LOCAL STORAGE CACHE
========================================================== */

const readStaffCache = () => {
  try {
    const cached = localStorage.getItem(STAFF_CACHE_KEY);

    if (!cached) return [];

    const parsed = JSON.parse(cached);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.warn("Unable to read saved staff directory:", error);
    return [];
  }
};

const saveStaffCache = (staff) => {
  try {
    localStorage.setItem(
      STAFF_CACHE_KEY,
      JSON.stringify(staff)
    );
  } catch (error) {
    console.warn("Unable to save staff directory:", error);
  }
};

/* ==========================================================
   NORMALIZE STAFF
========================================================== */

const normalizeStaff = (staff) => ({
  id: staff.id,

  name:
    staff.full_name ||
    staff.name ||
    "Staff Member",

  title:
    staff.position ||
    staff.title ||
    "College Staff",

  department:
    staff.department ||
    "General",

  email:
    staff.email ||
    "",

  office:
    staff.office ||
    staff.campus?.name ||
    "Office information unavailable",

  hours:
    staff.office_hours ||
    staff.hours ||
    "Please contact the staff member",

  phone:
    staff.phone ||
    "",

  bio:
    staff.bio ||
    "Biography information is not available.",

  research: Array.isArray(staff.research)
    ? staff.research
    : [],

  image:
    staff.image_url ||
    staff.image ||
    staff.image_path ||
    "",
});

const getLocalDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* ==========================================================
   STAFF IMAGE
========================================================== */

function StaffImage({ src, name }) {
  const [imageFailed, setImageFailed] = useState(!src);

  useEffect(() => {
    setImageFailed(!src);
  }, [src]);

  if (imageFailed) {
    return (
      <div
        className="dl-staff-image-fallback"
        role="img"
        aria-label={`Image unavailable for ${name}`}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "190px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "8px",
          background: "#edf3f6",
          color: "#64748b",
        }}
      >
        <ImageIcon size={36} />
        <span style={{ fontSize: "12px" }}>
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

/* ==========================================================
   MAIN COMPONENT
========================================================== */

function Staff() {
  const [staffMembers, setStaffMembers] = useState(
    () => readStaffCache().map(normalizeStaff)
  );

  const [staffLoading, setStaffLoading] = useState(
    () => readStaffCache().length === 0
  );

  const [staffError, setStaffError] = useState("");
  const [isOffline, setIsOffline] = useState(
    () => !navigator.onLine
  );

  const [selectedDepartment, setSelectedDepartment] =
    useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [activeBioModal, setActiveBioModal] = useState(null);
  const [activeConsultModal, setActiveConsultModal] = useState(null);

  const [consultSuccess, setConsultSuccess] = useState(false);
  const [savedStaff, setSavedStaff] = useState([]);

  const [consultForm, setConsultForm] = useState({
    student_name: "",
    student_id: "",
    preferred_date: "",
    purpose: "",
  });

  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState("");

  const hasStaff = staffMembers.length > 0;

  /* ========================================================
     LOAD STAFF FROM BACKEND

     GET /api/staff/active

     Offline:
     - Keep cached staff.
     - Do not clear the directory.
     - Show a friendly error only if no cache exists.
  ======================================================== */

  const fetchStaff = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOffline(true);

      if (!hasStaff) {
        setStaffError(
          "You are currently offline and no saved staff directory is available. Connect to the internet and try again."
        );
      }

      setStaffLoading(false);
      return;
    }

    setStaffLoading(!hasStaff);
    setStaffError("");

    try {
      const response = await api.get("/staff/active");

      const result = normalizeResponse(response);

      if (result.success === false) {
        throw new Error(
          result.message || "Unable to load staff."
        );
      }

      const records = getStaffRecords(response);

      if (!Array.isArray(records)) {
        throw new Error("Invalid staff directory response.");
      }

      const normalizedStaff = records
        .map(normalizeStaff)
        .filter((staff) => staff.id);

      setStaffMembers(normalizedStaff);

      saveStaffCache(normalizedStaff);

      setStaffError("");
      setIsOffline(false);

      setSavedStaff((previous) =>
        previous.filter((id) =>
          normalizedStaff.some(
            (staff) => String(staff.id) === String(id)
          )
        )
      );
    } catch (error) {
      console.error("Staff directory loading error:", error);

      setIsOffline(
        !navigator.onLine ||
        String(error?.message || "")
          .toLowerCase()
          .includes("network")
      );

      // Keep existing staff profiles when the backend fails.
      if (!hasStaff) {
        setStaffError(getStaffErrorMessage(error));
      } else {
        setStaffError("");
      }
    } finally {
      setStaffLoading(false);
    }
  }, [hasStaff]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  /* ========================================================
     AUTOMATIC RECONNECTION
  ======================================================== */

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchStaff();
    };

    const handleOffline = () => {
      setIsOffline(true);

      if (!hasStaff) {
        setStaffError(
          "You are offline. Connect to the internet to load the staff directory."
        );
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchStaff, hasStaff]);

  /* ========================================================
     DEPARTMENT FILTERS
  ======================================================== */

  const departments = [
    "Executive Board",
    "Computer Science",
    "Health Sciences",
    "Business & Economics",
    "Engineering",
  ];

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return staffMembers.filter((staff) => {
      const matchesDept =
        selectedDepartment === "all" ||
        staff.department.toLowerCase() ===
          selectedDepartment.toLowerCase();

      const searchableValues = [
        staff.name,
        staff.title,
        staff.office,
        staff.department,
        staff.bio,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      return matchesDept && matchesSearch;
    });
  }, [staffMembers, selectedDepartment, searchQuery]);

  /* ========================================================
     CONSULTATION MODAL
  ======================================================== */

  const openConsultModal = (staff) => {
    setConsultForm({
      student_name: "",
      student_id: "",
      preferred_date: "",
      purpose: "",
    });

    setConsultError("");
    setConsultSuccess(false);
    setActiveConsultModal(staff);
  };

  const closeConsultModal = () => {
    if (consultLoading) return;

    setActiveConsultModal(null);
    setConsultError("");
    setConsultSuccess(false);
  };

  /* ========================================================
     SUBMIT CONSULTATION

     POST /api/consultations/submit

     This action requires a live backend connection.
  ======================================================== */

  const handleConsultSubmit = async (e) => {
    e.preventDefault();

    if (!activeConsultModal || consultLoading) return;

    if (!navigator.onLine) {
      setConsultError(
        "You are offline. Your consultation request has not been submitted. Please reconnect and try again."
      );
      return;
    }

    if (!activeConsultModal.id) {
      setConsultError(
        "This staff profile does not have a valid record. Please refresh the directory."
      );
      return;
    }

    const studentName = consultForm.student_name.trim();
    const studentId = consultForm.student_id.trim();
    const purpose = consultForm.purpose.trim();

    if (studentName.length < 2) {
      setConsultError("Please enter your full name.");
      return;
    }

    if (!consultForm.preferred_date) {
      setConsultError("Please select your preferred date.");
      return;
    }

    if (purpose.length < 5) {
      setConsultError(
        "Please describe the purpose of your meeting in at least 5 characters."
      );
      return;
    }

    setConsultLoading(true);
    setConsultError("");

    try {
      const payload = {
        staff_id: activeConsultModal.id,
        student_name: studentName,
        student_id: studentId || null,
        preferred_date: consultForm.preferred_date,
        purpose,
      };

      const response = await api.post(
        "/consultations/submit",
        payload
      );

      const result = normalizeResponse(response);

      if (result.success === false) {
        throw new Error(
          result.message || "Consultation submission failed."
        );
      }

      setConsultSuccess(true);

      setConsultForm({
        student_name: "",
        student_id: "",
        preferred_date: "",
        purpose: "",
      });
    } catch (error) {
      console.error("Consultation submission error:", error);

      setConsultError(getConsultErrorMessage(error));
    } finally {
      setConsultLoading(false);
    }
  };

  /* ========================================================
     BOOKMARKS
  ======================================================== */

  const toggleBookmark = (staffId, e) => {
    e.stopPropagation();

    setSavedStaff((previous) =>
      previous.includes(staffId)
        ? previous.filter((id) => id !== staffId)
        : [...previous, staffId]
    );
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}

        <section className="dl-page-hero dl-staff-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                Faculty & Leadership Directory
              </span>

              {savedStaff.length > 0 && (
                <span className="dl-hero-saved-pill">
                  <Bookmark size={13} />
                  {savedStaff.length} Bookmarked Advisors
                </span>
              )}
            </div>

            <h1>Meet Our Distinguished Faculty & Staff</h1>

            <p>
              Dedicated educators, experienced researchers, and
              administrative leaders committed to guiding your
              academic journey at Dream Land College.
            </p>

            <div className="dl-hero-stats-grid">
              <div className="dl-stat-pill">
                <UserCheck size={18} />

                <div>
                  <strong>
                    {staffLoading && !hasStaff
                      ? "..."
                      : `${staffMembers.length}+`}
                  </strong>
                  <span>Published Staff Profiles</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Building2 size={18} />

                <div>
                  <strong>6 Faculties</strong>
                  <span>Academic Departments</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Sparkles size={18} />

                <div>
                  <strong>100%</strong>
                  <span>Student Mentorship</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIRECTORY SECTION */}

        <section className="dl-staff-directory-section">
          <div className="dl-shell">
            <div className="dl-section-heading">
              <span className="dl-section-badge">
                <Award size={14} />
                Academic Directory
              </span>

              <h2>Browse Faculty & Staff Members</h2>

              <p>
                Filter by department or search by name to book
                consultations or view office hours.
              </p>
            </div>

            {/* OFFLINE INDICATOR */}

            {isOffline && hasStaff && (
              <div
                className="dl-staff-offline-indicator"
                role="status"
              >
                <WifiOff size={15} />
                <span>
                  Showing saved staff profiles. Some information
                  may not reflect the latest updates.
                </span>
              </div>
            )}

            {/* DEPARTMENT FILTERS */}

            <div className="dl-lib-tabs">
              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedDepartment === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedDepartment("all")}
              >
                All Departments ({staffMembers.length})
              </button>

              {departments.map((department) => (
                <button
                  key={department}
                  type="button"
                  className={`dl-lib-tab ${
                    selectedDepartment === department ? "active" : ""
                  }`}
                  onClick={() =>
                    setSelectedDepartment(department)
                  }
                >
                  {department === "Executive Board"
                    ? "Executive & Admin"
                    : department}
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
                placeholder="Search by instructor name, title, department, or office location..."
                aria-label="Search faculty and staff"
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

            {/* LOADING STATE */}

            {staffLoading && !hasStaff && (
              <div
                className="dl-lib-empty dl-fade-in"
                role="status"
                aria-live="polite"
              >
                <LoaderCircle
                  size={38}
                  className="dl-loading-spinner"
                />

                <h3>Loading Faculty & Staff</h3>

                <p>
                  Please wait while we load the staff directory.
                </p>
              </div>
            )}

            {/* ERROR STATE - ONLY WHEN NO CACHE EXISTS */}

            {!staffLoading && staffError && !hasStaff && (
              <div
                className="dl-lib-empty dl-fade-in"
                role="alert"
              >
                <div className="dl-staff-error-icon">
                  <AlertCircle size={36} />
                </div>

                <h3>Staff Directory Unavailable</h3>

                <p>{staffError}</p>

                <button
                  type="button"
                  className="dl-btn dl-btn-primary dl-btn-sm"
                  onClick={fetchStaff}
                  disabled={staffLoading}
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            )}

            {/* EMPTY DIRECTORY */}

            {!staffLoading &&
              !staffError &&
              staffMembers.length === 0 && (
                <div className="dl-lib-empty dl-fade-in">
                  <UserCheck size={42} />

                  <h3>No Staff Profiles Available</h3>

                  <p>
                    There are currently no published staff profiles.
                    Please check again later.
                  </p>

                  <button
                    type="button"
                    className="dl-btn dl-btn-outline dl-btn-sm"
                    onClick={fetchStaff}
                  >
                    <RefreshCw size={15} />
                    Refresh Directory
                  </button>
                </div>
              )}

            {/* STAFF GRID */}

            {hasStaff && (
              <div className="dl-staff-grid">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => {
                    const isSaved = savedStaff.includes(staff.id);

                    return (
                      <div
                        key={staff.id}
                        className="dl-staff-card"
                      >
                        <div className="dl-staff-img-box">
                          <StaffImage
                            src={staff.image}
                            name={staff.name}
                          />

                          <span className="dl-staff-dept-badge">
                            {staff.department}
                          </span>

                          <button
                            type="button"
                            className={`dl-bookmark-btn dl-staff-bookmark ${
                              isSaved ? "saved" : ""
                            }`}
                            onClick={(e) =>
                              toggleBookmark(staff.id, e)
                            }
                            title={
                              isSaved
                                ? "Remove from bookmarks"
                                : "Bookmark advisor"
                            }
                            aria-label={
                              isSaved
                                ? `Remove ${staff.name} from bookmarks`
                                : `Bookmark ${staff.name}`
                            }
                          >
                            <Bookmark
                              size={15}
                              fill={
                                isSaved ? "currentColor" : "none"
                              }
                            />
                          </button>
                        </div>

                        <div className="dl-staff-body">
                          <h3>{staff.name}</h3>

                          <p className="dl-staff-title">
                            {staff.title}
                          </p>

                          <p className="dl-staff-office">
                            <Building2 size={13} />
                            {staff.office}
                          </p>

                          <p className="dl-staff-hours">
                            <Clock size={13} />
                            {staff.hours}
                          </p>

                          <div className="dl-staff-actions">
                            <button
                              type="button"
                              className="dl-btn dl-btn-sm dl-btn-outline"
                              onClick={() =>
                                setActiveBioModal(staff)
                              }
                            >
                              <BookOpen size={13} />
                              View Bio & Schedule
                            </button>

                            <button
                              type="button"
                              className="dl-btn dl-btn-sm dl-btn-primary"
                              onClick={() =>
                                openConsultModal(staff)
                              }
                            >
                              <Calendar size={13} />
                              Request Consultation
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="dl-lib-empty dl-fade-in">
                    <Search size={36} />

                    <h3>No Staff Members Found</h3>

                    <p>
                      No faculty or staff match your current
                      department filter and search query.
                    </p>

                    <button
                      type="button"
                      className="dl-btn dl-btn-sm dl-btn-primary"
                      onClick={() => {
                        setSelectedDepartment("all");
                        setSearchQuery("");
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* BIO & SCHEDULE MODAL */}

      {activeBioModal && (
        <div
          className="dl-modal-overlay"
          onClick={() => setActiveBioModal(null)}
        >
          <div
            className="dl-modal-card dl-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dl-staff-bio-title"
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={() => setActiveBioModal(null)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="dl-modal-content-box">
              <span className="dl-modal-badge">
                {activeBioModal.department}
              </span>

              <h2 id="dl-staff-bio-title">
                {activeBioModal.name}
              </h2>

              <p className="dl-modal-subtext">
                {activeBioModal.title}
              </p>

              <p className="dl-modal-text">
                {activeBioModal.bio}
              </p>

              <div className="dl-branch-info-list">
                <div className="dl-branch-info-row">
                  <Building2 size={16} />
                  <span>{activeBioModal.office}</span>
                </div>

                <div className="dl-branch-info-row">
                  <Clock size={16} />
                  <span>{activeBioModal.hours}</span>
                </div>

                {activeBioModal.email && (
                  <div className="dl-branch-info-row">
                    <Mail size={16} />
                    <span>{activeBioModal.email}</span>
                  </div>
                )}

                {activeBioModal.phone && (
                  <div className="dl-branch-info-row">
                    <PhoneCall size={16} />
                    <span>{activeBioModal.phone}</span>
                  </div>
                )}
              </div>

              {activeBioModal.research.length > 0 && (
                <div className="dl-branch-amenities-box">
                  <strong>
                    Key Research Interests & Publications:
                  </strong>

                  <ul>
                    {activeBioModal.research.map((item, idx) => (
                      <li key={`${item}-${idx}`}>
                        <CheckCircle2
                          size={13}
                          className="dl-text-green"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                className="dl-btn dl-btn-primary dl-btn-block"
                onClick={() => {
                  const target = activeBioModal;

                  setActiveBioModal(null);
                  openConsultModal(target);
                }}
              >
                Book a Meeting with{" "}
                {activeBioModal.name.split(" ")[1] ||
                  activeBioModal.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONSULTATION REQUEST MODAL */}

      {activeConsultModal && (
        <div
          className="dl-modal-overlay"
          onClick={closeConsultModal}
        >
          <div
            className="dl-modal-card dl-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dl-consult-title"
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={closeConsultModal}
              aria-label="Close modal"
              disabled={consultLoading}
            >
              <X size={20} />
            </button>

            {consultSuccess ? (
              <div className="dl-modal-success dl-fade-in">
                <CheckCircle2
                  size={60}
                  className="dl-success-icon"
                />

                <h3>Consultation Requested!</h3>

                <p>
                  Your meeting request has been successfully
                  submitted. You will receive further information
                  about your consultation.
                </p>

                <button
                  type="button"
                  className="dl-btn dl-btn-primary dl-btn-block"
                  onClick={() => {
                    setConsultSuccess(false);
                    setActiveConsultModal(null);
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="dl-modal-content-box">
                <span className="dl-modal-badge">
                  Consultation Booking
                </span>

                <h2 id="dl-consult-title">
                  Meet with {activeConsultModal.name}
                </h2>

                <p className="dl-modal-text">
                  Office Hours: {activeConsultModal.hours} (
                  {activeConsultModal.office})
                </p>

                {!navigator.onLine && (
                  <div
                    className="dl-staff-form-notice"
                    role="status"
                  >
                    <WifiOff size={16} />
                    You are offline. Reconnect before submitting
                    your consultation request.
                  </div>
                )}

                <form
                  onSubmit={handleConsultSubmit}
                  className="dl-modal-form"
                >
                  <label>
                    Your Full Name *
                    <input
                      required
                      type="text"
                      minLength={2}
                      maxLength={200}
                      value={consultForm.student_name}
                      onChange={(e) =>
                        setConsultForm({
                          ...consultForm,
                          student_name: e.target.value,
                        })
                      }
                      placeholder="Enter your full name"
                      disabled={consultLoading}
                    />
                  </label>

                  <label>
                    Student ID Number
                    <input
                      type="text"
                      maxLength={100}
                      value={consultForm.student_id}
                      onChange={(e) =>
                        setConsultForm({
                          ...consultForm,
                          student_id: e.target.value,
                        })
                      }
                      placeholder="e.g., DLC/2049/23"
                      disabled={consultLoading}
                    />
                  </label>

                  <label>
                    Preferred Date *
                    <input
                      required
                      type="date"
                      min={getLocalDate()}
                      value={consultForm.preferred_date}
                      onChange={(e) =>
                        setConsultForm({
                          ...consultForm,
                          preferred_date: e.target.value,
                        })
                      }
                      disabled={consultLoading}
                    />
                  </label>

                  <label>
                    Meeting Purpose / Question *
                    <textarea
                      required
                      minLength={5}
                      maxLength={5000}
                      rows={3}
                      value={consultForm.purpose}
                      onChange={(e) =>
                        setConsultForm({
                          ...consultForm,
                          purpose: e.target.value,
                        })
                      }
                      placeholder="Briefly describe what you would like to discuss..."
                      disabled={consultLoading}
                      style={{
                        padding: "10px 14px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "10px",
                        font: "inherit",
                        fontSize: "13.5px",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </label>

                  {consultError && (
                    <div
                      className="dl-staff-form-error"
                      role="alert"
                    >
                      <AlertCircle size={17} />
                      <span>{consultError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="dl-btn dl-btn-primary dl-btn-block"
                    disabled={consultLoading || !navigator.onLine}
                  >
                    {consultLoading ? (
                      <>
                        <LoaderCircle
                          size={16}
                          className="dl-loading-spinner"
                        />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <Calendar size={15} />
                        Submit Consultation Request
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Staff;
