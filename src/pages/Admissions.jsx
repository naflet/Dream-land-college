import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Send,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Building,
  Calendar,
  X,
  Check,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Admissions.css";

const steps = [
  {
    number: "01",
    icon: BookOpen,
    title: "Explore Programs",
    text: "Review our degree, TVET and short-term training opportunities.",
  },
  {
    number: "02",
    icon: CheckCircle2,
    title: "Choose Your Path",
    text: "Select the program and campus that best match your goals.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Prepare Information",
    text: "Prepare transcripts, ID and credentials required for your application.",
  },
  {
    number: "04",
    icon: Send,
    title: "Submit Application",
    text: "Complete your application online or visit our campus admissions office.",
  },
];

const programTracks = [
  {
    id: "degree",
    title: "Degree Programs",
    desc: "Undergraduate programs in Accounting & Finance, Business Management, and Management.",
    requirements: [
      "Official High School Transcript & Preparatory Results",
      "Valid Government or Student ID",
      "Completed Application Form",
    ],
  },
  {
    id: "tvet",
    title: "TVET Programs (Levels 1–4)",
    desc: "Practical technical & vocational training in ICT, Secretarial Administration, Accounting, and Marketing.",
    requirements: [
      "Grade 10 or Grade 12 Completion Certificate",
      "Basic competency assessment",
      "Passport-size photographs",
    ],
  },
  {
    id: "short",
    title: "Short-Term Training",
    desc: "Intensive professional certificates in Computer Maintenance, Advanced Accounting software, and Office Leadership.",
    requirements: [
      "Open to all interested community members and professionals",
      "Basic registration form & fee payment",
    ],
  },
];

const faqs = [
  {
    q: "What are the admission modalities available?",
    a: "Dream Land College offers flexible Regular, Extension (evening/weekend), and Distance education programs across our campuses in Addis Ababa, Asella, and Bale.",
  },
  {
    q: "Can I apply online?",
    a: "Yes! You can complete our online application form instantly by clicking the 'Start Application' button below or visiting any of our campus registrars.",
  },
  {
    q: "When is the deadline for application submission?",
    a: "Admissions remain open for the upcoming academic semester. We encourage prospective students to apply early to secure their preferred shift and campus.",
  },
];

function Admissions() {
  const [activeTab, setActiveTab] = useState("degree");
  const [openFaq, setOpenFaq] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [appData, setAppData] = useState({
    fullName: "",
    email: "",
    phone: "",
    program: "Degree in Accounting & Finance",
    campus: "Addis Ababa",
  });

  const handleAppSubmit = (e) => {
    e.preventDefault();

    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setIsModalOpen(false);

      setAppData({
        fullName: "",
        email: "",
        phone: "",
        program: "Degree in Accounting & Finance",
        campus: "Addis Ababa",
      });
    }, 3500);
  };

  const activeTrack = programTracks.find(
    (track) => track.id === activeTab
  );

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* =====================================================
            HERO SECTION
        ====================================================== */}
        <section className="dl-page-hero dl-admissions-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
               
                <span>Admissions 2026</span>
              </span>
            </div>

            <h1>Start your Dream Land journey.</h1>

            <p>
              A simple, transparent path from discovering your ideal program
              to submitting your application.
            </p>

            <div
              className="dl-hero-stats-grid"
              style={{ marginTop: "30px" }}
            >
              <div className="dl-stat-pill dl-hover-float">
                <Calendar size={18} />

                <div>
                  <strong>Admissions Open</strong>
                  <span>Regular, Extension &amp; Distance</span>
                </div>
              </div>

              <div className="dl-stat-pill dl-hover-float">
                <Building size={18} />

                <div>
                  <strong>3 Study Hubs</strong>
                  <span>Addis Ababa, Asella, Bale</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}
        <section className="dl-admissions-process">
          <div className="dl-shell">
            <div className="dl-section-head dl-centered-head">
              <span className="dl-section-label">How It Works</span>

              <h2 className="dl-section-title">Four simple steps</h2>

              <p className="dl-section-description">
                Follow the process below to begin your academic journey with
                us.
              </p>
            </div>

            <div className="dl-admission-process-grid">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    className="dl-admission-process-card dl-hover-lift"
                    key={step.number}
                  >
                    <div className="dl-process-top">
                      <span>{step.number}</span>
                      <Icon size={22} />
                    </div>

                    <h3>{step.title}</h3>

                    <p>{step.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================
            PROGRAM REQUIREMENTS
        ====================================================== */}
        <section className="dl-admissions-req-section">
          <div className="dl-shell">
            <div className="dl-section-head dl-centered-head">
              <span className="dl-section-label">Requirements</span>

              <h2 className="dl-section-title">
                Program Entry Criteria
              </h2>

              <p className="dl-section-description">
                Explore prerequisites for your preferred study track.
              </p>
            </div>

            <div
              className="dl-modality-tabs-row"
              style={{
                justifyContent: "center",
                marginBottom: "30px",
              }}
            >
              {programTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className={`dl-modality-tab-btn ${
                    activeTab === track.id ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(track.id)}
                >
                  {track.title}
                </button>
              ))}
            </div>

            {activeTrack && (
              <div
                className="dl-admission-track-box dl-fade-in"
                key={activeTrack.id}
              >
                <div className="dl-track-content-inner">
                  <h3>{activeTrack.title}</h3>

                  <p>{activeTrack.desc}</p>

                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#0f172a",
                      margin: "20px 0 10px 0",
                    }}
                  >
                    Admission Requirements:
                  </h4>

                  <ul className="dl-modal-req-list">
                    {activeTrack.requirements.map((req, idx) => (
                      <li key={idx}>
                        <CheckCircle2
                          size={16}
                          className="dl-text-green"
                        />

                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            FAQ
        ====================================================== */}
        <section className="dl-admissions-faq">
          <div
            className="dl-shell"
            style={{
              maxWidth: "800px",
              width: "100%",
            }}
          >
            <div className="dl-section-head dl-centered-head">
              <span className="dl-section-label">
                Common Questions
              </span>

              <h2 className="dl-section-title">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="dl-faq-list">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    className={`dl-faq-item ${
                      isOpen ? "open" : ""
                    }`}
                    key={index}
                    onClick={() =>
                      setOpenFaq(isOpen ? null : index)
                    }
                  >
                    <div className="dl-faq-question">
                      <HelpCircle
                        size={18}
                        className="dl-text-green"
                      />

                      <span>{faq.q}</span>

                      <ChevronDown
                        size={18}
                        className={`dl-faq-chevron ${
                          isOpen ? "rotate" : ""
                        }`}
                      />
                    </div>

                    {isOpen && (
                      <div className="dl-faq-answer dl-fade-in">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA SECTION
        ====================================================== */}
        <section className="dl-admissions-cta">
          <div className="dl-shell">
            <div className="dl-admissions-cta-card">
              <div className="dl-admissions-cta-content">
                <span>READY TO APPLY?</span>

                <h2>
                  Take the first step toward
                  <br />
                  your next opportunity.
                </h2>

                <p>
                  Complete our online application form or visit our
                  campuses in Addis Ababa, Asella, and Bale.
                </p>
              </div>

              <div
                className="dl-admissions-cta-actions"
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="dl-btn dl-btn-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  <span>Start Application</span>
                  <ArrowRight size={17} />
                </button>

                <Link
                  to="/contact"
                  className="dl-btn dl-btn-outline"
                  style={{
                    background: "transparent",
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  Contact Registrar
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          ONLINE APPLICATION MODAL
      ====================================================== */}
      {isModalOpen && (
        <div
          className="dl-gallery-lightbox dl-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="dl-lightbox-close"
            onClick={() => setIsModalOpen(false)}
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

                  <h3>
                    Application Submitted Successfully!
                  </h3>

                  <p>
                    Thank you for applying to Dream Land College. Our
                    admissions committee has received your details and
                    will contact you via email or phone with your
                    enrollment details.
                  </p>
                </div>
              ) : (
                <>
                  <div className="dl-vacancy-modal-top">
                    <span className="dl-vacancy-type-badge">
                      Online Admission Portal
                    </span>

                    <span
                      className="dl-vacancy-type-badge"
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                      }}
                    >
                      2026 Academic Session
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: "10px 0 6px 0",
                    }}
                  >
                    Dream Land College Application Form
                  </h2>

                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#64748b",
                      marginBottom: "20px",
                    }}
                  >
                    Please fill out the required details below to
                    register your interest and start your enrollment
                    process.
                  </p>

                  <form
                    onSubmit={handleAppSubmit}
                    className="dl-vacancy-form"
                  >
                    {/* FULL NAME */}
                    <div className="dl-form-group">
                      <label htmlFor="fullName">
                        Full Name
                      </label>

                      <input
                        id="fullName"
                        type="text"
                        required
                        placeholder="Enter your full name as per ID"
                        value={appData.fullName}
                        onChange={(e) =>
                          setAppData({
                            ...appData,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* EMAIL + PHONE */}
                    <div className="dl-form-grid-2">
                      <div className="dl-form-group">
                        <label htmlFor="email">
                          Email Address
                        </label>

                        <input
                          id="email"
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={appData.email}
                          onChange={(e) =>
                            setAppData({
                              ...appData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="dl-form-group">
                        <label htmlFor="phone">
                          Phone Number
                        </label>

                        <input
                          id="phone"
                          type="tel"
                          required
                          placeholder="+251 900 000 000"
                          value={appData.phone}
                          onChange={(e) =>
                            setAppData({
                              ...appData,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* PROGRAM + CAMPUS */}
                    <div className="dl-form-grid-2">
                      <div className="dl-form-group">
                        <label htmlFor="program">
                          Preferred Program Track
                        </label>

                        <select
                          id="program"
                          value={appData.program}
                          onChange={(e) =>
                            setAppData({
                              ...appData,
                              program: e.target.value,
                            })
                          }
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13.5px",
                            background: "#f8fafc",
                            fontFamily: "inherit",
                            width: "100%",
                            maxWidth: "100%",
                          }}
                        >
                          <option>
                            Degree in Accounting &amp; Finance
                          </option>

                          <option>
                            Degree in Business Management
                          </option>

                          <option>Degree in Management</option>

                          <option>TVET Level 4 ICT</option>

                          <option>
                            TVET Level 4 Secretarial Administration
                          </option>

                          <option>
                            Short-Term Professional Training
                          </option>
                        </select>
                      </div>

                      <div className="dl-form-group">
                        <label htmlFor="campus">
                          Preferred Campus
                        </label>

                        <select
                          id="campus"
                          value={appData.campus}
                          onChange={(e) =>
                            setAppData({
                              ...appData,
                              campus: e.target.value,
                            })
                          }
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13.5px",
                            background: "#f8fafc",
                            fontFamily: "inherit",
                            width: "100%",
                            maxWidth: "100%",
                          }}
                        >
                          <option>Addis Ababa Campus</option>
                          <option>Asella Campus</option>
                          <option>Bale Campus</option>
                        </select>
                      </div>
                    </div>

                    {/* FORM ACTIONS */}
                    <div
                      className="dl-article-modal-actions"
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="dl-btn dl-btn-outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="dl-btn dl-btn-primary"
                      >
                        <span>Submit Application</span>
                        <Send size={15} />
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

export default Admissions;