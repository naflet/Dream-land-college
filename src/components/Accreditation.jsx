import React, { useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  X,
  ZoomIn
} from "lucide-react";

import "../styles/Accreditation.css";

const documents = [
  {
    number: "01",
    title: "Degree Accreditations",
    authority: "FDRE Education and Training Authority (ETA)",
    program: "Degree Regular Programs",
    image:
      "https://backend-web.dreamland.et/media/licenses/DEGREE_BUMA_ACFN_2015-2020_t78PbBg.jpg",
    url:
      "https://backend-web.dreamland.et/media/licenses/DEGREE_BUMA_ACFN_2015-2020_t78PbBg.jpg",
  },
  {
    number: "02",
    title: "TVET Accreditations",
    authority: "TVET Authority / ETA",
    program: "TVET Programs",
    image:
      "https://backend-web.dreamland.et/media/licenses/AAC_TVET_1.jpg",
    url:
      "https://backend-web.dreamland.et/media/licenses/AAC_TVET_1.jpg",
  },
];

const credentials = [
  "Bachelor's Degrees",
  "TVET Diplomas and Certificates",
  "Continuing Education Certificates",
];

const authorities = [
  "Education and Training Authority (ETA)",
  "Ministry of Education",
  "Relevant regional education authorities and bureaus",
];

const verificationSteps = [
  "Visit the official ETA or Ministry of Education platform.",
  'Search for "Dream Land College" in the relevant institution or accreditation records.',
  "Cross-reference the institution information with the official documents provided on this page.",
];

function Accreditation() {
  const [selectedDocument, setSelectedDocument] = useState(null);

  return (
    <>
      <section className="dl-accreditation" id="accreditation">
        <div className="dl-container">
          
          {/* HEADING */}
          <div className="dl-accreditation-heading">
            <div>
              <span className="dl-section-label">
                VERIFIABLE CREDENTIALS
              </span>
              <h2>
                ETA Accredited &amp; <span>Verifiable</span>
              </h2>
            </div>
            <p>
              Dream Land College maintains official education and
              training accreditation and licensing documentation.
              Browse the documents below for transparency and
              verification.
            </p>
          </div>

          {/* STATUS + CREDENTIALS */}
          <div className="dl-accreditation-overview">
            <article className="dl-accreditation-status dl-hover-lift">
              <div className="dl-accreditation-icon">
                <ShieldCheck size={25} />
              </div>
              <div>
                <span>ACCREDITATION STATUS</span>
                <h3>Education and Training Authority (ETA)</h3>
                <p>
                  Dream Land College is an ETA-accredited
                  institution. Official accreditation and license
                  documents are provided below for verification.
                </p>
              </div>
            </article>

            <article className="dl-accreditation-status dl-hover-lift">
              <div className="dl-accreditation-icon">
                <GraduationCap size={25} />
              </div>
              <div>
                <span>CREDENTIALS</span>
                <h3>Recognized Learning Pathways</h3>
                <div className="dl-accreditation-tags">
                  {credentials.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </article>
          </div>

          {/* DOCUMENTS HEADING */}
          <div className="dl-accreditation-section-heading">
            <span>OFFICIAL DOCUMENTS</span>
            <h3>Licenses &amp; Accreditation Certificates</h3>
            <p>
              Official documents currently provided for
              verification. Select any document to view it in
              full size.
            </p>
          </div>

          {/* DOCUMENTS GRID */}
          <div className="dl-accreditation-documents">
            {documents.map((document) => (
              <article
                className="dl-accreditation-document dl-hover-lift"
                key={document.number}
              >
                <button
                  type="button"
                  className="dl-accreditation-image-button"
                  onClick={() => setSelectedDocument(document)}
                  aria-label={`View ${document.title}`}
                >
                  <img
                    src={document.image}
                    alt={document.title}
                    loading="lazy"
                  />
                  <span className="dl-accreditation-number">
                    {document.number}
                  </span>
                  <span className="dl-accreditation-image-overlay">
                    <ZoomIn size={18} />
                    View Full Document
                  </span>
                </button>

                <div className="dl-accreditation-document-body">
                  <span>{document.authority}</span>
                  <h3>{document.title}</h3>
                  <strong>{document.program}</strong>

                  <a
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Official Document
                    <ArrowRight size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* VERIFICATION & BODIES */}
          <div className="dl-accreditation-bottom">
            <article className="dl-accreditation-info">
              <div className="dl-accreditation-info-title">
                <ShieldCheck size={20} />
                <h3>Accrediting &amp; Oversight Bodies</h3>
              </div>
              <ul>
                {authorities.map((authority) => (
                  <li key={authority}>
                    <ShieldCheck size={14} className="dl-text-green" />
                    <span>{authority}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="dl-accreditation-info">
              <div className="dl-accreditation-info-title">
                <FileCheck2 size={20} />
                <h3>Verification Process</h3>
              </div>
              <ol>
                {verificationSteps.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </article>
          </div>

        </div>
      </section>

      {/* DOCUMENT VIEWER MODAL */}
      {selectedDocument && (
        <div
          className="dl-accreditation-modal dl-fade-in"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="dl-accreditation-modal-content dl-scale-up"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="dl-accreditation-modal-close"
              onClick={() => setSelectedDocument(null)}
              aria-label="Close document viewer"
            >
              <X size={20} />
            </button>

            <div className="dl-accreditation-modal-header">
              <span>{selectedDocument.authority}</span>
              <h3>{selectedDocument.title}</h3>
            </div>

            <div className="dl-accreditation-modal-image">
              <img
                src={selectedDocument.image}
                alt={selectedDocument.title}
              />
            </div>

            <a
              href={selectedDocument.url}
              target="_blank"
              rel="noreferrer"
              className="dl-accreditation-modal-link"
            >
              Open Original Document File
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default Accreditation;