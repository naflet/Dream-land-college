
import api, { clearAuth } from "./api";

const authService = {
  /**
   * Administrator login
   * The backend sets the HttpOnly authentication cookie.
   */
  async login(email, password) {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });

    const admin = response?.admin || response?.data?.admin;

    if (!response?.success || !admin) {
      throw new Error(
        response?.message || "Invalid login response from the server."
      );
    }

    // Do not clear authentication here.
    // The backend has already set the HttpOnly session cookie.
    // AuthContext will save the safe administrator profile.

    return {
      ...response,
      admin,
    };
  },

  /**
   * Retrieve the currently authenticated administrator.
   */
  async getCurrentAdmin() {
    const response = await api.get("/auth/me");

    const admin = response?.admin || response?.data?.admin;

    if (!response?.success || !admin) {
      throw new Error(
        response?.message ||
          "Unable to retrieve administrator information."
      );
    }

    return admin;
  },

  /**
   * Administrator logout
   */
  async logout() {
    try {
      await api.post("/auth/logout", {});
    } finally {
      // Clear the locally stored administrator profile.
      // The backend is responsible for clearing the HttpOnly cookie.
      clearAuth();
    }
  },

  /**
   * Clear local authentication information.
   */
  clearLocalAuth() {
    clearAuth();
  },
};

export default authService;
