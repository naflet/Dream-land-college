
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Send,
  Building,
  Check,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
  Search,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../admin/services/api";
import "../styles/Vacancies.css";

/* ==========================================================
   HELPERS
========================================================== */

const getVacancyErrorMessage = (error) => {
  const message = error?.message?.toLowerCase() || "";

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  if (error?.status >= 500) {
    return "The careers service is temporarily unavailable. Please try again later.";
  }

  return "We couldn't load the available vacancies. Please try again.";
};

const getApplicationErrorMessage = (error) => {
  const message = error?.message?.toLowerCase() || "";

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return "Connection failed. Please check your internet connection and try again.";
  }

  if (error?.status === 400) {
    return "Some application information is invalid. Please review your details.";
  }

  if (error?.status === 404) {
    return "This vacancy is no longer available. Please refresh the vacancy list.";
  }

  if (error?.status >= 500) {
    return "We couldn't process your application right now. Please try again later.";
  }

  return "Unable to submit your application. Please try again.";
};

const formatDeadline = (value) => {
  if (!value) return "Not specified";

  // Handle database DATE values without timezone shifting.
  const dateOnly = String(value).slice(0, 10);
  const parts = dateOnly.split("-");

  if (parts.length === 3 && parts.every(Boolean)) {
    const date = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }

  return value;
};

const normalizeVacancy = (vacancy) => {
  const category =
    vacancy.department ||
    vacancy.category ||
    "Administrative";

  return {
    id: vacancy.id,
    title: vacancy.title || "Untitled Position",
    category,
    campus:
      vacancy.location ||
      vacancy.campus?.name ||
      "Campus not specified",
    type: vacancy.employment_type || "Full-Time",
    deadline: formatDeadline(vacancy.deadline),
    description: vacancy.description || "",
    requirements: Array.isArray(vacancy.requirements)
      ? vacancy.requirements
      : [],
    status: vacancy.status,
  };
};

const getVacancyIcon = (category) => {
  return category?.toLowerCase() === "academic"
    ? GraduationCap
    : BriefcaseBusiness;
};

/* ==========================================================
   MAIN COMPONENT
========================================================== */

function Vacancies() {
  const [vacancyList, setVacancyList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
  });

  /* ==========================================================
     FETCH OPEN VACANCIES
  ========================================================== */

  const fetchVacancies = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get("/vacancies/open");

      if (!response?.success || !Array.isArray(response.vacancies)) {
        throw new Error("Invalid vacancy response.");
      }

      const records = response.vacancies
        .map(normalizeVacancy)
        .filter((vacancy) => vacancy.id);

      setVacancyList(records);
    } catch (error) {
      console.error("Vacancy loading error:", error);
      setLoadError(getVacancyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVacancies();
  }, [fetchVacancies]);

  /* ==========================================================
     FILTER VACANCIES
  ========================================================== */

  const filteredJobs = vacancyList.filter((job) => {
    if (activeFilter === "ALL") return true;

    return (
      job.category.toUpperCase() === activeFilter.toUpperCase()
    );
  });

  /* ==========================================================
     OPEN / CLOSE APPLICATION MODAL
  ========================================================== */

  const openApplicationModal = (job) => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      coverLetter: "",
    });

    setApplicationError("");
    setIsSubmitted(false);
    setSelectedJob(job);
  };

  const closeApplicationModal = () => {
    if (applicationLoading) return;

    setSelectedJob(null);
    setApplicationError("");
    setIsSubmitted(false);
  };

  /* ==========================================================
     SUBMIT JOB APPLICATION
  ========================================================== */

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!selectedJob || applicationLoading) return;

    if (!selectedJob.id) {
      setApplicationError(
        "This vacancy does not have a valid database record. Please refresh the page."
      );
      return;
    }

    setApplicationLoading(true);
    setApplicationError("");

    try {
      const payload = {
        vacancy_id: selectedJob.id,
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        cover_letter: formData.coverLetter.trim(),
      };

      const response = await api.post(
        "/job-applications/submit",
        payload
      );

      if (!response?.success) {
        throw new Error("Application submission failed.");
      }

      setIsSubmitted(true);

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        coverLetter: "",
      });
    } catch (error) {
      console.error("Job application submission error:", error);
      setApplicationError(getApplicationErrorMessage(error));
    } finally {
      setApplicationLoading(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="dl-page-hero dl-vacancies-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                Careers at Dream Land
              </span>
            </div>

            <h1>Grow with a learning community.</h1>

            <p>
              Explore rewarding career opportunities to contribute to
              education, research, and student development across our campuses.
            </p>

            <div
              className="dl-hero-stats-grid"
              style={{ marginTop: "30px" }}
            >
              <div className="dl-stat-pill dl-hover-float">
                <BriefcaseBusiness size={18} />
                <div>
                  <strong>
                    {loading ? "Loading..." : `${vacancyList.length} Open Positions`}
                  </strong>
                  <span>Academic & Administrative</span>
                </div>
              </div>

              <div className="dl-stat-pill dl-hover-float">
                <Building size={18} />
                <div>
                  <strong>3 Campuses</strong>
                  <span>Addis Ababa, Asella, Bale</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT SECTION */}
        <section className="dl-vacancies-content">
          <div className="dl-shell">
            <div
              className="dl-section-head dl-centered-head"
              style={{ marginBottom: "35px" }}
            >
              <span className="dl-section-label">
                Career Opportunities
              </span>

              <h2 className="dl-section-title">
                Join Dream Land College
              </h2>

              <p className="dl-section-description">
                Filter through our current openings below or reach out
                directly to join our dynamic faculty and staff.
              </p>
            </div>

            {/* FILTER TABS */}
            <div
              className="dl-modality-tabs-row"
              style={{
                justifyContent: "center",
                marginBottom: "40px",
              }}
            >
              {["ALL", "ACADEMIC", "ADMINISTRATIVE"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`dl-modality-tab-btn ${
                    activeFilter === tab ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab === "ALL" ? "All Openings" : tab}
                </button>
              ))}
            </div>

            {/* LOADING STATE */}
            {loading && (
              <div
                className="dl-vacancies-state"
                role="status"
                aria-live="polite"
              >
                <LoaderCircle
                  size={40}
                  className="dl-vacancies-spinner"
                />

                <h3>Loading Career Opportunities</h3>

                <p>
                  Please wait while we retrieve available positions.
                </p>
              </div>
            )}

            {/* ERROR STATE */}
            {!loading && loadError && (
              <div className="dl-vacancies-state" role="alert">
                <AlertCircle size={42} />

                <h3>Unable to Load Vacancies</h3>

                <p>{loadError}</p>

                <button
                  type="button"
                  className="dl-btn dl-btn-primary"
                  onClick={fetchVacancies}
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading &&
              !loadError &&
              vacancyList.length === 0 && (
                <div className="dl-vacancies-state">
                  <BriefcaseBusiness size={42} />

                  <h3>No Open Positions Right Now</h3>

                  <p>
                    There are currently no published job openings.
                    Please check again later.
                  </p>

                  <button
                    type="button"
                    className="dl-btn dl-btn-outline"
                    onClick={fetchVacancies}
                  >
                    <RefreshCw size={15} />
                    Refresh Vacancies
                  </button>
                </div>
              )}

            {/* VACANCIES GRID */}
            {!loading &&
              !loadError &&
              vacancyList.length > 0 && (
                <div className="dl-vacancies-grid">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => {
                      const Icon = getVacancyIcon(job.category);

                      return (
                        <article
                          className="dl-vacancy-card dl-hover-lift"
                          key={job.id}
                        >
                          <div className="dl-vacancy-header-row">
                            <div className="dl-vacancy-icon">
                              <Icon size={22} />
                            </div>

                            <span className="dl-vacancy-type-badge">
                              {job.type}
                            </span>
                          </div>

                          <h2>{job.title}</h2>

                          <p className="dl-vacancy-desc">
                            {job.description}
                          </p>

                          <div className="dl-vacancy-meta-list">
                            <div>
                              <MapPin
                                size={14}
                                className="dl-text-green"
                              />
                              <span>{job.campus}</span>
                            </div>

                            <div>
                              <Clock
                                size={14}
                                className="dl-text-green"
                              />
                              <span>
                                Deadline: {job.deadline}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="dl-btn dl-btn-outline"
                            style={{
                              width: "100%",
                              marginTop: "10px",
                            }}
                            onClick={() => openApplicationModal(job)}
                          >
                            View Details & Apply
                            <ArrowRight size={16} />
                          </button>
                        </article>
                      );
                    })
                  ) : (
                    <div className="dl-vacancies-state">
                      <Search size={38} />

                      <h3>No Vacancies in This Category</h3>

                      <p>
                        There are no current openings matching this filter.
                      </p>

                      <button
                        type="button"
                        className="dl-btn dl-btn-outline"
                        onClick={() => setActiveFilter("ALL")}
                      >
                        View All Openings
                      </button>
                    </div>
                  )}
                </div>
              )}
            
            {/* GENERAL INQUIRY BANNER */}
            <div
              className="dl-vacancy-inquiry-box dl-hover-float"
              style={{ marginTop: "60px" }}
            >
              <div>
                <h3>Don't see your exact role?</h3>

                <p>
                  We are always eager to connect with passionate educators
                  and professionals. Send us your CV for future consideration.
                </p>
              </div>

              <Link to="/contact" className="dl-btn dl-btn-primary">
                Send General Application
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* JOB APPLICATION MODAL */}
      {selectedJob && (
        <div
          className="dl-gallery-lightbox dl-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeApplicationModal();
            }
          }}
        >
          <button
            type="button"
            className="dl-lightbox-close"
            onClick={closeApplicationModal}
            disabled={applicationLoading}
            aria-label="Close application form"
          >
            <X size={24} />
          </button>

          <div className="dl-article-modal-box dl-scale-up">
            <div className="dl-article-modal-content">
              {isSubmitted ? (
                <div
                  className="dl-gallery-empty-state dl-fade-in"
                  style={{ padding: "40px 0" }}
                >
                  <div className="dl-success-check-circle">
                    <Check size={32} />
                  </div>

                  <h3>Application Submitted Successfully!</h3>

                  <p>
                    Thank you for applying for the{" "}
                    <strong>{selectedJob.title}</strong> position at
                    Dream Land College. Our HR team will review your
                    credentials and contact you shortly.
                  </p>

                  <button
                    type="button"
                    className="dl-btn dl-btn-primary"
                    onClick={() => setSelectedJob(null)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="dl-vacancy-modal-top">
                    <span className="dl-vacancy-type-badge">
                      {selectedJob.category}
                    </span>

                    <span
                      className="dl-vacancy-type-badge"
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                      }}
                    >
                      {selectedJob.campus}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: "10px 0",
                    }}
                  >
                    {selectedJob.title}
                  </h2>

                  <p
                    className="dl-article-full-text"
                    style={{
                      fontSize: "14px",
                      marginBottom: "16px",
                    }}
                  >
                    {selectedJob.description}
                  </p>

                  <h4
                    style={{
                      fontSize: "13.5px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: "8px",
                    }}
                  >
                    Key Requirements:
                  </h4>

                  <ul className="dl-modal-req-list">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx}>
                        <CheckCircle2
                          size={14}
                          className="dl-text-green"
                        />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>

                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid #f1f5f9",
                      margin: "20px 0",
                    }}
                  />

                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: "#0f172a",
                      marginBottom: "14px",
                    }}
                  >
                    Submit Your Application
                  </h4>

                  <form
                    onSubmit={handleFormSubmit}
                    className="dl-vacancy-form"
                  >
                    <div className="dl-form-group">
                      <label>Full Name</label>

                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={200}
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="dl-form-grid-2">
                      <div className="dl-form-group">
                        <label>Email Address</label>

                        <input
                          type="email"
                          required
                          maxLength={254}
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="dl-form-group">
                        <label>Phone Number</label>

                        <input
                          type="tel"
                          required
                          maxLength={30}
                          placeholder="+251 900 000 000"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="dl-form-group">
                      <label>
                        Cover Letter / Professional Summary
                      </label>

                      <textarea
                        rows={3}
                        required
                        minLength={5}
                        maxLength={5000}
                        placeholder="Briefly describe your experience and why you are a great fit..."
                        value={formData.coverLetter}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            coverLetter: e.target.value,
                          })
                        }
                      />
                    </div>

                    {applicationError && (
                      <div
                        className="dl-vacancy-form-error"
                        role="alert"
                      >
                        <AlertCircle size={17} />
                        <span>{applicationError}</span>
                      </div>
                    )}

                    <div
                      className="dl-article-modal-actions"
                      style={{ marginTop: "16px" }}
                    >
                      <button
                        type="button"
                        className="dl-btn dl-btn-outline"
                        onClick={closeApplicationModal}
                        disabled={applicationLoading}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="dl-btn dl-btn-primary"
                        disabled={applicationLoading}
                      >
                        {applicationLoading ? (
                          <>
                            <LoaderCircle
                              size={16}
                              className="dl-vacancies-spinner"
                            />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Application
                            <Send size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Vacancies;
