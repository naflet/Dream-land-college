
import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../AuthContext";

// ==========================================================
// ALLOWED SYSTEM ROLES
// ==========================================================

const VALID_ADMIN_ROLES = ["super_admin", "admin"];

// ==========================================================
// PROTECTED ROUTE
// ==========================================================

export default function ProtectedRoute({
  allowedRoles,
  fallbackTo = "/admin",
}) {
  const {
    isAuthenticated,
    loading,
    admin,
  } = useAuth();

  const location = useLocation();

  // ========================================================
  // VERIFYING SESSION
  // ========================================================

  if (loading) {
    return (
      <div className="admin-auth-loading">
        <div className="admin-spinner" />
        <p>Verifying administrator session...</p>
      </div>
    );
  }

  // ========================================================
  // CHECK AUTHENTICATION
  // ========================================================

  if (!isAuthenticated || !admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // ========================================================
  // NORMALIZE AND VALIDATE ROLE
  // ========================================================

  const userRole = String(admin.role || "")
    .trim()
    .toLowerCase();

  if (!VALID_ADMIN_ROLES.includes(userRole)) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // ========================================================
  // CHECK ROUTE-SPECIFIC PERMISSIONS
  // ========================================================

  if (allowedRoles !== undefined) {
    const normalizedAllowedRoles = Array.isArray(allowedRoles)
      ? allowedRoles.map((role) =>
          String(role).trim().toLowerCase()
        )
      : [];

    const hasPermission =
      normalizedAllowedRoles.length > 0 &&
      normalizedAllowedRoles.every((role) =>
        VALID_ADMIN_ROLES.includes(role)
      ) &&
      normalizedAllowedRoles.includes(userRole);

    if (!hasPermission) {
      return (
        <Navigate
          to={fallbackTo}
          replace
        />
      );
    }
  }

  // ========================================================
  // AUTHORIZED
  // ========================================================

  return <Outlet />;
}
