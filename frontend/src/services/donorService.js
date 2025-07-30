import api from "./api";

export const donorService = {
  // Get donor notifications with proper joins
  getNotifications: async (donorId, status = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const response = await api.get(
        `/donors/${donorId}/notifications?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllNotificationsRead: async (donorId) => {
    try {
      const response = await api.put(
        `/donors/${donorId}/notifications/read-all`
      );
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  // Get donor coupons with coupon details
  getCoupons: async (donorId, status = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const response = await api.get(`/donors/${donorId}/coupons?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching coupons:", error);
      throw error;
    }
  },

  // Redeem a coupon
  redeemCoupon: async (donorCouponId) => {
    try {
      const response = await api.post(`/donor-coupons/${donorCouponId}/redeem`);
      return response.data;
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      throw error;
    }
  },

  // Get coupon details
  getCouponDetails: async (donorCouponId) => {
    try {
      const response = await api.get(`/donor-coupons/${donorCouponId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon details:", error);
      throw error;
    }
  },

  // Toggle SOS availability
  toggleSosAvailability: async (donorId, isAvailable) => {
    try {
      const response = await api.put(`/donors/${donorId}/sos-availability`, {
        is_available_for_sos: isAvailable,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating SOS availability:", error);
      throw error;
    }
  },

  // Update donor location with PostGIS support
  updateLocation: async (donorId, latitude, longitude) => {
    try {
      const response = await api.put(`/donors/${donorId}/location`, {
        latitude,
        longitude,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  },

  // Update donor interests/keywords for coupon matching
  updateInterests: async (donorId, interests) => {
    try {
      const response = await api.put(`/donors/${donorId}/interests`, {
        qloo_taste_keywords: interests,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating interests:", error);
      throw error;
    }
  },

  // Get donation history with related data
  getDonationHistory: async (donorId, limit = null) => {
    try {
      const params = limit ? `?limit=${limit}` : "";
      const response = await api.get(`/donors/${donorId}/donations${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation history:", error);
      throw error;
    }
  },

  // Record a new donation
  recordDonation: async (donationData) => {
    try {
      const response = await api.post("/donations", donationData);
      return response.data;
    } catch (error) {
      console.error("Error recording donation:", error);
      throw error;
    }
  },

  // Get donor profile with all related data
  getDonorProfile: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/profile`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donor profile:", error);
      throw error;
    }
  },

  // Update donor profile
  updateDonorProfile: async (donorId, profileData) => {
    try {
      const response = await api.put(`/donors/${donorId}/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating donor profile:", error);
      throw error;
    }
  },

  // Get nearby blood requests for donor
  getNearbyRequests: async (donorId, radius = 10) => {
    try {
      const response = await api.get(
        `/donors/${donorId}/nearby-requests?radius=${radius}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching nearby requests:", error);
      throw error;
    }
  },

  // Respond to a blood request
  respondToRequest: async (donorId, requestId, response, message = null) => {
    try {
      const responseData = await api.post(`/requests/${requestId}/respond`, {
        donor_id: donorId,
        response,
        message,
      });
      return responseData.data;
    } catch (error) {
      console.error("Error responding to request:", error);
      throw error;
    }
  },

  // Get donor statistics
  getDonorStats: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donor stats:", error);
      throw error;
    }
  },

  // Update donation count (usually called after successful donation)
  updateDonationCount: async (donorId) => {
    try {
      const response = await api.put(`/donors/${donorId}/donation-count`);
      return response.data;
    } catch (error) {
      console.error("Error updating donation count:", error);
      throw error;
    }
  },

  // Legacy methods removed to avoid duplicate keys
};
