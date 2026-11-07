
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  BookMarked,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/About.css";

const modalityData = {
  regular: {
    title: "Regular Program",
    subtitle: "Immersive On-Campus Learning",
    desc: "Designed for full-time students seeking comprehensive classroom interaction, hands-on lab sessions, and direct faculty mentorship.",
    features: [
      "Daily structured classes",
      "Access to physical library & labs",
      "Full campus life and student clubs",
    ],
  },

  extension: {
    title: "Extension Program",
    subtitle: "Flexible Evening & Weekend Classes",
    desc: "Tailored for working professionals and ambitious individuals who want to advance their education without interrupting their careers.",
    features: [
      "Evening & weekend schedules",
      "Peer networking with professionals",
      "Same accredited curriculum",
    ],
  },

  distance: {
    title: "Distance Education",
    subtitle: "Self-Paced Remote Learning",
    desc: "Provides maximum flexibility through curated module packages, guided reading assignments, and periodic tutorial support sessions.",
    features: [
      "Study at your own pace",
      "Comprehensive printed & digital modules",
      "Minimal on-campus attendance required",
    ],
  },
};

function About() {
  const [activeModality, setActiveModality] = useState("regular");

  const activeData = modalityData[activeModality];

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="dl-page-hero dl-about-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                <BookMarked size={14} />
                Knowledge & Excellence
              </span>
            </div>

            <h1>About Our Institution & Library Hub</h1>

            <p>
              Empowering the next generation of professionals through rigorous
              Degree and TVET programs delivered via Regular, Extension, and
              Distance modalities.
            </p>

            <div className="dl-hero-stats-grid">
              <div className="dl-stat-pill dl-hover-float">
                <BookOpen size={18} />

                <div>
                  <strong>10,000+</strong>
                  <span>Library Resources</span>
                </div>
              </div>

              <div className="dl-stat-pill dl-hover-float">
                <Users size={18} />

                <div>
                  <strong>Expert Faculty</strong>
                  <span>Dedicated Mentors</span>
                </div>
              </div>

              <div className="dl-stat-pill dl-hover-float">
                <Award size={18} />

                <div>
                  <strong>Fully Accredited</strong>
                  <span>Quality Assured</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIBRARY & CAMPUS ATMOSPHERE */}
        <section className="dl-about-section">
          <div className="dl-shell">
            <div className="dl-about-split">
              <div className="dl-about-text-content dl-fade-in">
                <span className="dl-section-tag">
                  Academic Sanctuary
                </span>

                <h2>
                  A Modern Learning Environment Built for Success
                </h2>

                <p>
                  Our campus and digital library infrastructure provide
                  students with quiet study zones, collaborative research
                  spaces, and extensive academic resources tailored for
                  Accounting & Finance, Business Management, IT, and
                  vocational TVET courses.
                </p>

                <div className="dl-check-grid">
                  <div className="dl-check-item">
                    <CheckCircle2
                      size={18}
                      className="dl-text-green"
                    />
                    <span>Silent & Group Study Halls</span>
                  </div>

                  <div className="dl-check-item">
                    <CheckCircle2
                      size={18}
                      className="dl-text-green"
                    />
                    <span>Computer & Technical Labs</span>
                  </div>

                  <div className="dl-check-item">
                    <CheckCircle2
                      size={18}
                      className="dl-text-green"
                    />
                    <span>Extensive Reference Archives</span>
                  </div>

                  <div className="dl-check-item">
                    <CheckCircle2
                      size={18}
                      className="dl-text-green"
                    />
                    <span>High-Speed Campus Wi-Fi</span>
                  </div>
                </div>
              </div>

              <div className="dl-about-visual-box dl-fade-in">
                <div className="dl-visual-card dl-pulse-glow">
                  <BookOpen
                    size={42}
                    className="dl-text-green"
                  />

                  <h3>Dynamic Study Hub</h3>

                  <p>
                    Equipped with modern research tools and quiet reading
                    zones designed to stimulate deep academic focus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE MODALITY SECTION */}
        <section className="dl-about-modalities-section">
          <div className="dl-shell">
            <div className="dl-centered-header">
              <span className="dl-section-tag">
                Flexible Learning
              </span>

              <h2>Choose Your Modality</h2>

              <p>
                We offer versatile study options to fit your lifestyle and
                schedule.
              </p>
            </div>

            {/* MODALITY TABS */}
            <div
              className="dl-modality-tabs-row"
              role="tablist"
              aria-label="Learning modalities"
            >
              {Object.entries(modalityData).map(([key, modality]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeModality === key}
                  aria-controls="dl-active-modality-panel"
                  className={`dl-modality-tab-btn ${
                    activeModality === key ? "active" : ""
                  }`}
                  onClick={() => setActiveModality(key)}
                >
                  {modality.title}
                </button>
              ))}
            </div>

            {/* ACTIVE MODALITY */}
            <div
              id="dl-active-modality-panel"
              className="dl-modality-display-card"
              key={activeModality}
              role="tabpanel"
            >
              <div className="dl-modality-header-info">
                <div>
                  <span className="dl-modality-number">
                    {activeModality === "regular"
                      ? "01"
                      : activeModality === "extension"
                      ? "02"
                      : "03"}
                  </span>

                  <h3>{activeData.title}</h3>
                </div>

                <span className="dl-modal-badge">
                  {activeData.subtitle}
                </span>
              </div>

              <p className="dl-modality-desc">
                {activeData.desc}
              </p>

              <div className="dl-modality-features-grid">
                {activeData.features.map((feat, idx) => (
                  <div
                    key={`${activeModality}-${idx}`}
                    className="dl-modality-feat-pill"
                  >
                    <CheckCircle2
                      size={16}
                      className="dl-text-green"
                    />

                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="dl-modality-action">
                <Link
                  to="/programs"
                  className="dl-btn dl-btn-primary"
                >
                  Explore Programs in this Modality
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;
