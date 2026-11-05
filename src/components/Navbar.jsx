import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Building2,
  Images,
  Newspaper,
  Briefcase,
  GraduationCap,
  Phone,
  LogIn,
  ArrowUpRight,
} from "lucide-react";

import DreamLandLogo from "./DreamLandLogo";
import "../styles/Navbar.css";

const aboutLinks = [
  { label: "About College", to: "/about", icon: BookOpen },
  { label: "Campuses", to: "/campuses", icon: Building2 },
  { label: "Gallery", to: "/gallery", icon: Images },
];

const newsLinks = [
  { label: "News & Events", to: "/news", icon: Newspaper },
  { label: "Vacancies", to: "/vacancies", icon: Briefcase },
  { label: "Admissions", to: "/admissions", icon: GraduationCap },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);

  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setAboutOpen(false);
    setNewsOpen(false);
  };

  return (
    <header className="dl-navbar-wrapper">
      <div className="dl-topbar">
        <div className="dl-navbar-container">
          <div className="dl-topbar-left">
            <span className="dl-announcement-pill">
              <span className="dl-announcement-dot" />
              Admissions are open
            </span>

            <span className="dl-topbar-message">
              Start your journey at Dream Land College.
            </span>
          </div>

          <div className="dl-topbar-right">
            <a href="tel:+251000000000">
              <Phone size={14} />
              <span>Contact Admissions</span>
            </a>
          </div>
        </div>
      </div>

      <nav className="dl-navbar">
        <div className="dl-navbar-container dl-navbar-inner">
          <Link
            to="/"
            className="dl-brand"
            onClick={closeMobile}
            aria-label="Dream Land College home"
          >
            <DreamLandLogo />
          </Link>

          <div className="dl-desktop-nav">
            <Link
              to="/"
              className={`dl-nav-link ${
                isActive("/") ? "active" : ""
              }`}
            >
              Home
            </Link>

            <div
              className="dl-nav-dropdown"
              onMouseEnter={() => setAboutOpen(true)}
              onMouseLeave={() => setAboutOpen(false)}
            >
              <button
                className={`dl-nav-link dl-nav-dropdown-trigger ${
                  isActive("/about") ||
                  isActive("/campuses") ||
                  isActive("/gallery")
                    ? "active"
                    : ""
                }`}
                type="button"
              >
                About
                <ChevronDown size={14} className={aboutOpen ? "rotate" : ""} />
              </button>

              {aboutOpen && (
                <div className="dl-dropdown-menu">
                  {aboutLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="dl-dropdown-item"
                        onClick={() => setAboutOpen(false)}
                      >
                        <span className="dl-dropdown-icon">
                          <Icon size={16} />
                        </span>

                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/programs"
              className={`dl-nav-link ${
                isActive("/programs") ? "active" : ""
              }`}
            >
              Programs
            </Link>

            <Link
              to="/library"
              className={`dl-nav-link ${
                isActive("/library") ? "active" : ""
              }`}
            >
              Library
            </Link>

            <Link
              to="/staff"
              className={`dl-nav-link ${
                isActive("/staff") ? "active" : ""
              }`}
            >
              Staff
            </Link>

            <div
              className="dl-nav-dropdown"
              onMouseEnter={() => setNewsOpen(true)}
              onMouseLeave={() => setNewsOpen(false)}
            >
              <button
                className={`dl-nav-link dl-nav-dropdown-trigger ${
                  isActive("/news") ||
                  isActive("/vacancies") ||
                  isActive("/admissions")
                    ? "active"
                    : ""
                }`}
                type="button"
              >
                News & Events
                <ChevronDown size={14} className={newsOpen ? "rotate" : ""} />
              </button>

              {newsOpen && (
                <div className="dl-dropdown-menu">
                  {newsLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="dl-dropdown-item"
                        onClick={() => setNewsOpen(false)}
                      >
                        <span className="dl-dropdown-icon">
                          <Icon size={16} />
                        </span>

                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/contact"
              className={`dl-nav-link ${
                isActive("/contact") ? "active" : ""
              }`}
            >
              Contact
            </Link>
          </div>

          <div className="dl-navbar-actions">
            <button
              type="button"
              className="dl-portal-button"
              onClick={() =>
                window.dispatchEvent(new Event("open-dl-portal"))
              }
            >
              <LogIn size={16} />
              <span>Portal Login</span>
            </button>

            <Link to="/application" className="dl-apply-button">
              Apply Online
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            className="dl-mobile-menu-button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="dl-mobile-menu">
            <div className="dl-mobile-menu-inner">
              <Link
                to="/"
                className={`dl-mobile-link ${
                  isActive("/") ? "active" : ""
                }`}
                onClick={closeMobile}
              >
                Home
              </Link>

              <button
                type="button"
                className="dl-mobile-link dl-mobile-dropdown-button"
                onClick={() => setAboutOpen((value) => !value)}
              >
                <span>About</span>
                <ChevronDown
                  size={17}
                  className={aboutOpen ? "rotate" : ""}
                />
              </button>

              {aboutOpen && (
                <div className="dl-mobile-submenu">
                  {aboutLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                to="/programs"
                className={`dl-mobile-link ${
                  isActive("/programs") ? "active" : ""
                }`}
                onClick={closeMobile}
              >
                Programs
              </Link>

              <Link
                to="/library"
                className={`dl-mobile-link ${
                  isActive("/library") ? "active" : ""
                }`}
                onClick={closeMobile}
              >
                Library
              </Link>

              <Link
                to="/staff"
                className={`dl-mobile-link ${
                  isActive("/staff") ? "active" : ""
                }`}
                onClick={closeMobile}
              >
                Staff
              </Link>

              <button
                type="button"
                className="dl-mobile-link dl-mobile-dropdown-button"
                onClick={() => setNewsOpen((value) => !value)}
              >
                <span>News & Events</span>
                <ChevronDown
                  size={17}
                  className={newsOpen ? "rotate" : ""}
                />
              </button>

              {newsOpen && (
                <div className="dl-mobile-submenu">
                  {newsLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                to="/contact"
                className={`dl-mobile-link ${
                  isActive("/contact") ? "active" : ""
                }`}
                onClick={closeMobile}
              >
                Contact
              </Link>

              <div className="dl-mobile-actions">
                <button
                  type="button"
                  className="dl-portal-button dl-mobile-portal-btn"
                  onClick={() => {
                    closeMobile();
                    window.dispatchEvent(new Event("open-dl-portal"));
                  }}
                >
                  <LogIn size={17} />
                  <span>Portal Login</span>
                </button>

                <Link
                  to="/application"
                  className="dl-apply-button dl-mobile-apply-btn"
                  onClick={closeMobile}
                >
                  <span>Apply Online</span>
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;