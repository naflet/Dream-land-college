
const API_BASE_URL = (
  import.meta.env.DEV
    ? `https://${window.location.hostname}:5000/api`
    : import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

export const TOKEN_KEY = "dream_land_admin_token";
export const ADMIN_KEY = "dream_land_admin";

// JWT authentication is handled by the HttpOnly cookie.
export const getToken = () => null;

// No authentication details are stored in localStorage.
export const saveAuth = () => {
  clearAuth();
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
};

export const getStoredAdmin = () => null;

// Remove legacy authentication.
if (typeof window !== "undefined") {
  clearAuth();
}

// Main API request.
const request = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error(
      "Backend API URL is missing. Set VITE_API_URL in your production environment."
    );
  }

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    console.error("Admin API connection error:", error);

    throw new Error(
      `Cannot connect to the backend at ${API_BASE_URL}. Check that your backend is running and your network connection is available.`
    );
  }

  const contentType = response.headers.get("content-type");

  let result = null;

  if (contentType?.includes("application/json")) {
    result = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
    }

    throw new Error(
      result?.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
};

// API methods.
const api = {
  get: (endpoint) => request(endpoint),

  post: (endpoint, data) =>
    request(endpoint, {
      method: "POST",
      body:
        data instanceof FormData
          ? data
          : JSON.stringify(data),
    }),

  patch: (endpoint, data) =>
    request(endpoint, {
      method: "PATCH",
      body:
        data instanceof FormData
          ? data
          : JSON.stringify(data),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),
};

export default api;
