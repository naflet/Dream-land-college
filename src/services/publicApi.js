
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://localhost:5000/api"
).replace(/\/+$/, "");

const publicRequest = async (endpoint) => {
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
};

const publicApi = {
  get: (endpoint) => publicRequest(endpoint),
};

export default publicApi;
