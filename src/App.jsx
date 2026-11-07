
import React, { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

// ==========================================================
// PUBLIC WEBSITE PAGES
// ==========================================================

import Home from "./pages/Home";
import About from "./pages/About";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Admissions from "./pages/Admissions";
import Application from "./pages/Application";
import Campuses from "./pages/Campuses";
import Gallery from "./pages/Gallery";
import Library from "./pages/Library";
import Staff from "./pages/Staff";
import News from "./pages/News";
import Vacancies from "./pages/Vacancies";
import Contact from "./pages/Contact";

// ==========================================================
// ADMIN AUTHENTICATION AND LAYOUT
// ==========================================================

import { AuthProvider } from "./admin/AuthContext";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import AdminLayout from "./admin/components/AdminLayout";

// ==========================================================
// ADMIN PAGES
// ==========================================================

import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminCampuses from "./admin/pages/AdminCampuses";
import AdminPrograms from "./admin/pages/AdminPrograms";
import AdminStaff from "./admin/pages/AdminStaff";
import AdminNews from "./admin/pages/AdminNews";
import AdminAcademicCalendar from "./admin/pages/AdminAcademicCalendar";
import AdminTestimonials from "./admin/pages/AdminTestimonials";
import AdminGallery from "./admin/pages/AdminGallery";
import AdminLibrary from "./admin/pages/AdminLibrary";
import AdminApplications from "./admin/pages/AdminApplications";
import AdminConsultations from "./admin/pages/AdminConsultations";
import AdminContactMessages from "./admin/pages/AdminContactMessages";
import AdminVacancies from "./admin/pages/AdminVacancies";
import AdminJobApplications from "./admin/pages/AdminJobApplications";
import AdminProfile from "./admin/pages/AdminProfile";

// Super Admin only
import AdminManagement from "./admin/pages/AdminManagement";

// ==========================================================
// GLOBAL STYLES
// ==========================================================

import "./styles/global.css";

// ==========================================================
// ROLE CONFIGURATION
// ==========================================================

const ADMIN_ROLES = ["super_admin", "admin"];

const SUPER_ADMIN_ONLY = ["super_admin"];

// ==========================================================
// SCROLL TO TOP ON ROUTE CHANGE
// ==========================================================

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}

// ==========================================================
// MAIN APP
// ==========================================================

function App() {
  return (
    <BrowserRouter basename="/Dream-land-college">
      <AuthProvider>
        <ScrollToTop />

        <Routes>

          {/* ==================================================
              PUBLIC WEBSITE ROUTES
          ================================================== */}

          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />

          <Route path="/programs" element={<Programs />} />

          <Route
            path="/programs/:programId"
            element={<ProgramDetail />}
          />

          <Route
            path="/admissions"
            element={<Admissions />}
          />

          <Route
            path="/application"
            element={<Application />}
          />

          <Route
            path="/campuses"
            element={<Campuses />}
          />

          <Route
            path="/gallery"
            element={<Gallery />}
          />

          <Route
            path="/library"
            element={<Library />}
          />

          <Route
            path="/staff"
            element={<Staff />}
          />

          <Route
            path="/news"
            element={<News />}
          />

          <Route
            path="/vacancies"
            element={<Vacancies />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          {/* ==================================================
              ADMIN LOGIN
          ================================================== */}

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* ==================================================
              PROTECTED ADMIN ROUTES

              Only Super Admin and Admin can enter.
          ================================================== */}

          <Route
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES} />
            }
          >
            <Route
              path="/admin"
              element={<AdminLayout />}
            >
              {/* ==================================================
                  DASHBOARD
              ================================================== */}

              <Route
                index
                element={<AdminDashboard />}
              />

              {/* ==================================================
                  COLLEGE MANAGEMENT
                  Super Admin + Admin
              ================================================== */}

              <Route
                path="campuses"
                element={<AdminCampuses />}
              />

              <Route
                path="programs"
                element={<AdminPrograms />}
              />

              <Route
                path="staff"
                element={<AdminStaff />}
              />

              {/* ==================================================
                  WEBSITE CONTENT
                  Super Admin + Admin
              ================================================== */}

              <Route
                path="news"
                element={<AdminNews />}
              />

              <Route
                path="academic-calendar"
                element={<AdminAcademicCalendar />}
              />

              <Route
                path="testimonials"
                element={<AdminTestimonials />}
              />

              <Route
                path="gallery"
                element={<AdminGallery />}
              />

              <Route
                path="library"
                element={<AdminLibrary />}
              />

              {/* ==================================================
                  STUDENT SERVICES
                  Super Admin + Admin
              ================================================== */}

              <Route
                path="applications"
                element={<AdminApplications />}
              />

              <Route
                path="consultations"
                element={<AdminConsultations />}
              />

              <Route
                path="contact-messages"
                element={<AdminContactMessages />}
              />

              {/* ==================================================
                  CAREER MANAGEMENT
                  Super Admin + Admin
              ================================================== */}

              <Route
                path="vacancies"
                element={<AdminVacancies />}
              />

              <Route
                path="job-applications"
                element={<AdminJobApplications />}
              />

              {/* ==================================================
                  PERSONAL ACCOUNT
                  Both roles can manage their own profile.
              ================================================== */}

              <Route
                path="profile"
                element={<AdminProfile />}
              />

              {/* ==================================================
                  ADMINISTRATOR MANAGEMENT

                  SUPER ADMIN ONLY

                  Admin cannot access this route.
              ================================================== */}

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={SUPER_ADMIN_ONLY}
                  />
                }
              >
                <Route
                  path="administrators"
                  element={<AdminManagement />}
                />
              </Route>

            </Route>
          </Route>

          {/* ==================================================
              CATCH-ALL FALLBACK
          ================================================== */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
