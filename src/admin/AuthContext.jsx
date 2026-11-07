
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import authService from "./services/authService";

const AuthContext = createContext(null);

const ADMIN_STORAGE_KEY = "dream_land_admin";

const normalizeRole = (role) =>
  String(role || "").trim().toLowerCase();

const normalizeAdmin = (value) => {
  const admin =
    value?.admin ||
    value?.data?.admin ||
    value?.data ||
    value;

  if (!admin || typeof admin !== "object") {
    return null;
  }

  const role = normalizeRole(admin.role);

  if (!["super_admin", "admin"].includes(role)) {
    return null;
  }

  if (!admin.id || !admin.email) {
    return null;
  }

  // Never store or expose a password hash or authentication token.
  return {
    id: admin.id,
    full_name: admin.full_name || "",
    email: admin.email,
    role,
    is_active: admin.is_active ?? true,
    last_login: admin.last_login || null,
  };
};

const saveLocalAdmin = (admin) => {
  try {
    if (admin) {
      localStorage.setItem(
        ADMIN_STORAGE_KEY,
        JSON.stringify(admin)
      );
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Unable to update the local admin profile:", error);
  }
};

const clearLocalAdmin = () => {
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem("dream_land_admin_token");
  } catch (error) {
    console.warn("Unable to clear local admin data:", error);
  }

  try {
    authService.clearLocalAuth?.();
  } catch (error) {
    console.warn("Unable to clear local authentication data:", error);
  }
};

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // UPDATE ADMIN PROFILE
  // =====================================================

  const updateAdmin = useCallback((updatedAdmin) => {
    const safeAdmin = normalizeAdmin(updatedAdmin);

    setAdmin(safeAdmin);
    saveLocalAdmin(safeAdmin);

    return safeAdmin;
  }, []);

  // =====================================================
  // VERIFY ADMIN SESSION
  // The backend validates the HttpOnly cookie.
  // Local storage is not treated as proof of authentication.
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const response = await authService.getCurrentAdmin();
        const currentAdmin = normalizeAdmin(response);

        if (!currentAdmin) {
          throw new Error("Your administrator session is invalid.");
        }

        if (mounted) {
          setAdmin(currentAdmin);
          saveLocalAdmin(currentAdmin);
        }
      } catch (error) {
        clearLocalAdmin();

        if (mounted) {
          setAdmin(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // HANDLE SESSION EXPIRATION
  // =====================================================

  useEffect(() => {
    const handleSessionExpired = () => {
      setAdmin(null);
      clearLocalAdmin();
    };

    window.addEventListener(
      "admin-session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "admin-session-expired",
        handleSessionExpired
      );
    };
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const login = useCallback(async (email, password) => {
    const response = await authService.login(
      String(email || "").trim().toLowerCase(),
      password
    );

    const loggedInAdmin = normalizeAdmin(response);

    if (!loggedInAdmin) {
      throw new Error(
        "Login succeeded, but the server did not return a valid administrator profile."
      );
    }

    if (loggedInAdmin.is_active === false) {
      clearLocalAdmin();
      throw new Error("This administrator account is inactive.");
    }

    setAdmin(loggedInAdmin);
    saveLocalAdmin(loggedInAdmin);

    return loggedInAdmin;
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAdmin(null);
      clearLocalAdmin();
    }
  }, []);

  // =====================================================
  // ROLE CHECKING
  // =====================================================

  const hasRole = useCallback(
    (...roles) => {
      if (!admin) return false;

      const currentRole = normalizeRole(admin.role);

      return roles
        .map(normalizeRole)
        .includes(currentRole);
    },
    [admin]
  );

  const isSuperAdmin = hasRole("super_admin");
  const isAdmin = hasRole("admin");
  const isAuthenticated = Boolean(admin);

  const value = useMemo(
    () => ({
      admin,
      loading,
      isAuthenticated,
      isSuperAdmin,
      isAdmin,
      login,
      logout,
      hasRole,
      updateAdmin,
    }),
    [
      admin,
      loading,
      isAuthenticated,
      isSuperAdmin,
      isAdmin,
      login,
      logout,
      hasRole,
      updateAdmin,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// AUTHENTICATION HOOK
// =====================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
