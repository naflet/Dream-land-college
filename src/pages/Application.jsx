
import React, { useMemo, useState, useEffect, useCallback } from "react";

import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Send,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
  Inbox,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import supabase from "../config/supabase";
import api from "../admin/services/api";
import "../styles/Application.css";

const faqs = [
  {
    q: "What documents are required after applying?",
    a: "After submitting your online application, our admissions team will contact you to bring copies of your transcripts, recent ID photos, and relevant educational credentials.",
  },
  {
    q: "Can I change my preferred campus later?",
    a: "Yes, you can request a campus transfer before final enrollment by reaching out directly to our registrar's office.",
  },
];

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  campusId: "",
  programId: "",
  educationLevel: "Degree Programs",
  notes: "",
};

/* ==========================================================
   FORMAT PROGRAMS FROM SUPABASE
========================================================== */

const formatPrograms = (data = []) => {
  return data.map((program) => {
    const campusRelations = Array.isArray(program.program_campuses)
      ? program.program_campuses
      : [];

    const campuses = campusRelations
      .map((relation) => {
        // Supabase relationship response
        const campus = relation.campus;

        if (!campus) return null;

        return {
          id: campus.id,
          name: campus.name?.replace(/\s+Campus$/i, "") || campus.name,
        };
      })
      .filter(Boolean);

    return {
      ...program,
      campuses,
    };
  });
};

/* ==========================================================
   APPLICATION PAGE
========================================================== */

function Application() {
  const [formData, setFormData] = useState(initialFormData);

  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programLoadError, setProgramLoadError] = useState(false);
  const [programRetry, setProgramRetry] = useState(0);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const [activeFaq, setActiveFaq] = useState(null);

  /* ========================================================
     SCROLL TO TOP
  ======================================================== */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  /* ========================================================
     FETCH ACTIVE PROGRAMS DIRECTLY FROM SUPABASE
  ======================================================== */

  const loadPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      setProgramLoadError(false);

      const { data, error: supabaseError } = await supabase
        .from("programs")
        .select(`
          id,
          title,
          category,
          is_active,
          program_campuses (
            campus:campuses (
              id,
              name
            )
          )
        `)
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (supabaseError) {
        console.error("Programs database error:", supabaseError);
        throw supabaseError;
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid programs data received.");
      }

      const formattedPrograms = formatPrograms(data);

      setPrograms(formattedPrograms);
      setProgramLoadError(false);

      // Clear selections that are no longer available.
      setFormData((previous) => {
        const selectedProgram = formattedPrograms.find(
          (program) =>
            String(program.id) === String(previous.programId)
        );

        if (!selectedProgram) {
          return {
            ...previous,
            programId: "",
            campusId: "",
          };
        }

        const selectedCampusExists = selectedProgram.campuses.some(
          (campus) =>
            String(campus.id) === String(previous.campusId)
        );

        return {
          ...previous,
          campusId: selectedCampusExists
            ? previous.campusId
            : "",
        };
      });
    } catch (error) {
      console.error("Failed to load application programs:", error);

      setPrograms([]);
      setProgramLoadError(true);
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      await loadPrograms();
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [loadPrograms, programRetry]);

  /* ========================================================
     HANDLE FORM CHANGES
  ======================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "educationLevel") {
        updated.programId = "";
        updated.campusId = "";
      }

      if (name === "programId") {
        updated.campusId = "";
      }

      return updated;
    });

    setSubmitError(false);
  };

  /* ========================================================
     FILTER PROGRAMS BY STUDY LEVEL
  ======================================================== */

  const availablePrograms = useMemo(() => {
    return programs.filter(
      (program) =>
        program.category === formData.educationLevel
    );
  }, [programs, formData.educationLevel]);

  /* ========================================================
     SELECTED PROGRAM
  ======================================================== */

  const selectedProgramDetails = useMemo(() => {
    return programs.find(
      (program) =>
        String(program.id) === String(formData.programId)
    );
  }, [programs, formData.programId]);

  /* ========================================================
     CAMPUSES AVAILABLE FOR SELECTED PROGRAM
  ======================================================== */

  const availableCampuses = useMemo(() => {
    return selectedProgramDetails?.campuses || [];
  }, [selectedProgramDetails]);

  /* ========================================================
     SELECTED CAMPUS
  ======================================================== */

  const selectedCampusDetails = useMemo(() => {
    return availableCampuses.find(
      (campus) =>
        String(campus.id) === String(formData.campusId)
    );
  }, [availableCampuses, formData.campusId]);

  /* ========================================================
     APPLICATION PROGRESS
  ======================================================== */

  const formProgress = useMemo(() => {
    let filled = 0;

    if (formData.fullName.trim()) filled += 25;
    if (formData.email.trim()) filled += 25;
    if (formData.phone.trim()) filled += 25;
    if (formData.programId) filled += 25;

    return filled;
  }, [formData]);

  /* ========================================================
     RETRY PROGRAM FETCH
  ======================================================== */

  const handleRetryPrograms = () => {
    setProgramRetry((previous) => previous + 1);
  };

  /* ========================================================
     SUBMIT APPLICATION
     EXPRESS BACKEND IS RETAINED FOR SECURE WRITES
  ======================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || loadingPrograms || programLoadError) {
      return;
    }

    if (!selectedProgramDetails || !selectedCampusDetails) {
      setSubmitError(true);
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(false);

      const applicationData = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        campus_id: selectedCampusDetails.id,
        program_id: selectedProgramDetails.id,
        education_level: formData.educationLevel,
        notes: formData.notes.trim(),
      };

      const response = await api.post(
        "/applications/submit",
        applicationData
      );

      if (!response?.success || !response?.application) {
        throw new Error(
          response?.message || "Application submission failed."
        );
      }

      setSubmitted(true);

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Application submission failed:", error);
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  /* ========================================================
     NEW APPLICATION
  ======================================================== */

  const handleNewApplication = () => {
    setSubmitted(false);
    setSubmitError(false);
    setFormData(initialFormData);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="dl-application-page">
      <Navbar />

      <main>
        {/* APPLICATION HERO */}

        <section className="dl-application-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                Online Admission Portal
              </span>
            </div>

            <h1>Take Your Next Step</h1>

            <p>
              Tell us about yourself, choose your preferred campus,
              and apply directly to our accredited programs.
            </p>
          </div>
        </section>

        {/* APPLICATION CONTENT */}

        <section className="dl-application-content">
          <div className="dl-shell">

            {submitted ? (
              <div className="dl-application-success dl-fade-in">
                <div className="dl-success-icon">
                  <CheckCircle2 size={54} />
                </div>

                <h1>Application Submitted Successfully!</h1>

                <p>
                  Thank you for applying to Dream Land College.
                  Your application has been received successfully.
                </p>

                <button
                  type="button"
                  className="dl-btn dl-btn-primary"
                  onClick={handleNewApplication}
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <div className="dl-application-layout">

                {/* INTRO SIDEBAR & FAQ */}

                <div className="dl-application-intro">

                  <div>
                    <span className="dl-section-label">
                      Streamlined Admissions
                    </span>

                    <h2>
                      Begin your journey
                      <br />
                      with Dream Land.
                    </h2>

                    <p>
                      Fill out our secure digital application. No payment
                      is required at this initial stage.
                    </p>
                  </div>

                  {/* LIVE PROGRESS CARD */}

                  <div className="dl-application-progress-card">
                    <div className="dl-progress-header">
                      <span>Application Completion</span>
                      <strong>{formProgress}%</strong>
                    </div>

                    <div className="dl-progress-bar-track">
                      <div
                        className="dl-progress-bar-fill"
                        style={{
                          width: `${formProgress}%`,
                        }}
                      />
                    </div>

                    <p>
                      {formProgress === 100
                        ? "All core fields complete! Ready to submit."
                        : "Complete name, email, phone, and program."}
                    </p>
                  </div>

                  {/* FAQ */}

                  <div className="dl-application-faq">
                    <div className="dl-faq-title">
                      <HelpCircle size={18} />
                      <h3>Admissions FAQ</h3>
                    </div>

                    {faqs.map((faq, index) => {
                      const isOpen = activeFaq === index;

                      return (
                        <div
                          key={faq.q}
                          className={`dl-faq-item ${
                            isOpen ? "open" : ""
                          }`}
                        >
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setActiveFaq(
                                isOpen ? null : index
                              )
                            }
                          >
                            <span>{faq.q}</span>

                            <ChevronDown
                              size={16}
                              className={`dl-chevron ${
                                isOpen ? "rotate" : ""
                              }`}
                            />
                          </button>

                          {isOpen && (
                            <div className="dl-faq-answer dl-fade-in">
                              <p>{faq.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* SECURE NOTE */}

                  <div className="dl-application-note">
                    <ShieldCheck size={20} />

                    <span>
                      Your personal data is handled securely under our
                      institutional privacy protocols.
                    </span>
                  </div>
                </div>

                {/* APPLICATION FORM */}

                <form
                  onSubmit={handleSubmit}
                  className="dl-application-form dl-slide-up"
                >
                  <div className="dl-form-grid">

                    {/* FULL NAME */}

                    <div className="dl-form-group">
                      <label htmlFor="fullName">
                        Full Name <span className="dl-required">*</span>
                      </label>

                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        required
                        disabled={submitting}
                      />
                    </div>

                    {/* EMAIL */}

                    <div className="dl-form-group">
                      <label htmlFor="email">
                        Email Address <span className="dl-required">*</span>
                      </label>

                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        autoComplete="email"
                        required
                        disabled={submitting}
                      />
                    </div>

                    {/* PHONE */}

                    <div className="dl-form-group">
                      <label htmlFor="phone">
                        Phone Number <span className="dl-required">*</span>
                      </label>

                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+251 ..."
                        autoComplete="tel"
                        required
                        disabled={submitting}
                      />
                    </div>

                    {/* STUDY LEVEL */}

                    <div className="dl-form-group">
                      <label htmlFor="educationLevel">
                        Study Level
                      </label>

                      <select
                        id="educationLevel"
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        <option value="Degree Programs">
                          Degree Programs
                        </option>

                        <option value="TVET Level 1–4">
                          TVET Level 1–4
                        </option>
                      </select>
                    </div>

                    {/* PROGRAM */}

                    <div className="dl-form-group">
                      <label htmlFor="programId">
                        Select Program <span className="dl-required">*</span>
                      </label>

                      <select
                        id="programId"
                        name="programId"
                        value={formData.programId}
                        onChange={handleChange}
                        required
                        disabled={
                          loadingPrograms ||
                          programLoadError ||
                          submitting ||
                          availablePrograms.length === 0
                        }
                      >
                        <option value="">
                          {loadingPrograms
                            ? "Loading programs..."
                            : programLoadError
                            ? "Programs unavailable"
                            : availablePrograms.length === 0
                            ? "No programs available"
                            : "-- Choose Program --"}
                        </option>

                        {availablePrograms.map((program) => (
                          <option
                            key={program.id}
                            value={program.id}
                          >
                            {program.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CAMPUS */}

                    <div className="dl-form-group">
                      <label htmlFor="campusId">
                        Preferred Campus <span className="dl-required">*</span>
                      </label>

                      <select
                        id="campusId"
                        name="campusId"
                        value={formData.campusId}
                        onChange={handleChange}
                        required
                        disabled={
                          !selectedProgramDetails ||
                          submitting
                        }
                      >
                        <option value="">
                          {!selectedProgramDetails
                            ? "Choose a program first"
                            : availableCampuses.length === 0
                            ? "No campus available"
                            : "-- Choose Campus --"}
                        </option>

                        {availableCampuses.map((campus) => (
                          <option
                            key={campus.id}
                            value={campus.id}
                          >
                            {campus.name} Campus
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PROGRAM LOADING */}

                  {loadingPrograms && (
                    <div className="dl-application-status dl-app-loading">
                      <LoaderCircle
                        size={24}
                        className="dl-app-spin"
                      />

                      <div>
                        <strong>Loading Available Programs</strong>
                        <p>
                          Please wait while we retrieve the programs.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PROGRAM ERROR */}

                  {programLoadError && (
                    <div
                      className="dl-application-status dl-app-error"
                      role="alert"
                    >
                      <AlertCircle size={24} />

                      <div>
                        <strong>Unable to Load Programs</strong>
                        <p>
                          We couldn't retrieve the available programs.
                          Please check your connection and try again.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRetryPrograms}
                        disabled={loadingPrograms}
                        className="dl-app-retry-btn"
                      >
                        <RefreshCw size={15} />
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* EMPTY PROGRAM STATE */}

                  {!loadingPrograms &&
                    !programLoadError &&
                    availablePrograms.length === 0 && (
                      <div className="dl-application-status dl-app-empty">
                        <Inbox size={24} />

                        <div>
                          <strong>No Programs Available</strong>
                          <p>
                            There are currently no active programs
                            available for this study level.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* PROGRAM PREVIEW */}

                  {selectedProgramDetails && (
                    <div className="dl-program-preview-badge dl-fade-in">
                      <BookOpen size={16} />

                      <div>
                        <span>Selected Program Overview:</span>

                        <strong>
                          {selectedProgramDetails.title}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* NOTES */}

                  <div className="dl-form-group dl-form-full">
                    <label htmlFor="notes">
                      Additional Information or Notes (Optional)
                    </label>

                    <textarea
                      id="notes"
                      name="notes"
                      rows="4"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Share any questions or background details..."
                      disabled={submitting}
                    />
                  </div>

                  {/* SUBMISSION ERROR */}

                  {submitError && (
                    <div
                      className="dl-application-status dl-app-error dl-app-submit-error"
                      role="alert"
                    >
                      <AlertCircle size={24} />

                      <div>
                        <strong>Unable to Submit Application</strong>
                        <p>
                          Something went wrong while submitting your
                          application. Your entered information is still
                          available. Please try again.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById("dl-application-submit")
                            ?.click()
                        }
                        className="dl-app-retry-btn"
                      >
                        <RefreshCw size={15} />
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* SUBMIT BUTTON */}

                  <div className="dl-form-actions">
                    <button
                      id="dl-application-submit"
                      type="submit"
                      className="dl-btn dl-btn-primary"
                      disabled={
                        submitting ||
                        loadingPrograms ||
                        programLoadError ||
                        availablePrograms.length === 0
                      }
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="dl-app-spin"
                          />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>

                  <small className="dl-form-disclaimer">
                    By submitting this application, you confirm that
                    your contact details are correct and active.
                  </small>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Application;
