import api from "./api";

export const donorService = {
  // Update donor location
  updateLocation: async (latitude, longitude) => {
    const response = await api.put("/donors/me/location", {
      latitude,
      longitude,
    });
    return response.data;
  },

  // Toggle SOS availability
  toggleSosAvailability: async (isAvailable) => {
    const response = await api.put("/donors/me/sos-availability", {
      is_available_for_sos: isAvailable,
    });
    return response.data;
  },

  // Update interests/taste keywords
  updateInterests: async (interests) => {
    const response = await api.put("/donors/me/interests", { interests });
    return response.data;
  },

  // Get donor coupons
  getCoupons: async (status = null) => {
    const params = status ? `?status=${status}` : "";
    const response = await api.get(`/donors/me/coupons${params}`);
    return response.data;
  },

  // Record a donation
  recordDonation: async (donationData) => {
    const response = await api.post("/donors/me/donations", donationData);
    return response.data;
  },

  // Get notifications
  getNotifications: async (status = null) => {
    const params = status ? `?status=${status}` : "";
    const response = await api.get(`/donors/me/notifications${params}`);
    return response.data;
  },
};
