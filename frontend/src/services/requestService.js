import api from "./api";

export const requestService = {
  // Create a new donation request
  createRequest: async (requestData) => {
    const response = await api.post("/requests", requestData);
    return response.data;
  },

  // Get all requests
  getRequests: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/requests?${params}`);
    return response.data;
  },

  // Get a specific request
  getRequest: async (requestId) => {
    const response = await api.get(`/requests/${requestId}`);
    return response.data;
  },

  // Respond to a request (for donors)
  respondToRequest: async (requestId, response) => {
    const result = await api.post(`/requests/${requestId}/respond`, {
      response,
    });
    return result.data;
  },

  // Update request status (for patients)
  updateRequestStatus: async (requestId, status) => {
    const response = await api.put(`/requests/${requestId}/status`, { status });
    return response.data;
  },
};
