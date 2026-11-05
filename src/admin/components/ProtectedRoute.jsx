
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, admin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-auth-loading">
        <div className="admin-spinner" />
        <p>Verifying administrator session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <Outlet />;
}
