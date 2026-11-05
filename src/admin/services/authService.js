
import api, {
  saveAuth,
  clearAuth,
  getStoredAdmin,
} from "./api";

const authService = {
  async login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    if (!response?.token || !response?.admin) {
      throw new Error("Invalid login response from the server.");
    }

    saveAuth(response.token, response.admin);

    return response;
  },

  async getCurrentAdmin() {
    const response = await api.get("/auth/me");

    if (response?.admin) {
      return response.admin;
    }

    throw new Error("Unable to retrieve administrator information.");
  },

  getStoredAdmin() {
    return getStoredAdmin();
  },

  logout() {
    clearAuth();
  },
};

export default authService;
