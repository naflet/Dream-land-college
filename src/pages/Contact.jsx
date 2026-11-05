
import React, { useState } from "react";

import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Globe,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../admin/services/api";
import "../styles/Contact.css";

const campusLocations = [
  {
    id: "addis",
    name: "Addis Ababa Main Campus",
    address: "Urael Square, Addis Ababa",
    phone: "+251 11 123 4567 / +251 11 987 6543",
    email: "admissions@dreamland.edu.et",
    hours: "Mon - Sat: 8:00 AM - 6:00 PM",
    badge: "Headquarters & Main Library",
  },
  {
    id: "bale",
    name: "Bale Robe Regional Campus",
    address: "Bale Robe Town, Administrative Center, Bale Zone",
    phone: "+251 22 441 8900 / +251 22 441 8901",
    email: "balerobe@dreamland.edu.et",
    hours: "Mon - Fri: 8:30 AM - 5:30 PM",
    badge: "Agriculture & Business Wing",
  },
  {
    id: "assela",
    name: "Assela Regional Campus",
    address: "Assela Town, Health Science Wing, Arsi Zone",
    phone: "+251 23 331 2244 / +251 23 331 2245",
    email: "assela@dreamland.edu.et",
    hours: "Mon - Sat: 8:00 AM - 5:00 PM",
    badge: "Health Sciences & Nursing Center",
  },
];

const faqItems = [
  {
    question:
      "How do I apply for undergraduate admission at Dream Land College?",
    answer:
      "You can apply online through our Student Portal or visit any of our regional campus admissions offices with your official preparatory school transcripts, Ethiopian Higher Education Entrance Examination (EHEEE) results, and recent passport-sized photographs.",
  },
  {
    question:
      "Are there scholarship opportunities available for qualifying students?",
    answer:
      "Yes! Dream Land College offers merit-based scholarships and need-based financial aid for high-achieving undergraduate students across all degree programs. Visit the Registrar's office or check our admissions notices for application deadlines.",
  },
  {
    question:
      "How can I request official academic transcripts or clearance certificates?",
    answer:
      "Current students and alumni can request official transcripts and student clearance documents through the online Student Portal or by submitting a formal request form directly at the Main Campus Registry office.",
  },
  {
    question:
      "Can I transfer credits from another accredited university or TVET college?",
    answer:
      "Transfer applications are reviewed individually by the Academic Admissions Board. Applicants must submit official course descriptions, grade transcripts, and a formal transfer letter to the Office of the Registrar.",
  },
];

function Contact() {
  const [activeCampus, setActiveCampus] = useState(campusLocations[0]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    department: "Admissions",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (submitError) {
      setSubmitError("");
    }
  };

  // SUBMIT CONTACT MESSAGE TO BACKEND
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const finalMessage = formData.studentId.trim()
        ? `Student ID: ${formData.studentId.trim()}\n\n${formData.message.trim()}`
        : formData.message.trim();

      const payload = {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: null,
        subject: formData.department,
        message: finalMessage,
      };

      const response = await api.post("/contact/submit", payload);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to submit your message."
        );
      }

      setFormSubmitted(true);
    } catch (error) {
      console.error("Contact form submission error:", error);

      setSubmitError(
        error.message ||
          "Unable to submit your message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setFormData({
      fullName: "",
      email: "",
      studentId: "",
      department: "Admissions",
      message: "",
    });

    setSubmitError("");
    setFormSubmitted(false);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="dl-page dl-fade-in">
      <Navbar />

      <main>
        {/* ==========================================================
            HERO SECTION
        ========================================================== */}
        <section className="dl-page-hero dl-contact-hero">
          <div className="dl-shell">
            <div className="dl-hero-badge-row">
              <span className="dl-page-kicker">
                Get in Touch with Us
              </span>
            </div>

            <h1>We Are Here to Help Your Academic Journey</h1>

            <p>
              Reach out to our administrative offices, regional campuses,
              or support teams for admissions, academic advising, and
              general inquiries.
            </p>

            <div className="dl-hero-stats-grid">
              <div className="dl-stat-pill">
                <Phone size={18} />

                <div>
                  <strong>+251 11 123 4567</strong>
                  <span>Main Support Line</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Mail size={18} />

                <div>
                  <strong>info@dreamland.edu.et</strong>
                  <span>Official Inquiries</span>
                </div>
              </div>

              <div className="dl-stat-pill">
                <Globe size={18} />

                <div>
                  <strong>3 Campuses</strong>
                  <span>Across Ethiopia</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            CAMPUS SELECTOR & CONTACT INFO CARDS
        ========================================================== */}
        <section className="dl-contact-campuses-section">
          <div className="dl-shell">
            <div className="dl-section-heading">
              <span className="dl-section-badge">
                <Building2 size={14} />
                Regional Facilities
              </span>

              <h2>Select a Campus Branch</h2>

              <p>
                Click any campus below to view its direct address,
                operating hours, and contact details.
              </p>
            </div>

            <div className="dl-lib-tabs">
              {campusLocations.map((campus) => (
                <button
                  key={campus.id}
                  type="button"
                  className={`dl-lib-tab ${
                    activeCampus.id === campus.id ? "active" : ""
                  }`}
                  onClick={() => setActiveCampus(campus)}
                >
                  <Building2
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                    }}
                  />

                  {campus.name.split(" ")[0]}{" "}
                  {campus.name.split(" ")[1]}
                </button>
              ))}
            </div>

            <div
              className="dl-active-campus-card dl-fade-in"
              key={activeCampus.id}
            >
              <div className="dl-active-campus-header">
                <div>
                  <span className="dl-modal-badge">
                    {activeCampus.badge}
                  </span>

                  <h3>{activeCampus.name}</h3>
                </div>

                <div className="dl-active-campus-icon">
                  <Building2 size={32} />
                </div>
              </div>

              <div className="dl-active-campus-grid">
                <div className="dl-contact-info-item">
                  <MapPin size={18} />

                  <div>
                    <strong>Physical Address</strong>
                    <span>{activeCampus.address}</span>
                  </div>
                </div>

                <div className="dl-contact-info-item">
                  <Phone size={18} />

                  <div>
                    <strong>Direct Telephone</strong>
                    <span>{activeCampus.phone}</span>
                  </div>
                </div>

                <div className="dl-contact-info-item">
                  <Mail size={18} />

                  <div>
                    <strong>Official Email</strong>
                    <span>{activeCampus.email}</span>
                  </div>
                </div>

                <div className="dl-contact-info-item">
                  <Clock size={18} />

                  <div>
                    <strong>Working Hours</strong>
                    <span>{activeCampus.hours}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            INTERACTIVE MESSAGE FORM & INFO
        ========================================================== */}
        <section className="dl-contact-form-section">
          <div className="dl-shell">
            <div className="dl-contact-form-wrapper">
              <div className="dl-contact-form-info">
                <span className="dl-section-badge">
                  <MessageSquare size={14} />
                  Direct Message
                </span>

                <h2>Send Us a Message</h2>

                <p>
                  Have questions regarding your application, course
                  registration, or fee payments? Fill out the form and
                  our department staff will get back to you promptly.
                </p>

                <div className="dl-contact-features-list">
                  <div className="dl-contact-feature">
                    <CheckCircle2
                      size={18}
                      className="dl-text-green"
                    />
                    <span>
                      Fast response within 24 business hours
                    </span>
                  </div>

                  <div className="dl-contact-feature">
                    <CheckCircle2
                      size={18}
                      className="dl-text-green"
                    />
                    <span>
                      Direct routing to respective department heads
                    </span>
                  </div>

                  <div className="dl-contact-feature">
                    <CheckCircle2
                      size={18}
                      className="dl-text-green"
                    />
                    <span>
                      Secure student data confidentiality
                    </span>
                  </div>
                </div>

                <div className="dl-contact-emergency-box">
                  <strong>Need Urgent Assistance?</strong>

                  <p>
                    Call our central registrar hotline at{" "}
                    <strong>+251 11 123 4567</strong> during working
                    hours.
                  </p>
                </div>
              </div>

              <div className="dl-contact-form-box">
                {formSubmitted ? (
                  <div
                    className="dl-modal-success dl-fade-in"
                    style={{ padding: "40px 10px" }}
                  >
                    <CheckCircle2
                      size={64}
                      className="dl-success-icon"
                    />

                    <h3>Message Sent Successfully!</h3>

                    <p>
                      Thank you for contacting Dream Land College.
                      Your message has been submitted successfully
                      under the{" "}
                      <strong>{formData.department}</strong> subject.
                      Our team will review your inquiry.
                    </p>

                    <button
                      type="button"
                      className="dl-btn dl-btn-primary"
                      onClick={handleSendAnother}
                      style={{ marginTop: "20px" }}
                    >
                      <Send size={16} />
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="dl-contact-form"
                  >
                    <h3>Inquiry Form</h3>

                    {submitError && (
                      <div
                        role="alert"
                        style={{
                          padding: "12px 14px",
                          marginBottom: "16px",
                          borderRadius: "8px",
                          background: "#FEE2E2",
                          color: "#991B1B",
                          fontSize: "14px",
                        }}
                      >
                        {submitError}
                      </div>
                    )}

                    <div className="dl-form-row">
                      <label>
                        Full Name *
                        <input
                          required
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="e.g., Your full name"
                          minLength={2}
                          maxLength={200}
                        />
                      </label>

                      <label>
                        Email Address *
                        <input
                          required
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="e.g., example@email.com"
                          maxLength={255}
                        />
                      </label>
                    </div>

                    <div className="dl-form-row">
                      <label>
                        Student ID (Optional)
                        <input
                          type="text"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleInputChange}
                          placeholder="e.g., DLC/2049/23"
                          maxLength={100}
                        />
                      </label>

                      <label>
                        Target Department *
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                        >
                          <option value="Admissions">
                            Admissions & Enrollment
                          </option>

                          <option value="Registrar">
                            Office of the Registrar
                          </option>

                          <option value="Financial Aid">
                            Financial Aid & Fees
                          </option>

                          <option value="IT Support">
                            IT & Student Portal Support
                          </option>

                          <option value="Library">
                            Library Services
                          </option>
                        </select>
                      </label>
                    </div>

                    <label className="dl-textarea-label">
                      Your Message / Inquiry *

                      <textarea
                        required
                        rows={4}
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Write your message or question in detail here..."
                        minLength={5}
                        maxLength={10000}
                      />
                    </label>

                    <button
                      type="submit"
                      className="dl-btn dl-btn-primary dl-btn-block"
                      disabled={isSubmitting}
                    >
                      <Send size={16} />

                      {isSubmitting
                        ? "Submitting Message..."
                        : "Submit Inquiry"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            FREQUENTLY ASKED QUESTIONS
        ========================================================== */}
        <section className="dl-contact-faq-section">
          <div className="dl-shell">
            <div className="dl-section-heading">
              <span className="dl-section-badge">
                <HelpCircle size={14} />
                Quick Answers
              </span>

              <h2>Frequently Asked Questions</h2>

              <p>
                Find immediate answers to common questions about
                admissions, transcripts, and student policies.
              </p>
            </div>

            <div className="dl-faq-accordion">
              {faqItems.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div
                    key={index}
                    className={`dl-faq-item ${
                      isOpen ? "open" : ""
                    }`}
                    onClick={() => toggleFaq(index)}
                  >
                    <div className="dl-faq-question">
                      <h4>{faq.question}</h4>

                      <ChevronDown
                        size={18}
                        className={`dl-faq-chevron ${
                          isOpen ? "rotated" : ""
                        }`}
                      />
                    </div>

                    {isOpen && (
                      <div className="dl-faq-answer dl-fade-in">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;
