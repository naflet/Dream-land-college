import React, { useState } from "react";
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
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Library.css";

const librariesList = [
  {
    id: "addis-ababa",
    name: "Addis Ababa Main Library",
    location: "Main Campus, Addis Ababa",
    booksCount: "15,000+ Volumes",
    hours: "Mon - Sat: 7:30 AM - 10:00 PM",
    phone: "+251 11 123 4567",
    amenities: [
      "High-speed Wi-Fi",
      "Silent Research Carrels",
      "Digital Archives",
      "Printing Station",
    ],
    description:
      "Our central hub for higher-degree research, digital archives, and quiet study halls equipped with high-speed campus internet.",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "bale",
    name: "Bale Robe Branch Library",
    location: "Bale Robe Regional Campus",
    booksCount: "8,500+ Volumes",
    hours: "Mon - Fri: 8:00 AM - 8:00 PM",
    phone: "+251 22 441 8900",
    amenities: [
      "Agricultural Archives",
      "Group Discussion Rooms",
      "Computer Lab",
    ],
    description:
      "Dedicated collections supporting agriculture, education, business, and local community development programs.",
    image:
      "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "assela",
    name: "Assela Branch Library",
    location: "Assela Regional Campus",
    booksCount: "9,200+ Volumes",
    hours: "Mon - Sat: 8:00 AM - 9:00 PM",
    phone: "+251 23 331 2244",
    amenities: [
      "Medical Reference Section",
      "TVET Technical Modules",
      "Quiet Reading Lounge",
    ],
    description:
      "Specialized study resources geared toward health sciences, nursing, and TVET technical modules.",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=85",
  },
];

const catalogItems = [
  {
    id: 1,
    title: "Advanced Financial Accounting & Reporting Principles",
    category: "Business & Economics",
    campus: "Addis Ababa Main Library",
    format: "Hardcover & PDF",
    status: "Available",
    isbn: "978-0-13-485600-1",
    description:
      "Comprehensive guide covering International Financial Reporting Standards (IFRS), corporate financial statements, and auditing procedures.",
  },
  {
    id: 2,
    title: "Fundamentals of Nursing & Patient Care Practice",
    category: "Health Sciences",
    campus: "Assela Branch Library",
    format: "Reference Copy",
    status: "Available",
    isbn: "978-1-49-635118-9",
    description:
      "Essential clinical skills manual for nursing students, covering patient assessment, vital signs monitoring, and safety standards.",
  },
  {
    id: 3,
    title: "Software Engineering & Distributed System Architecture",
    category: "Computing & IT",
    campus: "Addis Ababa Main Library",
    format: "Digital Portal Access",
    status: "Online Available",
    isbn: "978-0-32-112521-7",
    description:
      "Modern design patterns, microservices architecture, version control workflows, and scalable database management systems.",
  },
  {
    id: 4,
    title: "Agricultural Economics & Crop Production Systems in East Africa",
    category: "Agriculture & Development",
    campus: "Bale Robe Branch Library",
    format: "Physical Copy",
    status: "Checked Out",
    isbn: "978-9-99-440123-4",
    description:
      "Regional research papers and agrarian studies focusing on sustainable crop yield, soil management, and rural economics.",
  },
  {
    id: 5,
    title: "Educational Psychology & Modern Pedagogical Methods",
    category: "Education & Training",
    campus: "Bale Robe Branch Library",
    format: "Hardcover",
    status: "Available",
    isbn: "978-0-07-337380-5",
    description:
      "Theories of cognitive development, motivational strategies, and inclusive classroom management for aspiring educators.",
  },
  {
    id: 6,
    title: "Constitutional Law & Ethiopian Legal Frameworks",
    category: "Law & Public Policy",
    campus: "Addis Ababa Main Library",
    format: "Physical & Digital",
    status: "Available",
    isbn: "978-9-99-882109-2",
    description:
      "In-depth study of federal state structures, human rights legislation, administrative law, and judicial review procedures.",
  },
];

function Library() {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBookModal, setActiveBookModal] = useState(null);
  const [activeBranchModal, setActiveBranchModal] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [savedBooks, setSavedBooks] = useState([]);

  const filteredCatalog = catalogItems.filter((item) => {
    const matchesBranch =
      selectedBranch === "all" ||
      item.campus
        .toLowerCase()
        .includes(selectedBranch.replace("-", " "));

    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.isbn.toLowerCase().includes(query);

    return matchesBranch && matchesSearch;
  });

  const handleReserveBook = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveBookModal(null);
    }, 2200);
  };

  const toggleBookmark = (bookId, e) => {
    e.stopPropagation();
    setSavedBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleBranchCardClick = (branchId) => {
    setSelectedBranch(branchId);
    const catalogElem = document.getElementById("dl-catalog-section-anchor");
    if (catalogElem) {
      catalogElem.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleHoursInfoClick = (e, branch) => {
    e.stopPropagation();
    setActiveBranchModal(branch);
  };

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}
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
              Explore our comprehensive physical book collections, digital
              research archives, study spaces, and academic journals across
              all regional campus branches.
            </p>

            <div className="dl-hero-stats-grid">
              <div className="dl-stat-pill">
                <BookOpen size={18} />
                <div>
                  <strong>32,700+</strong>
                  <span>Total Volumes</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Building2 size={18} />
                <div>
                  <strong>3 Campuses</strong>
                  <span>Connected Branches</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Sparkles size={18} />
                <div>
                  <strong>24/7</strong>
                  <span>Digital Repository</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BRANCHES SECTION */}
        <section className="dl-library-branches-section">
          <div className="dl-shell">
            <div className="dl-section-heading">
              <span className="dl-section-badge">
                <Building2 size={14} />
                Campus Facilities & Filtering
              </span>

              <h2>Explore Our Regional Library Branches</h2>

              <p>
                Click any campus card below to instantly filter catalog books
                or view operating schedules.
              </p>
            </div>

            <div className="dl-branches-grid">
              {librariesList.map((lib) => {
                const isSelected = selectedBranch === lib.id;

                return (
                  <div
                    key={lib.id}
                    className={`dl-branch-card ${
                      isSelected ? "dl-branch-card-active" : ""
                    }`}
                    onClick={() => handleBranchCardClick(lib.id)}
                  >
                    <div className="dl-branch-img">
                      <img
                        src={lib.image}
                        alt={lib.name}
                        loading="lazy"
                      />

                      <span className="dl-branch-badge-vol">
                        {lib.booksCount}
                      </span>

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
                        {lib.location}
                      </p>

                      <p>{lib.description}</p>

                      <div className="dl-branch-card-actions">
                        <button
                          type="button"
                          className="dl-btn dl-btn-sm dl-btn-outline"
                          onClick={(e) => handleHoursInfoClick(e, lib)}
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
          </div>
        </section>

        {/* CATALOG SECTION */}
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
                Find available textbooks, reference guides, and course
                materials across our branches.
              </p>
            </div>

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

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedBranch === "addis-ababa" ? "active" : ""
                }`}
                onClick={() => setSelectedBranch("addis-ababa")}
              >
                Addis Ababa Main
              </button>

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedBranch === "bale" ? "active" : ""
                }`}
                onClick={() => setSelectedBranch("bale")}
              >
                Bale Robe
              </button>

              <button
                type="button"
                className={`dl-lib-tab ${
                  selectedBranch === "assela" ? "active" : ""
                }`}
                onClick={() => setSelectedBranch("assela")}
              >
                Assela
              </button>
            </div>

            <div className="dl-lib-search">
              <Search size={18} />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title, subject category, ISBN, or keywords..."
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

            <div className="dl-catalog-grid">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map((book) => {
                  const isBookSaved = savedBooks.includes(book.id);

                  return (
                    <div key={book.id} className="dl-catalog-card">
                      <div className="dl-catalog-top">
                        <span className="dl-catalog-cat">{book.category}</span>

                        <div className="dl-catalog-top-right">
                          <span
                            className={`dl-catalog-status ${
                              book.status === "Available" ||
                              book.status === "Online Available"
                                ? "available"
                                : "checked-out"
                            }`}
                          >
                            {book.status}
                          </span>

                          <button
                            type="button"
                            className={`dl-bookmark-btn ${
                              isBookSaved ? "saved" : ""
                            }`}
                            onClick={(e) => toggleBookmark(book.id, e)}
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
                              fill={isBookSaved ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>

                      <h3>{book.title}</h3>

                      <p className="dl-catalog-desc">{book.description}</p>

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
                          onClick={() => setActiveBookModal(book)}
                        >
                          <Bookmark size={14} />
                          Reserve / View
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="dl-lib-empty dl-fade-in">
                  <Search size={36} />

                  <h3>No library materials found</h3>

                  <p>
                    No books match your current branch filter and search
                    query combination.
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
              )}
            </div>
          </div>
        </section>
      </main>

      {/* BOOK RESERVATION MODAL */}
      {activeBookModal && (
        <div
          className="dl-modal-overlay"
          onClick={() => setActiveBookModal(null)}
        >
          <div
            className="dl-modal-card dl-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={() => setActiveBookModal(null)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {bookingSuccess ? (
              <div className="dl-modal-success dl-fade-in">
                <CheckCircle2 size={60} className="dl-success-icon" />

                <h3>Reservation Confirmed!</h3>

                <p>
                  You have successfully requested{" "}
                  <strong>{activeBookModal.title}</strong>. Please pick it up at
                  the {activeBookModal.campus} front desk within 48 hours using
                  your student ID.
                </p>
              </div>
            ) : (
              <div className="dl-modal-content-box">
                <span className="dl-modal-badge">{activeBookModal.category}</span>

                <h2>{activeBookModal.title}</h2>

                <p className="dl-modal-text">{activeBookModal.description}</p>

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
                    <span className="dl-text-green">
                      {activeBookModal.status}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleReserveBook} className="dl-modal-form">
                  <label>
                    Enter Student ID Number *
                    <input
                      required
                      type="text"
                      placeholder="e.g., DLC/2049/23"
                    />
                  </label>

                  <button
                    type="submit"
                    className="dl-btn dl-btn-primary dl-btn-block"
                  >
                    Confirm Reservation Request
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BRANCH INFORMATION MODAL */}
      {activeBranchModal && (
        <div
          className="dl-modal-overlay"
          onClick={() => setActiveBranchModal(null)}
        >
          <div
            className="dl-modal-card dl-fade-in"
            onClick={(e) => e.stopPropagation()}
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
              <span className="dl-modal-badge">Branch Information</span>

              <h2>{activeBranchModal.name}</h2>

              <p className="dl-modal-text">{activeBranchModal.description}</p>

              <div className="dl-branch-info-list">
                <div className="dl-branch-info-row">
                  <MapPin size={16} />
                  <span>{activeBranchModal.location}</span>
                </div>

                <div className="dl-branch-info-row">
                  <Clock size={16} />
                  <span>{activeBranchModal.hours}</span>
                </div>

                <div className="dl-branch-info-row">
                  <Phone size={16} />
                  <span>{activeBranchModal.phone}</span>
                </div>
              </div>

              <div className="dl-branch-amenities-box">
                <strong>Campus Amenities & Facilities:</strong>

                <ul>
                  {activeBranchModal.amenities.map((amenity, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={13} className="dl-text-green" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="dl-btn dl-btn-primary dl-btn-block"
                onClick={() => {
                  handleBranchCardClick(activeBranchModal.id);
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