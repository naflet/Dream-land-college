
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  MapPin,
  Users,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Navigation,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import supabase from "../config/supabase";
import "../styles/Campuses.css";

const SUPABASE_URL = "https://odlhnquliietvrkgjnym.supabase.co";
const CAMPUS_BUCKET = "campus-images";

const getCampusImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // Support existing complete image URLs.
  if (
    imagePath.startsWith("https://") ||
    imagePath.startsWith("http://")
  ) {
    return imagePath;
  }

  // Remove leading slashes to avoid malformed URLs.
  const cleanPath = imagePath.replace(/^\/+/, "");

  return `${SUPABASE_URL}/storage/v1/object/public/${CAMPUS_BUCKET}/${cleanPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
};

function Campuses() {
  const [campusesData, setCampusesData] = useState([]);
  const [activeCampusId, setActiveCampusId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCampuses = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: supabaseError } = await supabase
        .from("campuses")
        .select("*");

      if (supabaseError) {
        throw supabaseError;
      }

      if (!Array.isArray(data)) {
        throw new Error("Unable to load campus information.");
      }

      const formattedCampuses = data.map((campus) => ({
        ...campus,

        shortName:
          campus.shortName ||
          campus.name?.replace(/\s+Campus$/i, "") ||
          campus.name,

        // Build public Supabase Storage image URL.
        image: getCampusImageUrl(
          campus.image_path || campus.image || ""
        ),

        facilities: Array.isArray(campus.facilities)
          ? campus.facilities
          : typeof campus.facilities === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(campus.facilities);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : [],

        mapQuery:
          campus.map_url ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            campus.address || campus.name
          )}`
      }));

      setCampusesData(formattedCampuses);

      if (formattedCampuses.length > 0) {
        setActiveCampusId((currentId) => {
          const existingCampus = formattedCampuses.find(
            (campus) => String(campus.id) === String(currentId)
          );

          return existingCampus
            ? existingCampus.id
            : formattedCampuses[0].id;
        });
      } else {
        setActiveCampusId(null);
      }
    } catch (err) {
      console.error("Error loading campuses:", err);

      setError(
        err.message ||
          "Unable to load campus information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  const activeCampus = campusesData.find(
    (campus) => String(campus.id) === String(activeCampusId)
  );

  const handleRetry = () => {
    fetchCampuses();
  };

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="dl-page-hero dl-campuses-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                Our Campuses
              </span>
            </div>

            <h1>Find Your Place to Learn & Grow.</h1>

            <p>
              Dream Land College connects students across three strategic
              campuses: Addis Ababa, Asella, and Bale, each equipped for
              excellence.
            </p>

            <div
              className="dl-hero-stats-grid"
              style={{ marginTop: "30px" }}
            >
              <div className="dl-stat-pill dl-hover-float">
                <Building2 size={18} />
                <div>
                  <strong>3 Strategic Hubs</strong>
                  <span>Across Ethiopia</span>
                </div>
              </div>

              <div className="dl-stat-pill dl-hover-float">
                <Users size={18} />
                <div>
                  <strong>Inclusive Access</strong>
                  <span>Regular, Extension & Distance</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CAMPUSES CONTENT SECTION */}
        <section className="dl-campuses-content">
          <div className="dl-shell">
            <div
              className="dl-centered-header"
              style={{ marginBottom: "30px" }}
            >
              <span className="dl-section-tag">Explore Locations</span>
              <h2>Select a Campus to View Details</h2>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                Loading campus information...
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <p>{error}</p>

                <button
                  type="button"
                  className="dl-btn dl-btn-primary"
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              </div>
            ) : campusesData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                No campuses are currently available.
              </div>
            ) : (
              <>
                {/* CAMPUS SELECTOR TABS */}
                <div
                  className="dl-modality-tabs-row"
                  style={{ marginBottom: "40px" }}
                >
                  {campusesData.map((campus) => (
                    <button
                      key={campus.id}
                      type="button"
                      className={`dl-modality-tab-btn ${
                        String(activeCampusId) === String(campus.id)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => setActiveCampusId(campus.id)}
                    >
                      <MapPin
                        size={14}
                        style={{ display: "inline", marginRight: 6 }}
                      />
                      {campus.name}
                    </button>
                  ))}
                </div>

                {activeCampus && (
                  <>
                    {/* FEATURED ACTIVE CAMPUS CARD */}
                    <div
                      className="dl-campus-featured-card dl-scale-up"
                      key={activeCampus.id}
                    >
                      <div className="dl-campus-featured-grid">
                        <div className="dl-campus-featured-img">
                          {activeCampus.image ? (
                            <img
                              src={activeCampus.image}
                              alt={activeCampus.name}
                              loading="lazy"
                              onError={(e) => {
                                console.error(
                                  "Campus image failed to load:",
                                  activeCampus.image
                                );
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}

                          <span className="dl-campus-badge-overlay">
                            <MapPin size={14} />{" "}
                            {activeCampus.shortName} Flagship
                          </span>
                        </div>

                        <div className="dl-campus-featured-info">
                          <h2>{activeCampus.name}</h2>

                          <p className="dl-campus-desc">
                            {activeCampus.description}
                          </p>

                          <div className="dl-campus-contact-info-list">
                            {activeCampus.address && (
                              <div className="dl-campus-contact-item">
                                <MapPin
                                  size={16}
                                  className="dl-text-green"
                                />
                                <span>{activeCampus.address}</span>
                              </div>
                            )}

                            {activeCampus.phone && (
                              <div className="dl-campus-contact-item">
                                <Phone
                                  size={16}
                                  className="dl-text-green"
                                />
                                <a
                                  href={`tel:${activeCampus.phone}`}
                                  className="dl-campus-link"
                                >
                                  {activeCampus.phone}
                                </a>
                              </div>
                            )}

                            {activeCampus.email && (
                              <div className="dl-campus-contact-item">
                                <Mail
                                  size={16}
                                  className="dl-text-green"
                                />
                                <a
                                  href={`mailto:${activeCampus.email}`}
                                  className="dl-campus-link"
                                >
                                  {activeCampus.email}
                                </a>
                              </div>
                            )}
                          </div>

                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#0f172a",
                              margin: "16px 0 10px 0"
                            }}
                          >
                            Campus Facilities & Infrastructure:
                          </h4>

                          <div
                            className="dl-check-grid-enhanced"
                            style={{ marginBottom: "24px" }}
                          >
                            {activeCampus.facilities.map((fac, idx) => (
                              <div
                                key={idx}
                                className="dl-check-item-pill"
                              >
                                <CheckCircle2
                                  size={15}
                                  className="dl-text-green"
                                />
                                <span>{fac}</span>
                              </div>
                            ))}
                          </div>

                          <div className="dl-campus-actions-row">
                            <Link
                              to="/contact"
                              className="dl-btn dl-btn-primary"
                            >
                              Inquire About {activeCampus.shortName}{" "}
                              <ArrowRight size={16} />
                            </Link>

                            <a
                              href={activeCampus.mapQuery}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dl-btn dl-btn-outline"
                            >
                              <Navigation size={15} /> Get Directions{" "}
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ALL CAMPUSES GRID CARDS */}
                    <div
                      className="dl-centered-header"
                      style={{ margin: "70px 0 30px 0" }}
                    >
                      <span className="dl-section-tag">All Locations</span>
                      <h2>Compare Our Campuses</h2>
                    </div>

                    <div className="dl-campus-detail-grid">
                      {campusesData.map((campus) => (
                        <article
                          className={`dl-campus-detail-card dl-hover-lift ${
                            String(activeCampusId) === String(campus.id)
                              ? "ring-active"
                              : ""
                          }`}
                          key={campus.id}
                          onClick={() => setActiveCampusId(campus.id)}
                        >
                          <div className="dl-campus-detail-image">
                            {campus.image ? (
                              <img
                                src={campus.image}
                                alt={`${campus.name} campus`}
                                loading="lazy"
                                onError={(e) => {
                                  console.error(
                                    "Campus image failed to load:",
                                    campus.image
                                  );
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : null}

                            <span>
                              <MapPin size={14} />
                              {campus.shortName}
                            </span>
                          </div>

                          <div className="dl-campus-detail-body">
                            <h2>{campus.name}</h2>

                            <p>{campus.description}</p>

                            <div className="dl-campus-facts">
                              <div>
                                <Building2
                                  size={16}
                                  className="dl-text-green"
                                />
                                <span>
                                  {campus.facilities.length} Facilities
                                </span>
                              </div>

                              <div>
                                <ShieldCheck
                                  size={16}
                                  className="dl-text-green"
                                />
                                <span>Accredited Hub</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="dl-campus-apply"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCampusId(campus.id);
                              }}
                            >
                              {String(activeCampusId) === String(campus.id)
                                ? "Currently Viewing"
                                : "Select This Campus"}
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Campuses;
