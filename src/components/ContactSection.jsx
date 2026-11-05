
import React, { useState } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Clock3,
  Send,
  CheckCircle2,
} from "lucide-react";

import "../styles/ContactSection.css";

function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setSubmitted(true);

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });

    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  return (
    <section className="dl-contact-section">
      <div className="dl-contact-section-container">
        {/* Contact Information */}
        <div className="dl-contact-info">
          <div className="dl-contact-info-heading">
            <span className="dl-contact-eyebrow">GET IN TOUCH</span>

            <h2>We'd Love to Hear From You</h2>

            <p>
              Have a question about our programs, admissions, campuses, or
              anything else? Get in touch with Dream Land College.
            </p>
          </div>

          <div className="dl-contact-info-list">
            <div className="dl-contact-info-card">
              <div className="dl-contact-icon">
                <MapPin size={22} />
              </div>

              <div>
                <h3>Our Location</h3>
                <p>
                  Dream Land College
                  <br />
                  Ethiopia
                </p>
              </div>
            </div>

            <div className="dl-contact-info-card">
              <div className="dl-contact-icon">
                <Mail size={22} />
              </div>

              <div>
                <h3>Email Us</h3>
                <a href="mailto:info@dreamlandcollege.edu.et">
                  info@dreamlandcollege.edu.et
                </a>
              </div>
            </div>

            <div className="dl-contact-info-card">
              <div className="dl-contact-icon">
                <Phone size={22} />
              </div>

              <div>
                <h3>Call Us</h3>
                <a href="tel:+251000000000">
                  +251 00 000 0000
                </a>
              </div>
            </div>

            <div className="dl-contact-info-card">
              <div className="dl-contact-icon">
                <Clock3 size={22} />
              </div>

              <div>
                <h3>Office Hours</h3>
                <p>
                  Monday – Friday
                  <br />
                  8:00 AM – 5:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="dl-contact-form-wrapper">
          <div className="dl-contact-form-header">
            <span>CONTACT FORM</span>
            <h2>Send Us a Message</h2>
          </div>

          {submitted && (
            <div className="dl-contact-success">
              <CheckCircle2 size={21} />

              <div>
                <strong>Message sent successfully!</strong>
                <p>
                  Thank you for contacting Dream Land College. We will get
                  back to you soon.
                </p>
              </div>
            </div>
          )}

          <form
            className="dl-contact-form"
            onSubmit={handleSubmit}
          >
            <div className="dl-contact-form-grid">
              <div className="dl-contact-field">
                <label htmlFor="contact-name">Full Name</label>

                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="dl-contact-field">
                <label htmlFor="contact-email">Email Address</label>

                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="dl-contact-field">
                <label htmlFor="contact-phone">Phone Number</label>

                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="dl-contact-field">
                <label htmlFor="contact-subject">Subject</label>

                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is your message about?"
                  required
                />
              </div>
            </div>

            <div className="dl-contact-field">
              <label htmlFor="contact-message">Message</label>

              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                rows="7"
                required
              />
            </div>

            <button
              type="submit"
              className="dl-contact-submit"
            >
              <span>Send Message</span>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
