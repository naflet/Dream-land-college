
import api, { clearAuth } from "./api";

const authService = {
  async login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    if (!response?.success || !response?.admin) {
      throw new Error("Invalid login response from the server.");
    }

    // The server has already set the HttpOnly cookie.
    clearAuth();

    return response;
  },

  async getCurrentAdmin() {
    const response = await api.get("/auth/me");

    if (response?.admin) {
      return response.admin;
    }

    throw new Error("Unable to retrieve administrator information.");
  },

  async logout() {
    try {
      await api.post("/auth/logout", {});
    } finally {
      clearAuth();
    }
  },

  clearLocalAuth() {
    clearAuth();
  },
};

export default authService;
