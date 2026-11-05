import React, { useState } from "react";
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
  Check
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Vacancies.css";

const vacancyList = [
  {
    id: 1,
    title: "Lecturer in Computer Science & IT",
    category: "Academic",
    icon: GraduationCap,
    campus: "Addis Ababa Campus",
    type: "Full-Time",
    deadline: "30 June 2026",
    description: "Seeking a qualified lecturer with a Master's degree in Computer Science or Software Engineering to instruct undergraduate students and supervise practical lab projects.",
    requirements: ["Master's Degree in CS/SE or related field", "Minimum 2 years of higher education teaching experience", "Proficiency in modern web technologies and programming"]
  },
  {
    id: 2,
    title: "Senior Accountant & Finance Officer",
    category: "Administrative",
    icon: BriefcaseBusiness,
    campus: "Addis Ababa Campus",
    type: "Full-Time",
    deadline: "15 July 2026",
    description: "Responsible for managing campus accounts, student fee records, payroll processing, and financial reporting in accordance with institutional guidelines.",
    requirements: ["Bachelor's Degree in Accounting & Finance", "Certified Accountant credentials (ACCA/CPA) preferred", "Minimum 3 years professional finance experience"]
  },
  {
    id: 3,
    title: "TVET Practical Workshop Instructor (ICT)",
    category: "Academic",
    icon: GraduationCap,
    campus: "Asella Campus",
    type: "Full-Time / Contract",
    deadline: "10 July 2026",
    description: "Looking for a skilled TVET instructor to conduct practical hardware, networking, and software applications training for Levels 1-4 students.",
    requirements: ["TVET Level 4 or Degree in ICT / Computer Maintenance", "Industry certification in networking or support", "Strong practical demonstration skills"]
  },
  {
    id: 4,
    title: "Campus Registrar & Student Services Coordinator",
    category: "Administrative",
    icon: BriefcaseBusiness,
    campus: "Bale Campus",
    type: "Full-Time",
    deadline: "25 July 2026",
    description: "Oversee student admissions, enrollment processing, academic records management, and coordinate student support services at our Bale provincial hub.",
    requirements: ["Bachelor's Degree in Management or Educational Leadership", "Excellent interpersonal and communication skills", "Proficiency in student database management systems"]
  }
];

function Vacancies() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", coverLetter: "" });

  const filteredJobs = vacancyList.filter(job => {
    if (activeFilter === "ALL") return true;
    return job.category.toUpperCase() === activeFilter.toUpperCase();
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setSelectedJob(null);
      setFormData({ fullName: "", email: "", phone: "", coverLetter: "" });
    }, 3000);
  };

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="dl-page-hero dl-vacancies-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                <Sparkles size={14} /> Careers at Dream Land
              </span>
            </div>

            <h1>Grow with a learning community.</h1>

            <p>
              Explore rewarding career opportunities to contribute to education, research, and student development across our campuses.
            </p>

            <div className="dl-hero-stats-grid" style={{ marginTop: "30px" }}>
              <div className="dl-stat-pill dl-hover-float">
                <BriefcaseBusiness size={18} />
                <div>
                  <strong>{vacancyList.length} Open Positions</strong>
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
            
            <div className="dl-section-head dl-centered-head" style={{ marginBottom: "35px" }}>
              <span className="dl-section-label">Career Opportunities</span>
              <h2 className="dl-section-title">Join Dream Land College</h2>
              <p className="dl-section-description">
                Filter through our current openings below or reach out directly to join our dynamic faculty and staff.
              </p>
            </div>

            {/* FILTER TABS */}
            <div className="dl-modality-tabs-row" style={{ justifyContent: "center", marginBottom: "40px" }}>
              {["ALL", "ACADEMIC", "ADMINISTRATIVE"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`dl-modality-tab-btn ${activeFilter === tab ? "active" : ""}`}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab === "ALL" ? "All Openings" : tab}
                </button>
              ))}
            </div>

            {/* VACANCIES GRID */}
            <div className="dl-vacancies-grid">
              {filteredJobs.map((job) => {
                const Icon = job.icon;
                return (
                  <article
                    className="dl-vacancy-card dl-hover-lift"
                    key={job.id}
                  >
                    <div className="dl-vacancy-header-row">
                      <div className="dl-vacancy-icon">
                        <Icon size={22} />
                      </div>
                      <span className="dl-vacancy-type-badge">{job.type}</span>
                    </div>

                    <h2>{job.title}</h2>
                    <p className="dl-vacancy-desc">{job.description}</p>

                    <div className="dl-vacancy-meta-list">
                      <div>
                        <MapPin size={14} className="dl-text-green" />
                        <span>{job.campus}</span>
                      </div>
                      <div>
                        <Clock size={14} className="dl-text-green" />
                        <span>Deadline: {job.deadline}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="dl-btn dl-btn-outline"
                      style={{ width: "100%", marginTop: "10px" }}
                      onClick={() => setSelectedJob(job)}
                    >
                      View Details & Apply <ArrowRight size={16} />
                    </button>
                  </article>
                );
              })}
            </div>

            {/* GENERAL INQUIRY BANNER */}
            <div className="dl-vacancy-inquiry-box dl-hover-float" style={{ marginTop: "60px" }}>
              <div>
                <h3>Don't see your exact role?</h3>
                <p>We are always eager to connect with passionate educators and professionals. Send us your CV for future consideration.</p>
              </div>
              <Link to="/contact" className="dl-btn dl-btn-primary">
                Send General Application <ArrowRight size={16} />
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
            if (e.target === e.currentTarget) setSelectedJob(null);
          }}
        >
          <button
            type="button"
            className="dl-lightbox-close"
            onClick={() => setSelectedJob(null)}
          >
            <X size={24} />
          </button>

          <div className="dl-article-modal-box dl-scale-up">
            <div className="dl-article-modal-content">
              {isSubmitted ? (
                <div className="dl-gallery-empty-state dl-fade-in" style={{ padding: "40px 0" }}>
                  <div className="dl-success-check-circle">
                    <Check size={32} />
                  </div>
                  <h3>Application Submitted Successfully!</h3>
                  <p>Thank you for applying for the <strong>{selectedJob.title}</strong> position at Dream Land College. Our HR team will review your credentials and contact you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="dl-vacancy-modal-top">
                    <span className="dl-vacancy-type-badge">{selectedJob.category}</span>
                    <span className="dl-vacancy-type-badge" style={{ background: "#f0fdf4", color: "#166534" }}>{selectedJob.campus}</span>
                  </div>

                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "10px 0 10px 0" }}>
                    {selectedJob.title}
                  </h2>

                  <p className="dl-article-full-text" style={{ fontSize: "14px", marginBottom: "16px" }}>
                    {selectedJob.description}
                  </p>

                  <h4 style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                    Key Requirements:
                  </h4>
                  <ul className="dl-modal-req-list">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={14} className="dl-text-green" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>

                  <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "20px 0" }} />

                  <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "14px" }}>
                    Submit Your Application
                  </h4>

                  <form onSubmit={handleFormSubmit} className="dl-vacancy-form">
                    <div className="dl-form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>

                    <div className="dl-form-grid-2">
                      <div className="dl-form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="dl-form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="+251 900 000 000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="dl-form-group">
                      <label>Cover Letter / Professional Summary</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Briefly describe your experience and why you are a great fit..."
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="dl-article-modal-actions" style={{ marginTop: "16px" }}>
                      <button type="button" className="dl-btn dl-btn-outline" onClick={() => setSelectedJob(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="dl-btn dl-btn-primary">
                        Submit Application <Send size={15} />
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