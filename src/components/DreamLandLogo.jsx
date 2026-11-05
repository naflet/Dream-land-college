import React from "react";
import dreamLandLogo from "../assets/dream-land-logo.png";
import "../styles/DreamLandLogo.css";

function DreamLandLogo({ size = "default", className = "" }) {
  return (
    <div className={`dl-logo-wrapper ${size} ${className}`}>
      <div className="dl-logo-icon-box">
        {/* Your PNG Logo Image */}
        <img
          src={dreamLandLogo}
          alt="Dream Land College"
          className="dl-logo-img"
        />

        {/* Pulsing glow aura on hover */}
        <div className="dl-logo-pulse" />
      </div>

      <div className="dl-logo-text-group">
        <span className="dl-logo-title">
          DREAM LAND <span className="dl-logo-highlight">COLLEGE</span>
        </span>
        <span className="dl-logo-subtitle">Excellence in Education</span>
      </div>
    </div>
  );
}

export default DreamLandLogo;