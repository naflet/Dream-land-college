
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import authService from "./services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // VERIFY ADMIN SESSION
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const currentAdmin = await authService.getCurrentAdmin();

        if (mounted) {
          setAdmin(currentAdmin);
        }
      } catch {
        authService.clearLocalAuth();

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
  // LOGIN
  // =====================================================

  const login = async (email, password) => {
    const response = await authService.login(email, password);

    setAdmin(response.admin);

    return response.admin;
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setAdmin(null);
    }
  };

  // =====================================================
  // UPDATE ADMIN INFORMATION
  // =====================================================

  const updateAdmin = (updatedAdmin) => {
    setAdmin(updatedAdmin);
  };

  // =====================================================
  // ROLE CHECKING
  // =====================================================

  const hasRole = (...roles) => {
    return !!admin && roles.includes(admin.role);
  };

  const value = {
    admin,
    loading,
    isAuthenticated: !!admin,
    login,
    logout,
    hasRole,
    updateAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
