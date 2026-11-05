
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  CreditCard,
  BookOpen,
  BriefcaseBusiness,
  Sparkles,
  Target,
  Layers,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import publicApi from "../services/publicApi";
import "../styles/ProgramDetail.css";

function ProgramDetail() {
  const { programId } = useParams();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    let isMounted = true;

    const fetchProgram = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await publicApi.get(
          `/programs/${encodeURIComponent(programId)}`
        );

        if (!response?.success || !response?.data) {
          throw new Error("Program information could not be found.");
        }

        if (isMounted) {
          setProgram(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setProgram(null);
          setError(err.message || "Unable to load program information.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProgram();

    return () => {
      isMounted = false;
    };
  }, [programId]);

  // Loading state
  if (loading) {
    return (
      <div className="dl-page dl-fade-in">
        <Navbar />

        <main className="dl-program-not-found">
          <div className="dl-shell">
            <span className="dl-section-label">
              Dream Land College
            </span>
            <h1>Loading Program...</h1>
            <p>Please wait while we load the program information.</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Error or program not found
  if (!program) {
    return (
      <div className="dl-page dl-fade-in">
        <Navbar />

        <main className="dl-program-not-found">
          <div className="dl-shell">
            <span className="dl-section-label">
              Dream Land College
            </span>

            <h1>
              {error ? "Unable to Load Program" : "Program not found"}
            </h1>

            <p>
              {error ||
                "The program you are looking for could not be found or might have been removed."}
            </p>

            <Link
              to="/programs"
              className="dl-btn dl-btn-primary"
            >
              <ArrowLeft size={17} />
              Back to Programs
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Normalize backend fields
  const modes = Array.isArray(program.modes)
    ? program.modes
    : [];

  const campusList = Array.isArray(program.campuses)
    ? program.campuses
    : [];

  const campuses = campusList
    .map((item) => item.campus?.name || item.name)
    .filter(Boolean);

  const whatYouLearn = Array.isArray(program.what_you_learn)
    ? program.what_you_learn
    : [];

  const skills = Array.isArray(program.skills)
    ? program.skills
    : [];

  const careerPaths = Array.isArray(program.career_paths)
    ? program.career_paths
    : [];

  const monthlyPayment =
    program.payment_note ||
    (program.monthly_payment !== null &&
    program.monthly_payment !== undefined
      ? String(program.monthly_payment)
      : "Contact the college for details");

  const currentLevel = program.level || "Not specified";

  return (
    <div className="dl-page dl-program-detail-page dl-fade-in">
      <Navbar />

      <main>
        {/* =====================================================
            HERO SECTION
        ===================================================== */}
        <section className="dl-program-detail-hero">
          {program.image && (
            <img
              src={program.image}
              alt={program.title}
            />
          )}

          <div className="dl-program-detail-overlay" />

          <div className="dl-shell dl-hero-content-shell">
            <div className="dl-program-hero-badge dl-pulse-glow">
              <Sparkles size={15} />
              {program.category}
            </div>

            <h1>{program.title}</h1>

            <p>{program.description}</p>

            <div className="dl-program-hero-meta">
              <span>
                <GraduationCap size={17} />
                Study Level: <strong>{currentLevel}</strong>
              </span>

              <span>
                <Clock3 size={17} />
                {program.duration}
              </span>

              <span>
                <CreditCard size={17} />
                Flexible Payments
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            QUICK STATS CARDS
        ===================================================== */}
        <section className="dl-program-quick-info">
          <div className="dl-shell">
            <div className="dl-program-info-cards">
              <article
                className="dl-program-info-card"
                style={{ "--item-index": 0 }}
              >
                <div className="dl-program-info-icon">
                  <Clock3 size={21} />
                </div>
                <div>
                  <small>Duration</small>
                  <strong>{program.duration || "Not specified"}</strong>
                </div>
              </article>

              <article
                className="dl-program-info-card"
                style={{ "--item-index": 1 }}
              >
                <div className="dl-program-info-icon">
                  <CreditCard size={21} />
                </div>
                <div>
                  <small>Monthly Payment</small>
                  <strong>{monthlyPayment}</strong>
                </div>
              </article>

              <article
                className="dl-program-info-card"
                style={{ "--item-index": 2 }}
              >
                <div className="dl-program-info-icon">
                  <Layers size={21} />
                </div>
                <div>
                  <small>Current Level</small>
                  <strong>{currentLevel}</strong>
                </div>
              </article>

              <article
                className="dl-program-info-card"
                style={{ "--item-index": 3 }}
              >
                <div className="dl-program-info-icon">
                  <MapPin size={21} />
                </div>
                <div>
                  <small>Campuses</small>
                  <strong>
                    {campuses.length > 0
                      ? campuses.join(", ")
                      : "Main Campus"}
                  </strong>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN DETAILS GRID
        ===================================================== */}
        <section className="dl-program-detail-content">
          <div className="dl-shell">
            <div className="dl-program-detail-grid">

              {/* LEFT COLUMN */}
              <div className="dl-program-main-column">

                {/* OVERVIEW */}
                <section className="dl-program-content-section dl-program-overview">
                  <span className="dl-section-label">
                    Program Overview
                  </span>

                  <h2>
                    Build expertise.
                    <br />
                    Shape your professional future.
                  </h2>

                  <p>
                    {program.overview || program.description}
                  </p>
                </section>

                {/* WHAT YOU LEARN */}
                {whatYouLearn.length > 0 && (
                  <section className="dl-program-content-section">
                    <div className="dl-content-heading">
                      <div className="dl-heading-icon">
                        <BookOpen size={21} />
                      </div>
                      <div>
                        <span className="dl-section-label">
                          Curriculum
                        </span>
                        <h2>What you will learn</h2>
                      </div>
                    </div>

                    <div className="dl-program-feature-grid">
                      {whatYouLearn.map((item, index) => (
                        <article
                          className="dl-program-feature-card"
                          key={index}
                          style={{ "--item-index": index }}
                        >
                          <span className="dl-feature-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="dl-feature-check">
                            <CheckCircle2 size={18} />
                          </div>
                          <p>{item}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {/* SKILLS */}
                {skills.length > 0 && (
                  <section className="dl-program-content-section dl-skills-section">
                    <div className="dl-content-heading">
                      <div className="dl-heading-icon">
                        <Target size={21} />
                      </div>
                      <div>
                        <span className="dl-section-label">
                          Competencies
                        </span>
                        <h2>Skills you will develop</h2>
                      </div>
                    </div>

                    <div className="dl-skills-list">
                      {skills.map((skill, index) => (
                        <div
                          className="dl-skill-item"
                          key={index}
                          style={{ "--item-index": index }}
                        >
                          <span>
                            <CheckCircle2 size={17} />
                          </span>
                          <p>{skill}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* CAREER PATHS */}
                {careerPaths.length > 0 && (
                  <section className="dl-program-content-section">
                    <div className="dl-content-heading">
                      <div className="dl-heading-icon">
                        <BriefcaseBusiness size={21} />
                      </div>
                      <div>
                        <span className="dl-section-label">
                          Opportunities
                        </span>
                        <h2>Your career paths</h2>
                      </div>
                    </div>

                    <div className="dl-career-grid">
                      {careerPaths.map((career, index) => (
                        <div
                          className="dl-career-card"
                          key={index}
                          style={{ "--item-index": index }}
                        >
                          <div>
                            <ArrowRight size={17} />
                          </div>
                          <span>{career}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* STUDY MODES */}
                {modes.length > 0 && (
                  <section className="dl-program-content-section">
                    <span className="dl-section-label">
                      Flexibility
                    </span>
                    <h2 className="dl-simple-section-title">
                      Available study modes
                    </h2>
                    <div className="dl-study-modes">
                      {modes.map((mode, index) => (
                        <span
                          key={index}
                          style={{ "--item-index": index }}
                        >
                          <CheckCircle2 size={16} />
                          {mode}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* RIGHT SIDEBAR */}
              <aside className="dl-program-detail-sidebar">
                <div className="dl-sidebar-inner">
                  <span className="dl-sidebar-kicker">
                    Enrollment Open
                  </span>

                  <h3>
                    Join this program at
                    <span> Dream Land</span>
                  </h3>

                  <p>
                    Secure your spot today and start your learning journey with us.
                  </p>

                  <div className="dl-sidebar-payment">
                    <div className="dl-sidebar-payment-icon">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <small>Monthly Investment</small>
                      <strong>{monthlyPayment}</strong>
                    </div>
                  </div>

                  <div className="dl-sidebar-row">
                    <Layers size={18} />
                    <div>
                      <small>Current Academic Level</small>
                      <strong>{currentLevel}</strong>
                    </div>
                  </div>

                  <div className="dl-sidebar-row">
                    <Clock3 size={18} />
                    <div>
                      <small>Duration</small>
                      <strong>{program.duration || "Not specified"}</strong>
                    </div>
                  </div>

                  <div className="dl-sidebar-row">
                    <MapPin size={18} />
                    <div>
                      <small>Campuses</small>
                      <strong>
                        {campuses.length > 0
                          ? campuses.join(", ")
                          : "Main Campus"}
                      </strong>
                    </div>
                  </div>

                  <Link
                    to={`/application?program=${encodeURIComponent(program.slug)}`}
                    className="dl-btn dl-btn-primary dl-sidebar-apply-btn"
                  >
                    <span>Apply For This Program</span>
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/contact"
                    className="dl-detail-contact-link"
                  >
                    Have questions? Contact Admissions
                  </Link>
                </div>
              </aside>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ProgramDetail;
