import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import {
  Maximize2,
  X,
  Image as ImageIcon,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ImageOff,
  WifiOff,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import supabase from "../config/supabase";
import "../styles/Gallery.css";

/* ==========================================================
   PUBLIC GALLERY CACHE
========================================================== */

const GALLERY_CACHE_KEY = "dream_land_public_gallery_cache";

/* ==========================================================
   CACHE HELPERS
========================================================== */

const readGalleryCache = () => {
  try {
    const cachedData = localStorage.getItem(GALLERY_CACHE_KEY);

    if (!cachedData) return [];

    const parsedData = JSON.parse(cachedData);

    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.warn("Unable to read gallery cache:", error);
    return [];
  }
};

const saveGalleryCache = (galleryItems) => {
  try {
    if (!Array.isArray(galleryItems)) return;

    localStorage.setItem(
      GALLERY_CACHE_KEY,
      JSON.stringify(galleryItems)
    );
  } catch (error) {
    console.warn("Unable to save gallery cache:", error);
  }
};

/* ==========================================================
   FRIENDLY ERROR HANDLING
========================================================== */

const getGalleryErrorMessage = (error) => {
  if (!error) {
    return "Unable to load gallery images.";
  }

  const message = String(error.message || "").toLowerCase();

  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("connection")
  ) {
    return "We couldn't connect to the gallery service. Please check your internet connection.";
  }

  if (
    error.code === "401" ||
    error.code === "403" ||
    error.code === "PGRST301"
  ) {
    return "Gallery access is temporarily unavailable. Please try again later.";
  }

  return "We couldn't load the gallery right now. Please try again.";
};

/* ==========================================================
   DIRECT SUPABASE GALLERY FETCH
========================================================== */

const fetchGallery = async () => {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("is_published", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    console.error("Supabase gallery error:", error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

/* ==========================================================
   NORMALIZE GALLERY DATA
========================================================== */

const normalizeGalleryImages = (galleryItems) => {
  if (!Array.isArray(galleryItems)) return [];

  return galleryItems.flatMap((galleryItem) => {
    if (!galleryItem) return [];

    let imageUrls = galleryItem.image_urls;

    if (typeof imageUrls === "string") {
      try {
        imageUrls = JSON.parse(imageUrls);
      } catch {
        imageUrls = [];
      }
    }

    if (!Array.isArray(imageUrls)) {
      imageUrls = [];
    }

    imageUrls = imageUrls.filter(
      (url) =>
        typeof url === "string" &&
        url.trim() !== ""
    );

    // Support older records with one image URL.
    if (
      imageUrls.length === 0 &&
      typeof galleryItem.image_url === "string" &&
      galleryItem.image_url.trim() !== ""
    ) {
      imageUrls = [galleryItem.image_url];
    }

    imageUrls = [...new Set(imageUrls)];

    return imageUrls.map((url, index) => ({
      id: `${galleryItem.id}-${index}`,
      galleryId: galleryItem.id,
      src: url.trim(),
      title: galleryItem.title || "Dream Land College",
      category: galleryItem.category || "Campus Life",
      description: galleryItem.description || "",
      imageNumber: index + 1,
      totalImages: imageUrls.length,
      displayOrder: galleryItem.display_order ?? 0,
    }));
  });
};

/* ==========================================================
   GALLERY IMAGE COMPONENT
========================================================== */

function GalleryImage({ image, onClick }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image.src]);

  return (
    <button
      type="button"
      className="dl-gallery-item dl-hover-lift"
      onClick={() => !failed && onClick(image)}
      aria-label={`View ${image.title}`}
      disabled={failed}
    >
      {failed ? (
        <div className="dl-gallery-image-fallback">
          <ImageOff size={38} />
          <strong>Unable to Load Image</strong>
          <span>{image.title}</span>
        </div>
      ) : (
        <img
          src={image.src}
          alt={image.title}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}

      {!failed && (
        <div className="dl-gallery-overlay">
          <div className="dl-overlay-icon-circle">
            <Maximize2 size={20} />
          </div>

          <div className="dl-overlay-text">
            <h3>{image.title}</h3>
            <span>{image.category}</span>
          </div>
        </div>
      )}
    </button>
  );
}

/* ==========================================================
   GALLERY COMPONENT
========================================================== */

function Gallery() {
  // Load saved gallery data immediately.
  const [galleryItems, setGalleryItems] = useState(
    () => readGalleryCache()
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(null);

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [lightboxImageFailed, setLightboxImageFailed] =
    useState(false);

  /* ========================================================
     LOAD GALLERY FROM SUPABASE
  ======================================================== */

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchGallery();

      const sortedData = [...data].sort(
        (a, b) =>
          Number(a.display_order || 0) -
          Number(b.display_order || 0)
      );

      // Update the current page.
      setGalleryItems(sortedData);

      // Save the latest successful response.
      saveGalleryCache(sortedData);

      setError("");
    } catch (err) {
      console.error("Gallery loading error:", err);

      // Recover previously saved gallery data.
      const cachedItems = readGalleryCache();

      if (cachedItems.length > 0) {
        setGalleryItems(cachedItems);

        // Do not show an error over available gallery content.
        setError("");
      } else {
        setError(getGalleryErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  /* ========================================================
     AUTOMATIC RECONNECTION
  ======================================================== */

  useEffect(() => {
    const handleOnline = () => {
      loadGallery();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [loadGallery]);

  /* ========================================================
     NORMALIZE IMAGES
  ======================================================== */

  const images = useMemo(
    () => normalizeGalleryImages(galleryItems),
    [galleryItems]
  );

  const hasCachedImages = images.length > 0;

  /* ========================================================
     CATEGORIES
  ======================================================== */

  const categories = useMemo(() => {
    const availableCategories = [
      ...new Set(
        galleryItems
          .map((item) => item.category)
          .filter(
            (category) =>
              typeof category === "string" &&
              category.trim() !== ""
          )
      ),
    ];

    return ["All", ...availableCategories];
  }, [galleryItems]);

  /* ========================================================
     FILTER IMAGES
  ======================================================== */

  const filteredImages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return images.filter((img) => {
      const matchesCategory =
        activeCategory === "All" ||
        img.category === activeCategory;

      const matchesSearch =
        !query ||
        img.title.toLowerCase().includes(query) ||
        img.description.toLowerCase().includes(query) ||
        img.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [images, activeCategory, searchQuery]);

  /* ========================================================
     OPEN LIGHTBOX
  ======================================================== */

  const openLightbox = useCallback(
    (img) => {
      const index = filteredImages.findIndex(
        (item) => item.id === img.id
      );

      if (index !== -1) {
        setLightboxImageFailed(false);
        setSelectedImageIndex(index);
      }
    },
    [filteredImages]
  );

  /* ========================================================
     CLOSE LIGHTBOX
  ======================================================== */

  const closeLightbox = useCallback(() => {
    setSelectedImageIndex(null);
    setLightboxImageFailed(false);
  }, []);

  /* ========================================================
     LIGHTBOX NAVIGATION
  ======================================================== */

  const handleNext = useCallback(
    (event) => {
      event?.stopPropagation();

      if (
        selectedImageIndex !== null &&
        filteredImages.length > 0
      ) {
        setLightboxImageFailed(false);

        setSelectedImageIndex(
          (previous) =>
            (previous + 1) % filteredImages.length
        );
      }
    },
    [selectedImageIndex, filteredImages.length]
  );

  const handlePrev = useCallback(
    (event) => {
      event?.stopPropagation();

      if (
        selectedImageIndex !== null &&
        filteredImages.length > 0
      ) {
        setLightboxImageFailed(false);

        setSelectedImageIndex(
          (previous) =>
            (previous - 1 + filteredImages.length) %
            filteredImages.length
        );
      }
    },
    [selectedImageIndex, filteredImages.length]
  );

  /* ========================================================
     KEYBOARD NAVIGATION
  ======================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedImageIndex === null) return;

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight") {
        handleNext();
      }

      if (event.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    selectedImageIndex,
    handleNext,
    handlePrev,
    closeLightbox,
  ]);

  /* ========================================================
     FILTER CONTROLS
  ======================================================== */

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSelectedImageIndex(null);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSelectedImageIndex(null);
  };

  /* ========================================================
     ACTIVE LIGHTBOX IMAGE
  ======================================================== */

  const activeLightboxImage =
    selectedImageIndex !== null
      ? filteredImages[selectedImageIndex] || null
      : null;

  /* ========================================================
     TOTAL COLLECTIONS
  ======================================================== */

  const totalGalleryCards = galleryItems.length;

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO */}

        <section className="dl-page-hero dl-gallery-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                College Gallery
              </span>
            </div>

            <h1>A Look Inside Dream Land College.</h1>

            <p>
              Explore moments, modern learning spaces, and vibrant
              community experiences across our campuses.
            </p>

            <div
              className="dl-hero-stats-grid"
              style={{ marginTop: "30px" }}
            >
              <div className="dl-stat-pill dl-hover-float">
                <ImageIcon size={18} />

                <div>
                  <strong>
                    {loading && !hasCachedImages
                      ? "Loading..."
                      : `${images.length} Photos`}
                  </strong>

                  <span>Campus Archive</span>
                </div>
              </div>

              <div className="dl-stat-pill dl-hover-float">
                <Layers size={18} />

                <div>
                  <strong>
                    {loading && !hasCachedImages
                      ? "Loading..."
                      : `${totalGalleryCards} Collections`}
                  </strong>

                  <span>Interactive Lightbox</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY CONTENT */}

        <section className="dl-gallery-content">
          <div className="dl-shell">

            {/* FILTERS AND SEARCH */}

            {hasCachedImages && (
              <div className="dl-gallery-controls-row">
                <div
                  className="dl-modality-tabs-row"
                  style={{ margin: 0 }}
                >
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`dl-modality-tab-btn ${
                        activeCategory === category
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleCategoryChange(category)
                      }
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="dl-gallery-search-box">
                  <Search size={16} />

                  <input
                    type="text"
                    placeholder="Search gallery..."
                    value={searchQuery}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className="dl-clear-search"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* INITIAL LOADING */}

            {loading && !hasCachedImages && (
              <div className="dl-gallery-empty-state dl-fade-in">
                <RefreshCw
                  size={38}
                  className="dl-gallery-loading-icon"
                />

                <h3>Loading Gallery...</h3>

                <p>
                  Please wait while we load photos from Dream Land
                  College.
                </p>
              </div>
            )}

            {/* OFFLINE AND NO CACHED DATA */}

            {!loading && error && !hasCachedImages && (
              <div className="dl-gallery-empty-state dl-fade-in">
                <WifiOff size={46} />

                <h3>Gallery Temporarily Unavailable</h3>

                <p>
                  Our gallery is temporarily unavailable.
                  Please check your internet connection and try again.
                </p>

                <button
                  type="button"
                  className="dl-btn dl-btn-primary"
                  onClick={loadGallery}
                  style={{ marginTop: "16px" }}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            )}

            {/* IMAGE GRID */}

            {hasCachedImages &&
              filteredImages.length > 0 && (
                <div
                  className="dl-gallery-grid dl-fade-in"
                  key={`${activeCategory}-${searchQuery}`}
                >
                  {filteredImages.map((image) => (
                    <GalleryImage
                      key={image.id}
                      image={image}
                      onClick={openLightbox}
                    />
                  ))}
                </div>
              )}

            {/* EMPTY FILTER RESULTS */}

            {!loading &&
              hasCachedImages &&
              filteredImages.length === 0 && (
                <div className="dl-gallery-empty-state dl-fade-in">
                  <ImageIcon size={48} />

                  <h3>No Gallery Images Found</h3>

                  <p>
                    Try searching for a different keyword or
                    switching categories.
                  </p>

                  <button
                    type="button"
                    className="dl-btn dl-btn-primary"
                    onClick={() => {
                      setActiveCategory("All");
                      setSearchQuery("");
                    }}
                    style={{ marginTop: "16px" }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            {/* EMPTY GALLERY */}

            {!loading &&
              !error &&
              !hasCachedImages && (
                <div className="dl-gallery-empty-state dl-fade-in">
                  <ImageIcon size={48} />

                  <h3>Gallery Coming Soon</h3>

                  <p>
                    Our gallery is being updated. Please check
                    back soon.
                  </p>

                  <button
                    type="button"
                    className="dl-btn dl-btn-primary"
                    onClick={loadGallery}
                    style={{ marginTop: "16px" }}
                  >
                    <RefreshCw size={16} />
                    Refresh Gallery
                  </button>
                </div>
              )}

          </div>
        </section>
      </main>

      {/* LIGHTBOX */}

      {activeLightboxImage && (
        <div
          className="dl-gallery-lightbox dl-fade-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <button
            type="button"
            className="dl-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close image"
          >
            <X size={24} />
          </button>

          {filteredImages.length > 1 && (
            <button
              type="button"
              className="dl-lightbox-nav-btn dl-lightbox-prev"
              onClick={handlePrev}
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {filteredImages.length > 1 && (
            <button
              type="button"
              className="dl-lightbox-nav-btn dl-lightbox-next"
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight size={28} />
            </button>
          )}

          <div className="dl-lightbox-content-box dl-scale-up">
            <div className="dl-lightbox-img-wrapper">
              {lightboxImageFailed ? (
                <div className="dl-lightbox-image-fallback">
                  <ImageOff size={48} />

                  <h3>Unable to Load Image</h3>

                  <p>{activeLightboxImage.title}</p>
                </div>
              ) : (
                <img
                  src={activeLightboxImage.src}
                  alt={activeLightboxImage.title}
                  onError={() => setLightboxImageFailed(true)}
                />
              )}
            </div>

            <div className="dl-lightbox-caption">
              <div>
                <h3>{activeLightboxImage.title}</h3>

                <p>{activeLightboxImage.description}</p>
              </div>

              <div className="dl-lightbox-meta">
                <span className="dl-lightbox-tag">
                  {activeLightboxImage.category}
                </span>

                <span className="dl-lightbox-counter">
                  {selectedImageIndex + 1} of{" "}
                  {filteredImages.length}
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