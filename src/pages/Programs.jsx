
import React, { useState } from "react";
import { Link } from "react-router-dom";

import {
  BookOpen,
  GraduationCap,
  Award,
  Clock,
  CheckCircle2,
  ChevronDown,
  Search,
  Filter,
  Sparkles,
  Layers,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Programs.css";

const programCategories = [
  "All",
  "Degree Programs",
  "TVET Level 1 - 4",
];

const allProgramsData = [
  {
    id: "deg-accounting",
    title: "B.A. in Accounting & Finance",
    category: "Degree Programs",
    duration: "3 Years",
    credits: "124 ECTS",
    badge: "Degree",
    description:
      "Equips students with rigorous foundations in financial reporting, corporate auditing, taxation, and computerized accounting systems.",
    highlights: [
      "Auditing and taxation modules",
      "Computerized accounting training",
      "Corporate finance projects",
    ],
    careers: [
      "Financial Auditor",
      "Tax Consultant",
      "Corporate Accountant",
    ],
  },
  {
    id: "deg-business",
    title: "B.A. in Business Management",
    category: "Degree Programs",
    duration: "3 Years",
    credits: "120 ECTS",
    badge: "Degree",
    description:
      "Focuses on strategic planning, organizational behavior, marketing principles, and operational leadership for modern enterprises.",
    highlights: [
      "Strategic planning case studies",
      "Entrepreneurship labs",
      "Leadership workshops",
    ],
    careers: [
      "Business Manager",
      "Operations Supervisor",
      "Project Coordinator",
    ],
  },
  {
    id: "deg-management",
    title: "B.A. in Management",
    category: "Degree Programs",
    duration: "3 Years",
    credits: "120 ECTS",
    badge: "Degree",
    description:
      "Develops core administrative skills, resource management techniques, and institutional leadership capabilities.",
    highlights: [
      "Resource management training",
      "Institutional governance studies",
      "Practical internship",
    ],
    careers: [
      "Administrative Manager",
      "Operations Manager",
      "Consultant",
    ],
  },
  {
    id: "tvet-accounting",
    title: "Accounting & Finance (TVET Level 1 - 4)",
    category: "TVET Level 1 - 4",
    duration: "2 Years",
    credits: "Level 1 - 4 Certification",
    badge: "TVET Program",
    description:
      "Practical vocational training covering bookkeeping, payroll handling, source document recording, and basic financial statement preparation.",
    highlights: [
      "Hands-on bookkeeping practice",
      "Payroll system mastery",
      "Competency-based assessment",
    ],
    careers: [
      "Junior Accountant",
      "Cashier",
      "Payroll Clerk",
    ],
  },
  {
    id: "tvet-marketing",
    title: "Marketing & Sales Management (TVET Level 1 - 4)",
    category: "TVET Level 1 - 4",
    duration: "2 Years",
    credits: "Level 1 - 4 Certification",
    badge: "TVET Program",
    description:
      "Teaches retail operations, customer service excellence, sales techniques, and market promotion strategies.",
    highlights: [
      "Sales pitching simulations",
      "Customer relationship management",
      "Retail execution practice",
    ],
    careers: [
      "Sales Representative",
      "Marketing Assistant",
      "Retail Supervisor",
    ],
  },
  {
    id: "tvet-hr",
    title: "Human Resource Management (TVET Level 1 - 4)",
    category: "TVET Level 1 - 4",
    duration: "2 Years",
    credits: "Level 1 - 4 Certification",
    badge: "TVET Program",
    description:
      "Covers personnel recruitment, employee record maintenance, labor law compliance, and workplace communication.",
    highlights: [
      "HR administration workflows",
      "Personnel filing and records",
      "Labor relations orientation",
    ],
    careers: [
      "HR Assistant",
      "Personnel Clerk",
      "Recruitment Coordinator",
    ],
  },
  {
    id: "tvet-secretarial",
    title: "Secretarial & Office Administration (TVET Level 1 - 4)",
    category: "TVET Level 1 - 4",
    duration: "2 Years",
    credits: "Level 1 - 4 Certification",
    badge: "TVET Program",
    description:
      "Trains students in professional office procedures, document formatting, database management, and executive support.",
    highlights: [
      "Advanced typing & formatting",
      "Office equipment operation",
      "Professional correspondence",
    ],
    careers: [
      "Executive Secretary",
      "Office Administrator",
      "Receptionist",
    ],
  },
  {
    id: "tvet-ict",
    title: "Information Technology (ICT) (TVET Level 1 - 4)",
    category: "TVET Level 1 - 4",
    duration: "2 Years",
    credits: "Level 1 - 4 Certification",
    badge: "TVET Program",
    description:
      "Provides foundational technical training in computer hardware maintenance, networking basics, operating systems, and application software.",
    highlights: [
      "PC troubleshooting labs",
      "Network setup practice",
      "Software installation support",
    ],
    careers: [
      "IT Support Technician",
      "Computer Maintenance Specialist",
      "Data Entry Operator",
    ],
  },
];

function Programs() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(
    allProgramsData[0].id
  );

  const filteredPrograms = allProgramsData.filter((prog) => {
    const matchesCategory =
      selectedCategory === "All" ||
      prog.category === selectedCategory;

    const matchesSearch =
      prog.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      prog.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* ==========================================================
            HERO SECTION
        ========================================================== */}
        <section className="dl-page-hero dl-programs-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                Academic Excellence
              </span>
            </div>

            <h1>Explore Our Degree & TVET Programs</h1>

            <p>
              Discover industry-aligned curricula designed for
              Regular, Extension, and Distance delivery modalities
              across our campuses.
            </p>

            {/* HERO STATS PILLS */}
            <div className="dl-hero-stats-grid">
              <div className="dl-stat-pill">
                <GraduationCap size={18} />

                <div>
                  <strong>Degree & TVET</strong>
                  <span>Levels 1 - 4</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Award size={18} />

                <div>
                  <strong>Flexible Modalities</strong>
                  <span>Regular, Extension & Distance</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Sparkles size={18} />

                <div>
                  <strong>Accredited</strong>
                  <span>Quality Assured</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            SEARCH & FILTER SECTION
        ========================================================== */}
        <section className="dl-programs-filter-section">
          <div className="dl-shell">
            <div className="dl-programs-controls">
              {/* SEARCH BAR */}
              <div className="dl-search-box">
                <Search size={18} />

                <input
                  type="text"
                  placeholder="Search programs by title or keyword..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                />
              </div>

              {/* CATEGORY TABS */}
              <div className="dl-lib-tabs">
                {programCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`dl-lib-tab ${
                      selectedCategory === cat ? "active" : ""
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <Filter
                      size={13}
                      style={{
                        display: "inline",
                        marginRight: 5,
                      }}
                    />

                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* PROGRAMS ACCORDION / GRID LIST */}
            <div className="dl-programs-list">
              {filteredPrograms.length === 0 ? (
                <div className="dl-empty-state dl-fade-in">
                  <BookOpen size={48} />

                  <h3>No Programs Found</h3>

                  <p>
                    Try searching for a different keyword or
                    clearing your filter selection.
                  </p>
                </div>
              ) : (
                filteredPrograms.map((prog) => {
                  const isOpen = expandedId === prog.id;

                  return (
                    <div
                      key={prog.id}
                      className={`dl-program-card dl-fade-in ${
                        isOpen ? "open" : ""
                      }`}
                    >
                      <div
                        className="dl-program-card-header"
                        onClick={() =>
                          toggleAccordion(prog.id)
                        }
                      >
                        <div className="dl-program-header-left">
                          <span className="dl-modal-badge">
                            {prog.badge}
                          </span>

                          <h3>{prog.title}</h3>

                          <div className="dl-program-meta-pills">
                            <span>
                              <Layers size={13} />
                              {prog.category}
                            </span>

                            <span>
                              <Clock size={13} />
                              {prog.duration}
                            </span>

                            <span>
                              <BookOpen size={13} />
                              {prog.credits}
                            </span>
                          </div>
                        </div>

                        <div className="dl-program-chevron-box">
                          <ChevronDown
                            size={20}
                            className={`dl-faq-chevron ${
                              isOpen ? "rotated" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {isOpen && (
                        <div className="dl-program-card-body dl-fade-in">
                          <p className="dl-program-desc">
                            {prog.description}
                          </p>

                          <div className="dl-program-details-grid">
                            <div className="dl-program-sub-box">
                              <h4>Program Highlights</h4>

                              <ul>
                                {prog.highlights.map(
                                  (item, idx) => (
                                    <li key={idx}>
                                      <CheckCircle2
                                        size={15}
                                        className="dl-text-green"
                                      />

                                      <span>{item}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>

                            <div className="dl-program-sub-box">
                              <h4>Career Opportunities</h4>

                              <div className="dl-career-tags">
                                {prog.careers.map(
                                  (career, idx) => (
                                    <span
                                      key={idx}
                                      className="dl-career-tag"
                                    >
                                      {career}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="dl-program-footer-actions">
                            <Link
                              to="/contact"
                              className="dl-btn dl-btn-primary"
                            >
                              Apply or Inquire Now
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Programs;
