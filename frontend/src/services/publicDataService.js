import api from "./api";

export const publicDataService = {
  // Get blood banks
  getBloodBanks: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/public-data/banks?${params}`);
    return response.data;
  },

  // Get blood stock
  getBloodStock: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/public-data/stock?${params}`);
    return response.data;
  },

  // Get blood groups
  getBloodGroups: async () => {
    const response = await api.get("/public-data/blood-groups");
    return response.data;
  },

  // Get blood components
  getBloodComponents: async () => {
    const response = await api.get("/public-data/blood-components");
    return response.data;
  },
};
