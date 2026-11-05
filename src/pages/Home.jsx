
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Library,
  LogIn,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  X,
  Sparkles,
  BellRing,
  Info,
  ExternalLink,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import Accreditation from "../components/Accreditation";

import programs from "../data/programs";
import publicApi from "../services/publicApi";

import "../styles/global.css";
import "../styles/home.css";

const campusCards = [
  {
    name: "Addis Ababa",
    location: "Addis Ababa",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1000&q=85",
    description:
      "A central learning environment supporting students across Dream Land College programs.",
    highlights: ["State-of-the-art ICT Labs", "Modern Library", "Central Administration"],
  },
  {
    name: "Asella",
    location: "Asella",
    image:
      "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1000&q=85",
    description:
      "A welcoming campus focused on accessible learning, practical skills and student development.",
    highlights: ["TVET Workshops", "Student Residence", "Community Clinic"],
  },
  {
    name: "Bale",
    location: "Bale",
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1000&q=85",
    description:
      "A growing learning community connecting students with academic and professional opportunities.",
    highlights: ["Agricultural Hub", "Research Center", "Digital Hub"],
  },
];

const quickActions = [
  {
    title: "Online Admissions",
    description: "Start your application online",
    icon: GraduationCap,
    to: "/application",
  },
  {
    title: "Course Catalog",
    description: "Explore available programs",
    icon: BookOpen,
    to: "/programs",
  },
  {
    title: "Academic Calendar",
    description: "View important academic dates",
    icon: CalendarDays,
    to: "#calendar",
  },
  {
    title: "E-Library Hub",
    description: "Access learning resources",
    icon: Library,
    to: "/library",
  },
];

function Home() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [portalOpen, setPortalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  // Academic Calendar state
  const [calendarItems, setCalendarItems] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // News & Updates state
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Fetch published Academic Calendar events
  useEffect(() => {
    let isMounted = true;

    const fetchCalendarEvents = async () => {
      try {
        setCalendarLoading(true);

        const response = await publicApi.get("/academic-calendar");

        if (isMounted && response?.success) {
          setCalendarItems(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (error) {
        console.error("Failed to load academic calendar:", error);

        if (isMounted) {
          setCalendarItems([]);
        }
      } finally {
        if (isMounted) {
          setCalendarLoading(false);
        }
      }
    };

    fetchCalendarEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch latest published News & Updates
  useEffect(() => {
    let isMounted = true;

    const fetchNews = async () => {
      try {
        setNewsLoading(true);

        const response = await publicApi.get("/news/published");

        if (isMounted && response?.success) {
          const publishedNews = Array.isArray(response.news)
            ? response.news
            : Array.isArray(response.data)
              ? response.data
              : [];

          setNewsItems(publishedNews.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load news:", error);

        if (isMounted) {
          setNewsItems([]);
        }
      } finally {
        if (isMounted) {
          setNewsLoading(false);
        }
      }
    };

    fetchNews();

    return () => {
      isMounted = false;
    };
  }, []);

  // Student Portal event listener
  useEffect(() => {
    const openPortal = () => {
      setPortalOpen(true);
    };

    window.addEventListener("open-dl-portal", openPortal);

    return () => {
      window.removeEventListener("open-dl-portal", openPortal);
    };
  }, []);

  const categories = [
    "All",
    "Degree Programs",
    "TVET Level 1–4",
    "Short Term Trainings",
  ];

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return programs.filter((program) => {
      const categoryMatch =
        activeCategory === "All" ||
        program.category === activeCategory;

      const searchMatch =
        !normalizedSearch ||
        program.title.toLowerCase().includes(normalizedSearch) ||
        program.description.toLowerCase().includes(normalizedSearch);

      return categoryMatch && searchMatch;
    });
  }, [activeCategory, searchTerm]);

  const featuredPrograms = filteredPrograms.slice(0, 6);

  const handleHeroSearch = (event) => {
    event.preventDefault();

    const element = document.getElementById("programs");

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleQuickAction = (to) => {
    if (to.startsWith("#")) {
      const id = to.substring(1);
      const element = document.getElementById(id);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  // Format database event date for Academic Calendar
  const formatCalendarDate = (eventDate) => {
    if (!eventDate) {
      return { date: "", month: "" };
    }

    const dateParts = String(eventDate)
      .split("T")[0]
      .split("-");

    if (dateParts.length !== 3) {
      return { date: "", month: "" };
    }

    const [year, month, day] = dateParts;

    const monthName = new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleString("en", { month: "short" });

    return {
      date: day,
      month: monthName.toUpperCase(),
    };
  };

  // Format news publication date
  const formatNewsDate = (publishedDate) => {
    if (!publishedDate) {
      return "";
    }

    const date = new Date(publishedDate);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date
      .toLocaleDateString("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  };

  return (
    <div className="dl-home-page">
      <Navbar />

      {/* =====================================================
          ANNOUNCEMENT BAR / TICKER
      ====================================================== */}
      {announcementVisible && (
        <div className="dl-announcement-bar">
          <div className="dl-shell dl-announcement-flex">
            <div className="dl-announcement-left">
              <span className="dl-badge-pulse">
                <BellRing size={14} />
              </span>

              <span>
                <strong>Admissions Open for 2026/27 Academic Year!</strong>{" "}
                Apply online early to secure your spot.
              </span>
            </div>

            <div className="dl-announcement-right">
              <Link to="/application" className="dl-announcement-cta">
                Apply Now <ArrowRight size={13} />
              </Link>

              <button
                type="button"
                className="dl-announcement-close"
                onClick={() => setAnnouncementVisible(false)}
                aria-label="Close announcement"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* =====================================================
            HERO SECTION
        ====================================================== */}
        <section className="dl-home-hero">
          <div className="dl-home-hero-overlay" />

          <div className="dl-shell dl-home-hero-shell">
            <div className="dl-home-hero-content">
              <span className="dl-home-hero-badge">
                <span className="dl-home-badge-dot" />
                <Sparkles size={14} style={{ marginRight: "6px" }} />
                DREAM LAND COLLEGE
              </span>

              <h1>
                Learn Today.
                <br />
                <span>Build Tomorrow.</span>
              </h1>

              <p>
                Discover quality education, practical skills and
                opportunities designed to help you build a stronger
                future at Dream Land College.
              </p>

              <form
                className="dl-hero-search"
                onSubmit={handleHeroSearch}
              >
                <Search size={20} />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search programs, courses or training..."
                  aria-label="Search programs"
                />

                <button type="submit">Search</button>
              </form>

              <div className="dl-popular-searches">
                <span>Popular:</span>

                {["Accounting", "Management", "Marketing"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchTerm(item);

                      document
                        .getElementById("programs")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="dl-hero-stats">
                <div>
                  <strong>3</strong>
                  <span>Campuses</span>
                </div>

                <div>
                  <strong>13+</strong>
                  <span>Programs & Training</span>
                </div>

                <div>
                  <strong>1</strong>
                  <span>Learning Community</span>
                </div>

                <div>
                  <strong>100%</strong>
                  <span>Student Focus</span>
                </div>
              </div>
            </div>

            {/* =================================================
                STUDENT PORTAL CARD
            ================================================== */}
            <div className="dl-portal-card">
              <div className="dl-portal-card-top">
                <div className="dl-portal-icon">
                  <ShieldCheck size={24} />
                </div>

                <div>
                  <span>STUDENT PORTAL</span>
                  <h3>Welcome Back</h3>
                </div>
              </div>

              <p>
                Access your student experience, learning resources
                and academic information from one place.
              </p>

              <div className="dl-portal-features">
                <div>
                  <CheckCircle2 size={17} />
                  <span>Academic information</span>
                </div>

                <div>
                  <CheckCircle2 size={17} />
                  <span>Learning resources</span>
                </div>

                <div>
                  <CheckCircle2 size={17} />
                  <span>Student activities</span>
                </div>
              </div>

              <button
                type="button"
                className="dl-btn dl-btn-primary dl-btn-block"
                onClick={() => setPortalOpen(true)}
              >
                <LogIn size={17} />
                Login to Student Portal
              </button>

              <Link to="/contact" className="dl-portal-help">
                Need help accessing your account?
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}
        <section className="dl-quick-actions">
          <div className="dl-shell dl-quick-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;

              if (action.to.startsWith("#")) {
                return (
                  <button
                    type="button"
                    key={action.title}
                    className="dl-quick-action"
                    onClick={() => handleQuickAction(action.to)}
                  >
                    <span className="dl-quick-icon">
                      <Icon size={22} />
                    </span>

                    <span className="dl-quick-copy">
                      <strong>{action.title}</strong>
                      <small>{action.description}</small>
                    </span>

                    <ChevronRight size={18} />
                  </button>
                );
              }

              return (
                <Link
                  to={action.to}
                  key={action.title}
                  className="dl-quick-action"
                >
                  <span className="dl-quick-icon">
                    <Icon size={22} />
                  </span>

                  <span className="dl-quick-copy">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>

                  <ChevronRight size={18} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            PROGRAMS SECTION
        ====================================================== */}
        <section
          className="dl-section dl-program-section"
          id="programs"
        >
          <div className="dl-shell">
            <div className="dl-program-heading">
              <div className="dl-section-head">
                <span className="dl-section-label">
                  Academic Excellence
                </span>

                <h2 className="dl-section-title">
                  Explore Our Programs
                </h2>

                <p className="dl-section-description">
                  Choose from Dream Land College degree programs,
                  TVET qualifications and short-term professional
                  trainings.
                </p>
              </div>

              <Link to="/programs" className="dl-view-all-link">
                View all programs
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="dl-program-toolbar">
              <div className="dl-filter-row">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`dl-filter-btn ${
                      activeCategory === category ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="dl-program-small-search">
                <Search size={17} />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search programs"
                />
              </div>
            </div>

            {featuredPrograms.length > 0 ? (
              <div className="dl-program-grid">
                {featuredPrograms.map((program) => (
                  <div
                    className="dl-program-card"
                    key={program.id}
                  >
                    <div className="dl-program-image">
                      <img
                        src={program.image}
                        alt={program.title}
                        loading="lazy"
                      />

                      <span className="dl-program-level">
                        {program.level}
                      </span>
                    </div>

                    <div className="dl-program-body">
                      <span className="dl-home-program-category">
                        {program.category}
                      </span>

                      <h3>{program.title}</h3>

                      <p>{program.description}</p>

                      <div className="dl-program-meta">
                        <span className="dl-meta-item">
                          <Clock3 size={14} />
                          {program.duration}
                        </span>

                        <span className="dl-meta-item">
                          <GraduationCap size={14} />
                          {program.level}
                        </span>
                      </div>

                      <div className="dl-program-card-actions">
                        <button
                          type="button"
                          className="dl-btn-quick-view"
                          onClick={() => setSelectedProgram(program)}
                        >
                          <Info size={14} /> Quick Preview
                        </button>

                        <Link
                          to={`/programs/${program.id}`}
                          className="dl-card-link"
                        >
                          Full details
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dl-empty">
                <Search size={28} />

                <h3>No programs found</h3>

                <p>
                  Try another search term or choose a different
                  category.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            ADMISSIONS
        ====================================================== */}
        <section className="dl-admissions-home">
          <div className="dl-shell">
            <div className="dl-admissions-grid">
              <div className="dl-admissions-copy">
                <span className="dl-section-label">
                  Simple Admission Process
                </span>

                <h2>
                  Your next chapter
                  <br />
                  starts here.
                </h2>

                <p>
                  We make it easy to discover a program, choose
                  your campus and begin your application.
                </p>

                <Link
                  to="/application"
                  className="dl-btn dl-btn-primary"
                >
                  Start Application
                  <ArrowRight size={17} />
                </Link>
              </div>

              <div className="dl-admission-steps">
                <div className="dl-admission-step">
                  <span>01</span>

                  <div>
                    <h3>Explore programs</h3>

                    <p>
                      Find the degree, TVET or short-term training
                      that matches your goals.
                    </p>
                  </div>
                </div>

                <div className="dl-admission-step">
                  <span>02</span>

                  <div>
                    <h3>Choose your path</h3>

                    <p>
                      Select your preferred campus and study
                      direction.
                    </p>
                  </div>
                </div>

                <div className="dl-admission-step">
                  <span>03</span>

                  <div>
                    <h3>Prepare information</h3>

                    <p>
                      Get your application information ready before
                      submitting.
                    </p>
                  </div>
                </div>

                <div className="dl-admission-step">
                  <span>04</span>

                  <div>
                    <h3>Submit application</h3>

                    <p>
                      Complete the online application and move
                      forward with your education.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            CAMPUSES
        ====================================================== */}
        <section className="dl-section dl-campus-section">
          <div className="dl-shell">
            <div className="dl-section-head dl-centered-head">
              <span className="dl-section-label">
                Our Campuses
              </span>

              <h2 className="dl-section-title">
                Learn across Dream Land College
              </h2>

              <p className="dl-section-description">
                Explore our three campus locations and find the
                learning environment that fits your journey.
              </p>
            </div>

            <div className="dl-campus-grid">
              {campusCards.map((campus) => (
                <div
                  className="dl-campus-card"
                  key={campus.name}
                >
                  <img
                    src={campus.image}
                    alt={`${campus.name} campus`}
                    loading="lazy"
                  />

                  <div className="dl-campus-overlay" />

                  <div className="dl-campus-content">
                    <span>
                      <MapPin size={14} />
                      {campus.location}
                    </span>

                    <h3>{campus.name}</h3>

                    <p>{campus.description}</p>

                    <div className="dl-campus-highlights">
                      {campus.highlights.map((h, idx) => (
                        <span key={idx} className="dl-highlight-chip">
                          {h}
                        </span>
                      ))}
                    </div>

                    <Link to="/campuses" className="dl-campus-link-btn">
                      Explore campus
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            ACADEMIC CALENDAR
        ====================================================== */}
        <section
          className="dl-calendar-section"
          id="calendar"
        >
          <div className="dl-shell">
            <div className="dl-calendar-heading">
              <div>
                <span className="dl-section-label">
                  Stay Organized
                </span>

                <h2 className="dl-section-title">
                  Academic Calendar
                </h2>

                <p className="dl-section-description">
                  Keep track of important academic activities and
                  upcoming dates.
                </p>
              </div>

              <CalendarDays size={45} />
            </div>

            <div className="dl-calendar-grid">
              {calendarLoading ? (
                <div className="dl-calendar-empty">
                  <p>Loading academic calendar...</p>
                </div>
              ) : calendarItems.length > 0 ? (
                calendarItems.map((item) => {
                  const formattedDate = formatCalendarDate(
                    item.event_date
                  );

                  return (
                    <div
                      className="dl-calendar-card"
                      key={item.id}
                    >
                      <div className="dl-calendar-date">
                        <strong>{formattedDate.date}</strong>
                        <span>{formattedDate.month}</span>
                      </div>

                      <div>
                        <h3>{item.title}</h3>

                        <p>
                          {item.description || "Academic calendar event."}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="dl-calendar-empty">
                  <p>
                    No academic calendar events are currently available.
                    Please check back later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            NEWS & EVENTS
        ====================================================== */}
        <section className="dl-section dl-news-home">
          <div className="dl-shell">
            <div className="dl-program-heading">
              <div className="dl-section-head">
                <span className="dl-section-label">
                  News & Events
                </span>

                <h2 className="dl-section-title">
                  What's happening at Dream Land
                </h2>

                <p className="dl-section-description">
                  Follow important college updates, activities and
                  academic information.
                </p>
              </div>

              <Link to="/news" className="dl-view-all-link">
                View all news
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="dl-news-grid">
              {newsLoading ? (
                <div className="dl-news-empty">
                  <p>Loading latest news and updates...</p>
                </div>
              ) : newsItems.length > 0 ? (
                newsItems.map((item) => (
                  <Link
                    to={`/news/${item.slug}`}
                    className="dl-news-card"
                    key={item.id}
                  >
                    <div className="dl-news-image">
                      {(item.image || item.image_url) && (
                        <img
                          src={item.image || item.image_url}
                          alt={item.title}
                          loading="lazy"
                        />
                      )}

                      <span>{item.category || "NEWS"}</span>
                    </div>

                    <div className="dl-news-body">
                      <div className="dl-news-date">
                        <CalendarDays size={14} />
                        {formatNewsDate(
                          item.published_at || item.created_at
                        )}
                      </div>

                      <h3>{item.title}</h3>

                      <p>{item.excerpt || item.description || ""}</p>

                      <strong>
                        Read more
                        <ArrowRight size={15} />
                      </strong>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="dl-news-empty">
                  <p>
                    No news and updates are currently available.
                    Please check back later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            TESTIMONIALS & ACCREDITATION
        ====================================================== */}
        <Testimonials />
        <Accreditation />

        {/* =====================================================
            FINAL CTA
        ====================================================== */}
        <section className="dl-home-final-cta">
          <div className="dl-shell">
            <div className="dl-home-final-card">
              <div>
                <span>READY TO START?</span>

                <h2>
                  Build your future
                  <br />
                  with Dream Land College.
                </h2>

                <p>
                  Explore programs, choose your campus and take the
                  first step toward your goals.
                </p>
              </div>

              <div className="dl-home-final-actions">
                <Link
                  to="/application"
                  className="dl-btn dl-btn-primary"
                >
                  Apply Online
                  <ArrowUpRight size={17} />
                </Link>

                <Link
                  to="/programs"
                  className="dl-btn dl-btn-white"
                >
                  Explore Programs
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* =======================================================
          QUICK VIEW PROGRAM MODAL
      ======================================================= */}
      {selectedProgram && (
        <div
          className="dl-modal-backdrop"
          onClick={() => setSelectedProgram(null)}
        >
          <div
            className="dl-modal dl-program-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={() => setSelectedProgram(null)}
            >
              <X size={20} />
            </button>

            <div className="dl-modal-header">
              <span className="dl-modal-tag">
                {selectedProgram.category}
              </span>

              <h2>{selectedProgram.title}</h2>
            </div>

            <div className="dl-modal-body">
              <img
                src={selectedProgram.image}
                alt={selectedProgram.title}
                className="dl-modal-img"
              />

              <p>{selectedProgram.description}</p>

              <div className="dl-modal-stats-grid">
                <div>
                  <small>Duration</small>
                  <strong>{selectedProgram.duration}</strong>
                </div>

                <div>
                  <small>Level / Award</small>
                  <strong>{selectedProgram.level}</strong>
                </div>
              </div>
            </div>

            <div className="dl-modal-footer">
              <button
                type="button"
                className="dl-btn dl-btn-white"
                onClick={() => setSelectedProgram(null)}
              >
                Close
              </button>

              <Link
                to={`/programs/${selectedProgram.id}`}
                className="dl-btn dl-btn-primary"
                onClick={() => setSelectedProgram(null)}
              >
                View Full Details <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          STUDENT PORTAL MODAL
      ======================================================= */}
      {portalOpen && (
        <div
          className="dl-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPortalOpen(false);
            }
          }}
        >
          <div
            className="dl-modal dl-portal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-title"
          >
            <button
              type="button"
              className="dl-modal-close"
              onClick={() => setPortalOpen(false)}
              aria-label="Close student portal"
            >
              <X size={20} />
            </button>

            <div className="dl-portal-modal-header">
              <div className="dl-portal-modal-icon">
                <ShieldCheck size={28} />
              </div>

              <span>STUDENT PORTAL</span>

              <h2 id="portal-title">
                Your academic experience,
                <br />
                in one place.
              </h2>

              <p>
                Student portal access is available for Dream Land
                College students.
              </p>
            </div>

            <div className="dl-portal-modal-options">
              <button type="button">
                <span>
                  <LogIn size={19} />
                </span>

                <div>
                  <strong>Student Login</strong>

                  <small>
                    Access your student account and academic
                    information.
                  </small>
                </div>

                <ArrowRight size={18} />
              </button>

              <button type="button">
                <span>
                  <BookMarked size={19} />
                </span>

                <div>
                  <strong>Learning Resources</strong>

                  <small>
                    Access study materials and digital resources.
                  </small>
                </div>

                <ArrowRight size={18} />
              </button>

              <Link
                to="/contact"
                onClick={() => setPortalOpen(false)}
              >
                <span>
                  <Mail size={19} />
                </span>

                <div>
                  <strong>Need assistance?</strong>

                  <small>
                    Contact Dream Land College for portal support.
                  </small>
                </div>

                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
