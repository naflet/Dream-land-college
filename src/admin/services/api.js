
const API_BASE_URL = (
  import.meta.env.DEV
    ? `https://${window.location.hostname}:5000/api`
    : import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

export const TOKEN_KEY = "dream_land_admin_token";
export const ADMIN_KEY = "dream_land_admin";

// =====================================================
// AUTHENTICATION
// Authentication is handled by the HttpOnly cookie.
// Never store JWT tokens in localStorage.
// =====================================================

export const getToken = () => null;

/**
 * Save only the non-sensitive administrator profile.
 */
export const saveAuth = (admin) => {
  if (!admin || typeof admin !== "object") {
    return;
  }

  const role = String(admin.role || "").toLowerCase();

  if (!["super_admin", "admin"].includes(role)) {
    return;
  }

  const safeAdmin = {
    id: admin.id,
    full_name: admin.full_name,
    email: admin.email,
    role,
    is_active: admin.is_active !== false,
  };

  localStorage.setItem(ADMIN_KEY, JSON.stringify(safeAdmin));
};

/**
 * Clear locally stored administrator information.
 */
export const clearAuth = () => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
};

/**
 * Retrieve the locally stored administrator profile.
 * This profile is not proof of authentication.
 * The backend must verify the HttpOnly cookie.
 */
export const getStoredAdmin = () => {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }

    const storedAdmin = localStorage.getItem(ADMIN_KEY);

    if (!storedAdmin) {
      return null;
    }

    const admin = JSON.parse(storedAdmin);
    const role = String(admin?.role || "").toLowerCase();

    if (
      !admin ||
      !admin.id ||
      !admin.email ||
      !["super_admin", "admin"].includes(role) ||
      admin.is_active === false
    ) {
      clearAuth();
      return null;
    }

    return {
      ...admin,
      role,
    };
  } catch (error) {
    console.error("Failed to read stored administrator:", error);
    clearAuth();
    return null;
  }
};

// =====================================================
// API REQUEST HANDLER
// =====================================================

const request = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error(
      "Backend API URL is missing. Set VITE_API_URL in your production environment."
    );
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const headers = {
    ...(isFormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${normalizedEndpoint}`,
      {
        ...options,
        headers,
        credentials: "include",
      }
    );
  } catch (error) {
    console.error("Admin API connection error:", error);

    throw new Error(
      `Cannot connect to the backend at ${API_BASE_URL}. Check that your backend is running and your network connection is available.`
    );
  }

  let result = null;

  const contentType = response.headers.get("content-type");

  try {
    if (contentType?.includes("application/json")) {
      result = await response.json();
    } else {
      const responseText = await response.text();

      if (responseText) {
        result = {
          message: responseText,
        };
      }
    }
  } catch {
    result = null;
  }

  // ===================================================
  // ERROR HANDLING
  // ===================================================

  if (!response.ok) {
    if (response.status === 401) {
      // A login request returning 401 means invalid
      // credentials, not necessarily an expired session.
      const isLoginRequest =
        normalizedEndpoint === "/auth/login" &&
        options.method === "POST";

      if (!isLoginRequest) {
        clearAuth();

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("admin-session-expired")
          );
        }
      }
    }

    throw new Error(
      result?.message ||
        result?.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return result;
};

// =====================================================
// API METHODS
// =====================================================

const api = {
  get: (endpoint) =>
    request(endpoint, {
      method: "GET",
    }),

  post: (endpoint, data) =>
    request(endpoint, {
      method: "POST",
      body:
        data instanceof FormData
          ? data
          : JSON.stringify(data ?? {}),
    }),

  patch: (endpoint, data) =>
    request(endpoint, {
      method: "PATCH",
      body:
        data instanceof FormData
          ? data
          : JSON.stringify(data ?? {}),
    }),

  put: (endpoint, data) =>
    request(endpoint, {
      method: "PUT",
      body:
        data instanceof FormData
          ? data
          : JSON.stringify(data ?? {}),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),
};

export default api;
