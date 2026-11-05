
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Quote,
  Sparkles,
  MessageSquarePlus,
  X,
  Check,
  Send,
  GraduationCap,
  Loader2,
} from "lucide-react";

import api from "../admin/services/api";
import "../styles/Testimonials.css";

const testimonials = [
  {
    id: 1,
    category: "Accounting",
    quote:
      "The practical financial lab sessions and Peachtree software training at Dream Land College gave me a distinct edge during recruitment. I landed my auditing position immediately after graduation!",
    name: "Abebech Tadesse",
    role: "Accounting B.Sc. Graduate — Senior Auditor at Commercial Bank",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  },
  {
    id: 2,
    category: "Computer Science",
    quote:
      "Dream Land College provided a supportive learning environment where students can develop knowledge, confidence, and real-world technical skills for the Ethiopian job market.",
    name: "Yonas Alemayehu",
    role: "Computer Science B.Sc. Graduate — Software Engineer",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
  },
  {
    id: 3,
    category: "Management",
    quote:
      "The college creates fantastic opportunities for students to learn, collaborate, and build practical competencies that accelerate their future careers.",
    name: "Tigist Mekonnen",
    role: "Management B.Sc. Graduate — Operations Supervisor",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250",
  },
];

function Testimonials() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activeIndex, setActiveIndex] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");

  const [storyForm, setStoryForm] = useState({
    name: "",
    role: "",
    quote: "",
    program: "Computer Science",
  });

  const filteredTestimonials = testimonials.filter((item) => {
    if (activeFilter === "ALL") return true;

    return item.category.toUpperCase() === activeFilter.toUpperCase();
  });

  const nextTestimonial = () => {
    if (!filteredTestimonials.length) return;

    setActiveIndex(
      (current) => (current + 1) % filteredTestimonials.length
    );
  };

  const previousTestimonial = () => {
    if (!filteredTestimonials.length) return;

    setActiveIndex(
      (current) =>
        (current - 1 + filteredTestimonials.length) %
        filteredTestimonials.length
    );
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [activeFilter]);

  useEffect(() => {
    if (filteredTestimonials.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) => (current + 1) % filteredTestimonials.length
      );
    }, 6000);

    return () => window.clearInterval(timer);
  }, [filteredTestimonials.length]);

  const currentItem =
    filteredTestimonials[activeIndex] || filteredTestimonials[0];

  const openStoryModal = () => {
    setIsSubmitted(false);
    setSubmitError("");

    setStoryForm({
      name: "",
      role: "",
      quote: "",
      program: "Computer Science",
    });

    setIsModalOpen(true);
  };

  const closeStoryModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setIsSubmitted(false);
    setSubmitError("");

    setStoryForm({
      name: "",
      role: "",
      quote: "",
      program: "Computer Science",
    });
  };

  const handleStoryChange = (event) => {
    const { name, value } = event.target;

    setStoryForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Submit directly through the shared backend API service
  const handleStorySubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const authorName = storyForm.name.trim();
    const authorRole = storyForm.role.trim();
    const content = storyForm.quote.trim();

    if (authorName.length < 2) {
      setSubmitError("Please enter your full name.");
      return;
    }

    if (content.length < 10) {
      setSubmitError(
        "Your testimonial must contain at least 10 characters."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const response = await api.post("/testimonials/submit", {
        author_name: authorName,
        author_role: authorRole || null,
        content,
        category: storyForm.program || null,
        image: null,
      });

      if (!response?.success || !response?.testimonial?.id) {
        throw new Error(
          response?.message || "Testimonial submission was not confirmed."
        );
      }

      // The backend has confirmed that the record was saved.
      setIsSubmitted(true);

      window.setTimeout(() => {
        setIsSubmitted(false);
        setIsModalOpen(false);

        setStoryForm({
          name: "",
          role: "",
          quote: "",
          program: "Computer Science",
        });
      }, 3500);
    } catch (error) {
      console.error("Testimonial submission error:", error);

      setSubmitError(
        error.message || "Unable to submit your testimonial. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dl-testimonials" id="testimonials">
      <div className="dl-container">

        {/* HEADER & ACTION ROW */}
        <div className="dl-testimonials-header-row">
          <div className="dl-testimonials-heading">
            <span className="dl-section-label">
              <Sparkles size={13} /> STUDENT SUCCESS
            </span>

            <h2>What Our Graduates Say</h2>

            <p className="dl-testimonials-subtext">
              Hear from alumni who turned their education at Dream Land
              College into rewarding careers.
            </p>
          </div>

          <button
            type="button"
            className="dl-btn dl-btn-outline dl-share-story-btn"
            onClick={openStoryModal}
          >
            <MessageSquarePlus size={16} />
            Share Your Story
          </button>
        </div>

        {/* FILTER TABS */}
        <div
          className="dl-modality-tabs-row"
          style={{
            justifyContent: "center",
            marginBottom: "35px",
          }}
        >
          {[
            "ALL",
            "COMPUTER SCIENCE",
            "ACCOUNTING",
            "MANAGEMENT",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`dl-modality-tab-btn ${
                activeFilter === tab ? "active" : ""
              }`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab === "ALL" ? "All Stories" : tab}
            </button>
          ))}
        </div>

        {/* TESTIMONIAL STAGE */}
        <div className="dl-testimonial-stage">
          {filteredTestimonials.length > 0 ? (
            <article
              className="dl-testimonial-card dl-fade-in"
              key={currentItem.id}
            >
              <div className="dl-testimonial-card-top">
                <div
                  className="dl-testimonial-stars"
                  aria-label="5 star rating"
                >
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={18}
                      fill="#f59e0b"
                      color="#f59e0b"
                    />
                  ))}
                </div>

                <Quote
                  size={36}
                  className="dl-testimonial-quote-icon"
                />
              </div>

              <blockquote>
                “{currentItem.quote}”
              </blockquote>

              <div className="dl-testimonial-person">
                <div className="dl-testimonial-avatar-wrapper">
                  <img
                    src={currentItem.avatar}
                    alt={currentItem.name}
                    className="dl-testimonial-avatar-img"
                  />
                </div>

                <div className="dl-testimonial-person-info">
                  <strong>{currentItem.name}</strong>
                  <span>{currentItem.role}</span>
                </div>
              </div>
            </article>
          ) : (
            <div className="dl-gallery-empty-state">
              <GraduationCap size={40} />
              <p>No testimonials found for this category yet.</p>
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        {filteredTestimonials.length > 1 && (
          <div className="dl-testimonial-nav-row">
            <button
              type="button"
              className="dl-testimonial-arrow dl-hover-float"
              onClick={previousTestimonial}
              aria-label="Previous testimonial"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="dl-testimonial-dots">
              {filteredTestimonials.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={index === activeIndex ? "active" : ""}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="dl-testimonial-arrow dl-hover-float"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* SHARE YOUR STORY MODAL */}
      {isModalOpen && (
        <div
          className="dl-gallery-lightbox dl-fade-in"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSubmitting
            ) {
              closeStoryModal();
            }
          }}
        >
          <button
            type="button"
            className="dl-lightbox-close"
            onClick={closeStoryModal}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          <div
            className="dl-article-modal-box dl-scale-up"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dl-article-modal-content">
              {isSubmitted ? (
                <div
                  className="dl-gallery-empty-state dl-fade-in"
                  style={{ padding: "40px 0" }}
                >
                  <div className="dl-success-check-circle">
                    <Check size={32} />
                  </div>

                  <h3>Thank You for Sharing!</h3>

                  <p>
                    Your success story has been submitted successfully
                    and is awaiting approval by our team. Once approved,
                    it can appear on our website.
                  </p>
                </div>
              ) : (
                <>
                  <div className="dl-vacancy-modal-top">
                    <span className="dl-vacancy-type-badge">
                      Alumni Network
                    </span>

                    <span
                      className="dl-vacancy-type-badge"
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                      }}
                    >
                      Dream Land College
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: "10px 0 6px 0",
                    }}
                  >
                    Share Your Success Story
                  </h2>

                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#64748b",
                      marginBottom: "20px",
                    }}
                  >
                    Are you a graduate or alumni? Tell us how your time
                    at Dream Land College helped shape your career.
                  </p>

                  {submitError && (
                    <div
                      role="alert"
                      style={{
                        padding: "11px 13px",
                        marginBottom: "15px",
                        border: "1px solid #fecaca",
                        borderRadius: "9px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontSize: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {submitError}
                    </div>
                  )}

                  <form
                    onSubmit={handleStorySubmit}
                    className="dl-vacancy-form"
                  >
                    <div className="dl-form-group">
                      <label>Full Name</label>

                      <input
                        type="text"
                        name="name"
                        required
                        minLength={2}
                        maxLength={200}
                        placeholder="e.g. Abebe Kebede"
                        value={storyForm.name}
                        onChange={handleStoryChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="dl-form-grid-2">
                      <div className="dl-form-group">
                        <label>Current Professional Role</label>

                        <input
                          type="text"
                          name="role"
                          required
                          maxLength={150}
                          placeholder="e.g. Senior Software Engineer"
                          value={storyForm.role}
                          onChange={handleStoryChange}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="dl-form-group">
                        <label>Program / Faculty</label>

                        <select
                          name="program"
                          value={storyForm.program}
                          onChange={handleStoryChange}
                          disabled={isSubmitting}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13.5px",
                            background: "#f8fafc",
                            fontFamily: "inherit",
                            width: "100%",
                          }}
                        >
                          <option value="Computer Science">
                            Computer Science
                          </option>

                          <option value="Accounting & Finance">
                            Accounting & Finance
                          </option>

                          <option value="Management">
                            Management
                          </option>

                          <option value="TVET Program">
                            TVET Program
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="dl-form-group">
                      <label>Your Testimonial Quote</label>

                      <textarea
                        name="quote"
                        rows={3}
                        required
                        minLength={10}
                        maxLength={5000}
                        placeholder="Share how Dream Land College prepared you for success..."
                        value={storyForm.quote}
                        onChange={handleStoryChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div
                      className="dl-article-modal-actions"
                      style={{ marginTop: "20px" }}
                    >
                      <button
                        type="button"
                        className="dl-btn dl-btn-outline"
                        onClick={closeStoryModal}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="dl-btn dl-btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2
                              size={16}
                              className="at-spinning"
                            />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Story <Send size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Testimonials;
