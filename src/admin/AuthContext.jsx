import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import authService from "./services/authService";
import {
  getToken,
  saveAuth,
} from "./services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      if (!getToken()) {
        if (mounted) {
          setAdmin(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentAdmin = await authService.getCurrentAdmin();

        if (mounted) {
          setAdmin(currentAdmin);
        }
      } catch {
        authService.logout();

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

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setAdmin(response.admin);
    return response.admin;
  };

  const logout = () => {
    authService.logout();
    setAdmin(null);
  };

  const updateAdmin = (updatedAdmin) => {
    const token = getToken();

    if (token) {
      saveAuth(token, updatedAdmin);
    }

    setAdmin(updatedAdmin);
  };

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