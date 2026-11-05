
import React, { useState } from "react";
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
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../admin/services/api";
import "../styles/Staff.css";

const staffMembers = [
  {
    id: 1,
    name: "Dr. Almaz Bekele",
    title: "President & Professor of Educational Leadership",
    department: "Executive Board",
    email: "a.bekele@dreamland.edu.et",
    office: "Main Campus, Admin Building 101",
    hours: "Mon & Wed: 2:00 PM - 5:00 PM",
    phone: "+251 11 123 4501",
    bio: "Dr. Almaz Bekele has over 25 years of experience in higher education administration, curriculum design, and national academic policy reform across East Africa.",
    research: [
      "Higher Education Administration",
      "Policy Reform",
      "Institutional Growth",
    ],
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 2,
    name: "Dr. Yohannes Tadesse",
    title: "Dean of Computing & Software Engineering",
    department: "Computer Science",
    email: "y.tadesse@dreamland.edu.et",
    office: "Tech Block, Room 304",
    hours: "Tue & Thu: 10:00 AM - 1:00 PM",
    phone: "+251 11 123 4512",
    bio: "Specializing in distributed systems, cloud computing architectures, and artificial intelligence for regional agricultural and financial development.",
    research: [
      "Distributed Systems",
      "Cloud Computing",
      "AI for Social Good",
    ],
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 3,
    name: "Prof. Meron Lemma",
    title: "Head of Nursing & Clinical Health Sciences",
    department: "Health Sciences",
    email: "m.lemma@dreamland.edu.et",
    office: "Assela Health Wing, Room 202",
    hours: "Mon & Fri: 9:00 AM - 12:00 PM",
    phone: "+251 23 331 2255",
    bio: "Dedicated clinical educator focused on patient safety protocols, community health nursing, and maternal care training programs.",
    research: [
      "Community Health Nursing",
      "Clinical Safety",
      "Maternal Care",
    ],
    image:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8c5f?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 4,
    name: "Dr. Dawit Kebede",
    title: "Senior Lecturer in Business & Corporate Finance",
    department: "Business & Economics",
    email: "d.kebede@dreamland.edu.et",
    office: "Bale Robe Campus, Hall B",
    hours: "Wed & Fri: 1:30 PM - 4:30 PM",
    phone: "+251 22 441 8911",
    bio: "Expert in IFRS accounting standards, banking regulations, and entrepreneurial venture capital financing in developing markets.",
    research: [
      "Corporate Finance",
      "IFRS Standards",
      "Venture Capital",
    ],
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 5,
    name: "Eng. Samuel Mulugeta",
    title: "Coordinator of Electrical & Computer Engineering",
    department: "Engineering",
    email: "s.mulugeta@dreamland.edu.et",
    office: "Engineering Block, Lab 4",
    hours: "Tue & Thu: 2:00 PM - 4:00 PM",
    phone: "+251 11 123 4589",
    bio: "Passionate about renewable micro-grid systems, IoT embedded controllers, and hands-on laboratory training for undergraduate engineers.",
    research: [
      "Renewable Micro-Grids",
      "IoT Systems",
      "Embedded Electronics",
    ],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 6,
    name: "Dr. Tigist Haile",
    title: "Director of Student Academic Advising & Admissions",
    department: "Executive Board",
    email: "t.haile@dreamland.edu.et",
    office: "Main Campus, Registry Building",
    hours: "Mon - Fri: 8:30 AM - 11:30 AM",
    phone: "+251 11 123 4520",
    bio: "Guiding students through academic planning, career counseling, scholarship programs, and cross-campus transfer pathways.",
    research: [
      "Student Retention",
      "Academic Counseling",
      "Pedagogical Support",
    ],
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=85",
  },
];

function Staff() {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBioModal, setActiveBioModal] = useState(null);
  const [activeConsultModal, setActiveConsultModal] = useState(null);
  const [consultSuccess, setConsultSuccess] = useState(false);
  const [savedStaff, setSavedStaff] = useState([]);

  // Consultation form state
  const [consultForm, setConsultForm] = useState({
    student_name: "",
    student_id: "",
    preferred_date: "",
    purpose: "",
  });

  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState("");

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesDept =
      selectedDepartment === "all" ||
      staff.department.toLowerCase() === selectedDepartment.toLowerCase();

    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      staff.name.toLowerCase().includes(query) ||
      staff.title.toLowerCase().includes(query) ||
      staff.office.toLowerCase().includes(query) ||
      staff.department.toLowerCase().includes(query);

    return matchesDept && matchesSearch;
  });

  // Open consultation modal
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

  // Submit consultation to backend
  const handleConsultSubmit = async (e) => {
    e.preventDefault();

    if (!activeConsultModal) return;

    setConsultLoading(true);
    setConsultError("");

    try {
      const payload = {
        // Current staff directory uses local numeric IDs.
        // The backend expects a UUID, so null is sent until
        // actual database staff IDs are connected.
        staff_id: null,

        student_name: consultForm.student_name.trim(),
        student_id: consultForm.student_id.trim() || null,
        preferred_date: consultForm.preferred_date,
        purpose: consultForm.purpose.trim(),
      };

      const response = await api.post(
        "/consultations/submit",
        payload
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Consultation submission failed."
        );
      }

      setConsultSuccess(true);

      setConsultForm({
        student_name: "",
        student_id: "",
        preferred_date: "",
        purpose: "",
      });

      setTimeout(() => {
        setConsultSuccess(false);
        setActiveConsultModal(null);
      }, 2200);
    } catch (error) {
      console.error("Consultation submission error:", error);

      setConsultError(
        error.message ||
          "Unable to submit your consultation. Please try again."
      );
    } finally {
      setConsultLoading(false);
    }
  };

  const toggleBookmark = (staffId, e) => {
    e.stopPropagation();

    setSavedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

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
              Dedicated educators, experienced researchers, and administrative
              leaders committed to guiding your academic journey at Dream Land
              College.
            </p>

            {/* HERO QUICK STATS */}
            <div className="dl-hero-stats-grid">
              <div className="dl-stat-pill">
                <UserCheck size={18} />

                <div>
                  <strong>120+</strong>
                  <span>Qualified Instructors</span>
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
                Filter by department or search by name to book consultations or
                view office hours.
              </p>
            </div>

            {/* DEPARTMENT FILTER TABS */}
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

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedDepartment === "Executive Board" ? "active" : ""
                }`}
                onClick={() => setSelectedDepartment("Executive Board")}
              >
                Executive & Admin
              </button>

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedDepartment === "Computer Science" ? "active" : ""
                }`}
                onClick={() => setSelectedDepartment("Computer Science")}
              >
                Computer Science
              </button>

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedDepartment === "Health Sciences" ? "active" : ""
                }`}
                onClick={() => setSelectedDepartment("Health Sciences")}
              >
                Health Sciences
              </button>

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedDepartment === "Business & Economics" ? "active" : ""
                }`}
                onClick={() =>
                  setSelectedDepartment("Business & Economics")
                }
              >
                Business & Economics
              </button>

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedDepartment === "Engineering" ? "active" : ""
                }`}
                onClick={() => setSelectedDepartment("Engineering")}
              >
                Engineering
              </button>
            </div>

            {/* SEARCH BAR */}
            <div className="dl-lib-search">
              <Search size={18} />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by instructor name, title, department, or office location..."
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

            {/* STAFF CARDS GRID */}
            <div className="dl-staff-grid">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  const isSaved = savedStaff.includes(staff.id);

                  return (
                    <div key={staff.id} className="dl-staff-card">
                      <div className="dl-staff-img-box">
                        <img
                          src={staff.image}
                          alt={staff.name}
                          loading="lazy"
                        />

                        <span className="dl-staff-dept-badge">
                          {staff.department}
                        </span>

                        <button
                          type="button"
                          className={`dl-bookmark-btn dl-staff-bookmark ${
                            isSaved ? "saved" : ""
                          }`}
                          onClick={(e) => toggleBookmark(staff.id, e)}
                          title={
                            isSaved
                              ? "Remove from bookmarks"
                              : "Bookmark advisor"
                          }
                        >
                          <Bookmark
                            size={15}
                            fill={isSaved ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      <div className="dl-staff-body">
                        <h3>{staff.name}</h3>

                        <p className="dl-staff-title">{staff.title}</p>

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
                            onClick={() => setActiveBioModal(staff)}
                          >
                            <BookOpen size={13} />
                            View Bio & Schedule
                          </button>

                          <button
                            type="button"
                            className="dl-btn dl-btn-sm dl-btn-primary"
                            onClick={() => openConsultModal(staff)}
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

                  <h3>No staff members found</h3>

                  <p>
                    No faculty or staff match your current department filter
                    and search query.
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

              <h2>{activeBioModal.name}</h2>

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

                <div className="dl-branch-info-row">
                  <Mail size={16} />
                  <span>{activeBioModal.email}</span>
                </div>

                <div className="dl-branch-info-row">
                  <PhoneCall size={16} />
                  <span>{activeBioModal.phone}</span>
                </div>
              </div>

              <div className="dl-branch-amenities-box">
                <strong>Key Research Interests & Publications:</strong>

                <ul>
                  {activeBioModal.research.map((item, idx) => (
                    <li key={idx}>
                      <CheckCircle2
                        size={13}
                        className="dl-text-green"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

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
          onClick={() => {
            if (!consultLoading) {
              setActiveConsultModal(null);
              setConsultError("");
            }
          }}
        >
          <div
            className="dl-modal-card dl-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={() => {
                if (!consultLoading) {
                  setActiveConsultModal(null);
                  setConsultError("");
                }
              }}
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
                  Your meeting request has been successfully submitted.
                  You will receive further information about your
                  consultation.
                </p>
              </div>
            ) : (
              <div className="dl-modal-content-box">
                <span className="dl-modal-badge">
                  Consultation Booking
                </span>

                <h2>Meet with {activeConsultModal.name}</h2>

                <p className="dl-modal-text">
                  Office Hours: {activeConsultModal.hours} (
                  {activeConsultModal.office})
                </p>

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
                    />
                  </label>

                  <label>
                    Preferred Date *
                    <input
                      required
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={consultForm.preferred_date}
                      onChange={(e) =>
                        setConsultForm({
                          ...consultForm,
                          preferred_date: e.target.value,
                        })
                      }
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
                      role="alert"
                      style={{
                        color: "#dc2626",
                        background: "#fef2f2",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    >
                      {consultError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="dl-btn dl-btn-primary dl-btn-block"
                    disabled={consultLoading}
                  >
                    {consultLoading
                      ? "Submitting..."
                      : "Submit Consultation Request"}
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
