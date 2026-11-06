
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://192.168.137.1:5000/api"
).replace(/\/+$/, "");

const publicRequest = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    const contentType = response.headers.get("content-type");

    const result = contentType?.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      throw new Error(
        result?.message || `Request failed with status ${response.status}.`
      );
    }

    return result;
  } catch (error) {
    console.error("Public API request failed:", error);
    throw error;
  }
};

const publicApi = {
  get: (endpoint) => publicRequest(endpoint),
};

export default publicApi;
