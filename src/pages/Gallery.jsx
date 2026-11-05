import React, { useState, useEffect } from "react";
import { Maximize2, X, Sparkles, Image as ImageIcon, Layers, Search, ChevronLeft, ChevronRight } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Gallery.css";

const categories = ["All", "Campus Life", "Facilities", "Students"];

const images = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=85",
    title: "Learning Environment",
    category: "Facilities",
    description: "State-of-the-art study and lecture halls designed for focused higher learning."
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85",
    title: "Student Community",
    category: "Students",
    description: "A diverse and vibrant community of regular, extension, and distance learners."
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=85",
    title: "Campus Activities",
    category: "Campus Life",
    description: "Engaging academic events, student panels, and extracurricular programs."
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1400&q=85",
    title: "College Facilities",
    category: "Facilities",
    description: "Modern computer laboratories equipped with high-speed networks and learning tools."
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=1400&q=85",
    title: "Academic Life",
    category: "Campus Life",
    description: "Daily collaborative study sessions and faculty-led instruction across our campuses."
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=85",
    title: "Learning Together",
    category: "Students",
    description: "Peer-to-peer discussions promoting teamwork and practical knowledge sharing."
  },
];

function Gallery() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter images based on category and search query
  const filteredImages = images.filter((img) => {
    const matchesCategory = activeCategory === "All" || img.category === activeCategory;
    const matchesSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          img.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openLightbox = (img) => {
    const index = filteredImages.findIndex((item) => item.id === img.id);
    setSelectedImageIndex(index);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => (prev + 1) % filteredImages.length);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  // Keyboard navigation support for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex === null) return;
      if (e.key === "Escape") setSelectedImageIndex(null);
      if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev + 1) % filteredImages.length);
      }
      if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, filteredImages.length]);

  const activeLightboxImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null;

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="dl-page-hero dl-gallery-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                <Sparkles size={14} /> College Gallery
              </span>
            </div>

            <h1>A Look Inside Dream Land College.</h1>

            <p>
              Explore moments, modern learning spaces, and vibrant community experiences across our campuses.
            </p>

            <div className="dl-hero-stats-grid" style={{ marginTop: "30px" }}>
              <div className="dl-stat-pill dl-hover-float">
                <ImageIcon size={18} />
                <div>
                  <strong>{images.length} Photos</strong>
                  <span>Campus Archive</span>
                </div>
              </div>
              <div className="dl-stat-pill dl-hover-float">
                <Layers size={18} />
                <div>
                  <strong>Interactive Lightbox</strong>
                  <span>Arrow Navigation Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY CONTENT & CONTROLS */}
        <section className="dl-gallery-content">
          <div className="dl-shell">
            
            <div className="dl-gallery-controls-row">
              {/* CATEGORY FILTER TABS */}
              <div className="dl-modality-tabs-row" style={{ margin: 0 }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`dl-modality-tab-btn ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => {
                      setActiveCategory(cat);
                      setSelectedImageIndex(null);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* LIVE SEARCH BAR */}
              <div className="dl-gallery-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search gallery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="dl-clear-search">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* IMAGE GRID OR EMPTY STATE */}
            {filteredImages.length > 0 ? (
              <div className="dl-gallery-grid dl-fade-in" key={`${activeCategory}-${searchQuery}`}>
                {filteredImages.map((image) => (
                  <button
                    type="button"
                    className="dl-gallery-item dl-hover-lift"
                    key={image.id}
                    onClick={() => openLightbox(image)}
                  >
                    <img
                      src={image.src}
                      alt={image.title}
                      loading="lazy"
                    />

                    <div className="dl-gallery-overlay">
                      <div className="dl-overlay-icon-circle">
                        <Maximize2 size={20} />
                      </div>
                      <div className="dl-overlay-text">
                        <h3>{image.title}</h3>
                        <span>{image.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="dl-gallery-empty-state dl-fade-in">
                <ImageIcon size={48} />
                <h3>No gallery images found</h3>
                <p>Try searching for a different keyword or switching categories.</p>
                <button
                  type="button"
                  className="dl-btn dl-btn-primary"
                  onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                  style={{ marginTop: "16px" }}
                >
                  Reset Filters
                </button>
              </div>
            )}

          </div>
        </section>
      </main>

      {/* INTERACTIVE LIGHTBOX MODAL */}
      {activeLightboxImage && (
        <div
          className="dl-gallery-lightbox dl-fade-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedImageIndex(null);
            }
          }}
        >
          <button
            type="button"
            className="dl-lightbox-close"
            onClick={() => setSelectedImageIndex(null)}
            aria-label="Close image"
          >
            <X size={24} />
          </button>

          {/* PREV BUTTON */}
          <button
            type="button"
            className="dl-lightbox-nav-btn dl-lightbox-prev"
            onClick={handlePrev}
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>

          {/* NEXT BUTTON */}
          <button
            type="button"
            className="dl-lightbox-nav-btn dl-lightbox-next"
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>

          <div className="dl-lightbox-content-box dl-scale-up">
            <div className="dl-lightbox-img-wrapper">
              <img
                src={activeLightboxImage.src}
                alt={activeLightboxImage.title}
              />
            </div>
            <div className="dl-lightbox-caption">
              <div>
                <h3>{activeLightboxImage.title}</h3>
                <p>{activeLightboxImage.description}</p>
              </div>
              <div className="dl-lightbox-meta">
                <span className="dl-lightbox-tag">{activeLightboxImage.category}</span>
                <span className="dl-lightbox-counter">
                  {selectedImageIndex + 1} of {filteredImages.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Gallery;