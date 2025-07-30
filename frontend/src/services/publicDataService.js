import api from "./api";

export const publicDataService = {
  // Get all blood groups from bloodgroups table
  getBloodGroups: async () => {
    try {
      const response = await api.get("/public/blood-groups");
      return response.data;
    } catch (error) {
      console.error("Error fetching blood groups:", error);
      // Return fallback data
      return {
        data: [
          { blood_group_id: 1, group_name: "A+" },
          { blood_group_id: 2, group_name: "A-" },
          { blood_group_id: 3, group_name: "B+" },
          { blood_group_id: 4, group_name: "B-" },
          { blood_group_id: 5, group_name: "AB+" },
          { blood_group_id: 6, group_name: "AB-" },
          { blood_group_id: 7, group_name: "O+" },
          { blood_group_id: 8, group_name: "O-" },
        ],
      };
    }
  },

  // Get all blood components from bloodcomponents table
  getBloodComponents: async () => {
    try {
      const response = await api.get("/public/blood-components");
      return response.data;
    } catch (error) {
      console.error("Error fetching blood components:", error);
      // Return fallback data
      return {
        data: [
          { component_id: 1, component_name: "Whole Blood" },
          { component_id: 2, component_name: "Packed Red Blood Cells" },
          { component_id: 3, component_name: "Platelets" },
          { component_id: 4, component_name: "Plasma" },
          { component_id: 5, component_name: "Cryoprecipitate" },
        ],
      };
    }
  },

  // Get blood banks with location-based filtering
  getBloodBanks: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.city) params.append("city", filters.city);
      if (filters.state) params.append("state", filters.state);
      if (filters.category) params.append("category", filters.category);
      if (filters.latitude && filters.longitude) {
        params.append("latitude", filters.latitude);
        params.append("longitude", filters.longitude);
        params.append("radius", filters.radius || 10);
      }
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(`/public/blood-banks?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching blood banks:", error);
      throw error;
    }
  },

  // Get blood bank by ID with full details
  getBloodBank: async (bankId) => {
    try {
      const response = await api.get(`/public/blood-banks/${bankId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching blood bank:", error);
      throw error;
    }
  },

  // Get blood stock for a bank from bloodstock table
  getBloodStock: async (bankId) => {
    try {
      const response = await api.get(`/public/blood-banks/${bankId}/stock`);
      return response.data;
    } catch (error) {
      console.error("Error fetching blood stock:", error);
      throw error;
    }
  },

  // Get nearby blood banks using PostGIS
  getNearbyBloodBanks: async (latitude, longitude, radius = 10) => {
    try {
      const response = await api.get("/public/blood-banks/nearby", {
        params: { latitude, longitude, radius },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching nearby blood banks:", error);
      throw error;
    }
  },

  // Search donors with compatibility matching
  searchDonors: async (criteria = {}) => {
    try {
      const params = new URLSearchParams();

      if (criteria.blood_group)
        params.append("blood_group", criteria.blood_group);
      if (criteria.city) params.append("city", criteria.city);
      if (criteria.state) params.append("state", criteria.state);
      if (criteria.available_for_sos !== undefined) {
        params.append("available_for_sos", criteria.available_for_sos);
      }
      if (criteria.latitude && criteria.longitude) {
        params.append("latitude", criteria.latitude);
        params.append("longitude", criteria.longitude);
        params.append("radius", criteria.radius || 10);
      }
      if (criteria.limit) params.append("limit", criteria.limit);

      const response = await api.get(`/public/donors/search?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error searching donors:", error);
      throw error;
    }
  },

  // Get nearby donors using PostGIS location queries
  getNearbyDonors: async (
    latitude,
    longitude,
    radius = 10,
    bloodGroup = null
  ) => {
    try {
      const params = { latitude, longitude, radius };
      if (bloodGroup) params.blood_group = bloodGroup;

      const response = await api.get("/public/donors/nearby", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching nearby donors:", error);
      throw error;
    }
  },

  // Get compatible donors for a blood group
  getCompatibleDonors: async (bloodGroup, location = null) => {
    try {
      const params = new URLSearchParams({ blood_group: bloodGroup });

      if (location) {
        params.append("latitude", location.latitude);
        params.append("longitude", location.longitude);
        params.append("radius", location.radius || 10);
      }

      const response = await api.get(`/public/donors/compatible?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching compatible donors:", error);
      throw error;
    }
  },

  // Get public statistics from all tables
  getStatistics: async () => {
    try {
      const response = await api.get("/public/statistics");
      return response.data;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return {
        total_users: 0,
        total_donors: 0,
        total_patients: 0,
        total_requests: 0,
        total_donations: 0,
        active_requests: 0,
        blood_banks: 0,
        by_blood_group: {},
        by_urgency: {},
      };
    }
  },

  // Get blood group compatibility matrix
  getBloodCompatibility: async () => {
    try {
      const response = await api.get("/public/blood-compatibility");
      return response.data;
    } catch (error) {
      console.error("Error fetching blood compatibility:", error);
      return {
        can_donate_to: {},
        can_receive_from: {},
      };
    }
  },

  // Get blood bank categories
  getBloodBankCategories: async () => {
    try {
      const response = await api.get("/public/blood-bank-categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching blood bank categories:", error);
      return ["Govt", "Private", "Charitable/Vol"];
    }
  },

  // Get cities with blood banks
  getCitiesWithBloodBanks: async (state = null) => {
    try {
      const params = state ? `?state=${encodeURIComponent(state)}` : "";
      const response = await api.get(`/public/cities${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  },

  // Get states with blood banks
  getStatesWithBloodBanks: async () => {
    try {
      const response = await api.get("/public/states");
      return response.data;
    } catch (error) {
      console.error("Error fetching states:", error);
      return [];
    }
  },

  // Get blood donation eligibility criteria
  getDonationEligibility: async () => {
    try {
      const response = await api.get("/public/donation-eligibility");
      return response.data;
    } catch (error) {
      console.error("Error fetching donation eligibility:", error);
      return {
        min_age: 18,
        max_age: 65,
        min_weight: 50,
        min_hemoglobin: 12.5,
        donation_interval_days: 56,
      };
    }
  },

  // Get blood facts and information
  getBloodFacts: async () => {
    try {
      const response = await api.get("/public/blood-facts");
      return response.data;
    } catch (error) {
      console.error("Error fetching blood facts:", error);
      return [];
    }
  },

  // Get emergency contacts
  getEmergencyContacts: async (city = null, state = null) => {
    try {
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      if (state) params.append("state", state);

      const response = await api.get(`/public/emergency-contacts?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      return [];
    }
  },

  // Search all public data
  searchPublicData: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams({ q: query });

      if (filters.type) params.append("type", filters.type);
      if (filters.location) params.append("location", filters.location);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(`/public/search?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error searching public data:", error);
      throw error;
    }
  },
};
