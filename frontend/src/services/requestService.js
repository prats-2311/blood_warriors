import api from "./api";

export const requestService = {
  // Create a new donation request with full database integration
  createRequest: async (requestData) => {
    try {
      const response = await api.post("/requests", {
        blood_group_id: requestData.blood_group_id,
        component_id: requestData.component_id,
        units_required: requestData.units_required,
        urgency: requestData.urgency,
        hospital_name: requestData.hospital_name,
        hospital_address: requestData.hospital_address,
        latitude: requestData.latitude,
        longitude: requestData.longitude,
        notes: requestData.notes,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
    }
  },

  // Get requests with advanced filtering and joins
  getRequests: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Add filters
      if (filters.status) params.append("status", filters.status);
      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.blood_group)
        params.append("blood_group", filters.blood_group);
      if (filters.patient_id) params.append("patient_id", filters.patient_id);
      if (filters.location) {
        params.append("latitude", filters.location.latitude);
        params.append("longitude", filters.location.longitude);
        params.append("radius", filters.location.radius || 10);
      }
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.offset) params.append("offset", filters.offset);

      const response = await api.get(`/requests?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching requests:", error);
      throw error;
    }
  },

  // Get a specific request with all related data
  getRequest: async (requestId) => {
    try {
      const response = await api.get(`/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching request:", error);
      throw error;
    }
  },

  // Update request details
  updateRequest: async (requestId, updateData) => {
    try {
      const response = await api.put(`/requests/${requestId}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  },

  // Delete/cancel a request
  deleteRequest: async (requestId) => {
    try {
      const response = await api.delete(`/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting request:", error);
      throw error;
    }
  },

  // Respond to a request (for donors)
  respondToRequest: async (requestId, donorResponse, message = null) => {
    try {
      const response = await api.post(`/requests/${requestId}/respond`, {
        response: donorResponse, // 'accept' or 'decline'
        message: message,
      });
      return response.data;
    } catch (error) {
      console.error("Error responding to request:", error);
      throw error;
    }
  },

  // Get all responses for a request (for patients)
  getRequestResponses: async (requestId) => {
    try {
      const response = await api.get(`/requests/${requestId}/responses`);
      return response.data;
    } catch (error) {
      console.error("Error fetching request responses:", error);
      throw error;
    }
  },

  // Update request status (for patients and system)
  updateRequestStatus: async (requestId, status, notes = null) => {
    try {
      const response = await api.put(`/requests/${requestId}/status`, {
        status,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  },

  // Get requests by patient ID
  getPatientRequests: async (patientId, filters = {}) => {
    try {
      const params = new URLSearchParams({ patient_id: patientId });

      if (filters.status) params.append("status", filters.status);
      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(
        `/patients/${patientId}/requests?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching patient requests:", error);
      throw error;
    }
  },

  // Get compatible requests for a donor
  getCompatibleRequests: async (donorId, filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.radius) params.append("radius", filters.radius);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(
        `/donors/${donorId}/compatible-requests?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching compatible requests:", error);
      throw error;
    }
  },

  // Search requests with advanced criteria
  searchRequests: async (searchCriteria) => {
    try {
      const response = await api.post("/requests/search", searchCriteria);
      return response.data;
    } catch (error) {
      console.error("Error searching requests:", error);
      throw error;
    }
  },

  // Get request statistics
  getRequestStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/requests/stats?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching request stats:", error);
      return {
        total: 0,
        byStatus: {},
        byUrgency: {},
        byBloodGroup: {},
      };
    }
  },

  // Get nearby requests using PostGIS
  getNearbyRequests: async (latitude, longitude, radius = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
      });

      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.blood_group)
        params.append("blood_group", filters.blood_group);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(`/requests/nearby?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching nearby requests:", error);
      throw error;
    }
  },

  // Mark request as fulfilled
  fulfillRequest: async (requestId, donationDetails = null) => {
    try {
      const response = await api.post(
        `/requests/${requestId}/fulfill`,
        donationDetails
      );
      return response.data;
    } catch (error) {
      console.error("Error fulfilling request:", error);
      throw error;
    }
  },

  // Get request history with audit trail
  getRequestHistory: async (requestId) => {
    try {
      const response = await api.get(`/requests/${requestId}/history`);
      return response.data;
    } catch (error) {
      console.error("Error fetching request history:", error);
      return [];
    }
  },

  // Validate request data before submission
  validateRequestData: (requestData) => {
    const errors = {};

    if (!requestData.blood_group_id) {
      errors.blood_group_id = "Blood group is required";
    }

    if (!requestData.component_id) {
      errors.component_id = "Blood component is required";
    }

    if (
      !requestData.units_required ||
      requestData.units_required < 1 ||
      requestData.units_required > 10
    ) {
      errors.units_required = "Units required must be between 1 and 10";
    }

    if (
      !requestData.urgency ||
      !["SOS", "Urgent", "Scheduled"].includes(requestData.urgency)
    ) {
      errors.urgency = "Valid urgency level is required";
    }

    if (
      requestData.hospital_name &&
      requestData.hospital_name.trim().length < 2
    ) {
      errors.hospital_name = "Hospital name must be at least 2 characters";
    }

    if (
      requestData.latitude &&
      (requestData.latitude < -90 || requestData.latitude > 90)
    ) {
      errors.latitude = "Invalid latitude value";
    }

    if (
      requestData.longitude &&
      (requestData.longitude < -180 || requestData.longitude > 180)
    ) {
      errors.longitude = "Invalid longitude value";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};
