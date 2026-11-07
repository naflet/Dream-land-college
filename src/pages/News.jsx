
import React, { useMemo, useState, useEffect, useCallback } from "react";

import {
  CalendarDays,
  ArrowRight,
  Sparkles,
  Search,
  X,
  Clock,
  User,
  Bell,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  LoaderCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import supabase from "../config/supabase";
import "../styles/News.css";

const categories = [
  "ALL",
  "NEWS",
  "EVENT",
  "ACADEMIC",
  "COMMUNITY",
];

/* ==========================================================
   HELPERS
========================================================== */

const formatNewsDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Addis_Ababa",
  })
    .format(parsedDate)
    .toUpperCase();
};

const calculateReadTime = (content = "") => {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
};

const getNewsErrorMessage = (error) => {
  if (!error) {
    return "Something went wrong while loading news.";
  }

  // Avoid displaying raw database and infrastructure errors.
  if (
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("failed to fetch")
  ) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  if (
    error.code === "PGRST301" ||
    error.code === "401" ||
    error.code === "403"
  ) {
    return "We couldn't access the latest news. Please try again later.";
  }

  return "We couldn't load the latest news articles. Please try again.";
};

/* ==========================================================
   REUSABLE IMAGE
========================================================== */

function NewsImage({ src, alt, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (!src || imageFailed) {
    return (
      <div className={`dl-news-image-placeholder ${className}`}>
        <ImageIcon size={36} />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt || "News article"}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

/* ==========================================================
   NEWS PAGE
========================================================== */

function News() {
  const [newsItems, setNewsItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ========================================================
     FETCH PUBLISHED NEWS
  ======================================================== */

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: supabaseError } = await supabase
        .from("news")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (supabaseError) {
        console.error("News database error:", supabaseError);
        throw supabaseError;
      }

      setNewsItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Public news loading error:", err);

      setNewsItems([]);
      setError(getNewsErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  /* ========================================================
     FILTER NEWS
  ======================================================== */

  const filteredNews = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return newsItems.filter((item) => {
      const matchesCategory =
        activeCategory === "ALL" ||
        (item.category || "").toUpperCase() === activeCategory;

      const matchesSearch =
        (item.title || "").toLowerCase().includes(query) ||
        (item.excerpt || "").toLowerCase().includes(query) ||
        (item.content || "").toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [newsItems, activeCategory, searchQuery]);

  /* ========================================================
     CLOSE MODAL WITH ESCAPE
  ======================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedArticle(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /* ========================================================
     LOADING STATE
  ======================================================== */

  const renderLoadingState = () => (
    <div className="dl-news-system-state dl-news-loading-state">
      <LoaderCircle size={38} className="dl-news-spinner" />

      <h3>Loading news and announcements</h3>

      <p>
        Please wait while we retrieve the latest college updates.
      </p>
    </div>
  );

  /* ========================================================
     ERROR STATE
  ======================================================== */

  const renderErrorState = () => (
    <div className="dl-news-system-state dl-news-error-state">
      <div className="dl-news-state-icon">
        <AlertCircle size={34} />
      </div>

      <h3>Unable to load news</h3>

      <p>{error}</p>

      <button
        type="button"
        className="dl-btn dl-btn-primary dl-news-retry-btn"
        onClick={fetchNews}
        disabled={loading}
      >
        <RefreshCw size={15} />
        Try Again
      </button>
    </div>
  );

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  const renderEmptyState = () => (
    <div className="dl-gallery-empty-state dl-fade-in">
      <Bell size={48} />

      <h3>No articles found</h3>

      <p>
        {newsItems.length === 0
          ? "There are currently no published news articles or announcements."
          : "We couldn't find any announcements matching your search or category."}
      </p>

      {(activeCategory !== "ALL" || searchQuery) && (
        <button
          type="button"
          className="dl-btn dl-btn-primary"
          onClick={() => {
            setActiveCategory("ALL");
            setSearchQuery("");
          }}
          style={{ marginTop: "16px" }}
        >
          Reset Filters
        </button>
      )}
    </div>
  );

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}

        <section className="dl-page-hero dl-news-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                News & Events
              </span>
            </div>

            <h1>Stay connected with Dream Land.</h1>

            <p>
              Follow college news, academic updates, student activities and
              community events across our campuses.
            </p>

            <div
              className="dl-hero-stats-grid"
              style={{ marginTop: "30px" }}
            >
              <div className="dl-stat-pill dl-hover-float">
                <Bell size={18} />

                <div>
                  <strong>
                    {loading
                      ? "Loading..."
                      : `${newsItems.length} Active Posts`}
                  </strong>

                  <span>Announcements & Events</span>
                </div>
              </div>

              <div className="dl-stat-pill dl-hover-float">
                <CalendarDays size={18} />

                <div>
                  <strong>Updated Schedule</strong>
                  <span>2026 Academic Year</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NEWS CONTENT SECTION */}

        <section className="dl-news-content">
          <div className="dl-shell">
            {/* CONTROLS */}

            <div className="dl-news-controls-row">
              <div className="dl-news-filters">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={`dl-modality-tab-btn ${
                      activeCategory === category ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveCategory(category);
                      setSearchQuery("");
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="dl-gallery-search-box">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  disabled={loading || Boolean(error)}
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="dl-clear-search"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* LOADING */}

            {loading && renderLoadingState()}

            {/* ERROR */}

            {!loading && error && renderErrorState()}

            {/* NEWS GRID */}

            {!loading && !error && filteredNews.length > 0 && (
              <div
                className="dl-news-page-grid dl-fade-in"
                key={`${activeCategory}-${searchQuery}`}
              >
                {filteredNews.map((item) => (
                  <article
                    className="dl-news-page-card dl-hover-lift"
                    key={item.id}
                    onClick={() => setSelectedArticle(item)}
                  >
                    <div className="dl-news-page-image">
                      <NewsImage
                        src={item.image}
                        alt={item.title}
                      />

                      <span className="dl-news-cat-badge">
                        {item.category}
                      </span>
                    </div>

                    <div className="dl-news-page-body">
                      <div className="dl-news-meta-row">
                        <div className="dl-news-page-date">
                          <CalendarDays size={14} />

                          {formatNewsDate(item.published_at)}
                        </div>

                        <span className="dl-news-readtime">
                          <Clock size={12} />

                          {calculateReadTime(item.content)}
                        </span>
                      </div>

                      <h2>{item.title}</h2>

                      <p>{item.excerpt}</p>

                      <button
                        type="button"
                        className="dl-news-readmore-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedArticle(item);
                        }}
                      >
                        Read full article
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* EMPTY STATE */}

            {!loading &&
              !error &&
              filteredNews.length === 0 &&
              renderEmptyState()}
          </div>
        </section>
      </main>

      {/* ARTICLE READER MODAL */}

      {selectedArticle && (
        <div
          className="dl-gallery-lightbox dl-fade-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedArticle(null);
            }
          }}
        >
          <button
            type="button"
            className="dl-lightbox-close"
            onClick={() => setSelectedArticle(null)}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          <div className="dl-article-modal-box dl-scale-up">
            <div className="dl-article-modal-img">
              <NewsImage
                src={selectedArticle.image}
                alt={selectedArticle.title}
              />

              <span className="dl-news-cat-badge">
                {selectedArticle.category}
              </span>
            </div>

            <div className="dl-article-modal-content">
              <div
                className="dl-news-meta-row"
                style={{ marginBottom: "10px" }}
              >
                <span className="dl-news-page-date">
                  <CalendarDays size={14} />

                  {formatNewsDate(selectedArticle.published_at)}
                </span>

                <span className="dl-news-readtime">
                  <User size={12} />

                  {selectedArticle.author || "Dream Land College"}
                </span>
              </div>

              <h2>{selectedArticle.title}</h2>

              <p className="dl-article-full-text">
                {selectedArticle.content}
              </p>

              <div className="dl-article-modal-actions">
                <button
                  type="button"
                  className="dl-btn dl-btn-primary"
                  onClick={() => setSelectedArticle(null)}
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default News;
