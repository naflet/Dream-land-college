
import api from "./api";

const campusService = {
  // Get all campuses, including inactive campuses.
  async getAllCampuses() {
    const response = await api.get("/campuses/admin");
    return response?.data || [];
  },

  // Get one campus by ID.
  async getCampusById(id) {
    const response = await api.get(`/campuses/${id}`);
    return response?.data || null;
  },

  // Upload a campus image to Supabase Storage.
  async uploadImage(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    return await api.post("/campuses/upload-image", formData);
  },

  // Create a new campus.
  async createCampus(campusData) {
    return await api.post("/campuses", campusData);
  },

  // Update campus information or status.
  async updateCampus(id, campusData) {
    return await api.patch(`/campuses/${id}`, campusData);
  },

  // Delete a campus.
  async deleteCampus(id) {
    return await api.delete(`/campuses/${id}`);
  },
};

export default campusService;
