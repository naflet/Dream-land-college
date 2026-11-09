
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Globe,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Award,
} from "lucide-react";

import dreamLandLogo from "../assets/dream-land-logo.png";
import "../styles/Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dl-footer">
      {/* Decorative Top Glow Line */}
      <div className="dl-footer-glow-bar"></div>

      <div className="dl-footer-main dl-container">
        {/* Brand Column */}
        <div className="dl-footer-brand">
          <Link to="/" className="dl-footer-logo-wrapper">
            <img
              src={dreamLandLogo}
              alt="Dream Land College"
              className="dl-footer-logo-image"
            />
          </Link>

          <p className="dl-footer-description">
            Committed to providing high-quality, practical, and accessible
            higher education and technical skills across Ethiopia.
          </p>

          <div className="dl-footer-badges">
            <span className="dl-footer-badge">
              <Award size={14} />
              Accredited Institution
            </span>

            <span className="dl-footer-badge">
              <ShieldCheck size={14} />
              Verified Credentials
            </span>
          </div>

          <div className="dl-footer-socials">
            <a
              href="#"
              className="dl-footer-social"
              aria-label="Website"
            >
              <Globe size={18} />
            </a>

            <a
              href="#"
              className="dl-footer-social"
              aria-label="Social media"
            >
              <Share2 size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="dl-footer-column">
          <h3>Quick Links</h3>

          <ul className="dl-footer-links-list">
            <li>
              <Link to="/programs">Degree Programs</Link>
            </li>

            <li>
              <Link to="/tvet">TVET Qualification</Link>
            </li>

            <li>
              <Link to="/campuses">Campuses &amp; Centers</Link>
            </li>

            <li>
              <Link to="/credentials">Verifiable Credentials</Link>
            </li>
          </ul>
        </div>

        {/* Campuses Column */}
        <div className="dl-footer-column">
          <h3>Campuses</h3>

          <ul className="dl-footer-links-list">
            <li>
              <Link to="/campuses/addis-ababa">
                Addis Ababa Main Campus
              </Link>
            </li>

            <li>
              <Link to="/campuses/asella">
                Asella TVET &amp; Degree Hub
              </Link>
            </li>

            <li>
              <Link to="/campuses/bale">
                Bale Robe Regional Center
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Registrar Column */}
        <div className="dl-footer-column dl-footer-contact">
          <h3>Contact Registrar</h3>

          <div className="dl-footer-contact-item">
            <span className="dl-footer-contact-icon">
              <Phone size={16} />
            </span>

            <div className="dl-footer-contact-text">
              <span className="dl-contact-label">
                Phone Support
              </span>

              <a href="tel:+251116123456">
                +251 11 612 3456
              </a>
            </div>
          </div>

          <div className="dl-footer-contact-item">
            <span className="dl-footer-contact-icon">
              <Mail size={16} />
            </span>

            <div className="dl-footer-contact-text">
              <span className="dl-contact-label">
                Email Inquiries
              </span>

              <a href="mailto:info@dreamlandcollege.edu.et">
                info@dreamlandcollege.edu.et
              </a>
            </div>
          </div>

          <div className="dl-footer-contact-item">
            <span className="dl-footer-contact-icon">
              <MapPin size={16} />
            </span>

            <div className="dl-footer-contact-text">
              <span className="dl-contact-label">
                Locations
              </span>

              <p>Addis Ababa, Asella &amp; Bale Robe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="dl-footer-bottom">
        <div className="dl-container dl-footer-bottom-inner">
          <p>
            &copy; {currentYear} Dream Land College Ethiopia.
            All Rights Reserved.
          </p>

          <div className="dl-footer-bottom-links">
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>

            <Link
              to="/application"
              className="dl-footer-apply-btn"
            >
              Apply Online
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
