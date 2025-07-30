import api from "./api";

export const couponService = {
  // Get donor coupons with coupon details and partner information
  getDonorCoupons: async (donorId, status = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const response = await api.get(`/donors/${donorId}/coupons?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donor coupons:", error);
      throw error;
    }
  },

  // Redeem a coupon
  redeemCoupon: async (donorCouponId, redemptionData = {}) => {
    try {
      const response = await api.post(
        `/donor-coupons/${donorCouponId}/redeem`,
        {
          redemption_location: redemptionData.location,
          redemption_notes: redemptionData.notes,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      throw error;
    }
  },

  // Get coupon details with partner information
  getCouponDetails: async (donorCouponId) => {
    try {
      const response = await api.get(`/donor-coupons/${donorCouponId}/details`);
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon details:", error);
      throw error;
    }
  },

  // Get available coupons based on donor interests
  getAvailableCoupons: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/available-coupons`);
      return response.data;
    } catch (error) {
      console.error("Error fetching available coupons:", error);
      throw error;
    }
  },

  // Get coupon by redemption code
  getCouponByCode: async (redemptionCode) => {
    try {
      const response = await api.get(`/coupons/by-code/${redemptionCode}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon by code:", error);
      throw error;
    }
  },

  // Validate redemption code
  validateRedemptionCode: async (redemptionCode) => {
    try {
      const response = await api.post("/coupons/validate-code", {
        redemption_code: redemptionCode,
      });
      return response.data;
    } catch (error) {
      console.error("Error validating redemption code:", error);
      return { isValid: false, message: "Invalid redemption code" };
    }
  },

  // Get coupon redemption history
  getRedemptionHistory: async (donorId, limit = null) => {
    try {
      const params = limit ? `?limit=${limit}` : "";
      const response = await api.get(
        `/donors/${donorId}/coupon-history${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching redemption history:", error);
      throw error;
    }
  },

  // Get coupon statistics for donor
  getCouponStats: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/coupon-stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon stats:", error);
      return {
        total_issued: 0,
        total_redeemed: 0,
        total_expired: 0,
        total_value_redeemed: 0,
      };
    }
  },

  // Search coupons
  searchCoupons: async (donorId, searchQuery, filters = {}) => {
    try {
      const params = new URLSearchParams({ q: searchQuery });

      if (filters.status) params.append("status", filters.status);
      if (filters.partner) params.append("partner", filters.partner);
      if (filters.category) params.append("category", filters.category);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(
        `/donors/${donorId}/coupons/search?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching coupons:", error);
      throw error;
    }
  },

  // Get coupons by partner
  getCouponsByPartner: async (donorId, partnerName) => {
    try {
      const response = await api.get(
        `/donors/${donorId}/coupons/partner/${encodeURIComponent(partnerName)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coupons by partner:", error);
      throw error;
    }
  },

  // Get expiring coupons
  getExpiringCoupons: async (donorId, daysAhead = 7) => {
    try {
      const response = await api.get(
        `/donors/${donorId}/coupons/expiring?days=${daysAhead}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching expiring coupons:", error);
      throw error;
    }
  },

  // Mark coupon as favorite
  markAsFavorite: async (donorCouponId) => {
    try {
      const response = await api.post(
        `/donor-coupons/${donorCouponId}/favorite`
      );
      return response.data;
    } catch (error) {
      console.error("Error marking coupon as favorite:", error);
      throw error;
    }
  },

  // Remove from favorites
  removeFromFavorites: async (donorCouponId) => {
    try {
      const response = await api.delete(
        `/donor-coupons/${donorCouponId}/favorite`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing coupon from favorites:", error);
      throw error;
    }
  },

  // Get favorite coupons
  getFavoriteCoupons: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/coupons/favorites`);
      return response.data;
    } catch (error) {
      console.error("Error fetching favorite coupons:", error);
      throw error;
    }
  },

  // Share coupon (generate shareable link)
  shareCoupon: async (donorCouponId) => {
    try {
      const response = await api.post(`/donor-coupons/${donorCouponId}/share`);
      return response.data;
    } catch (error) {
      console.error("Error sharing coupon:", error);
      throw error;
    }
  },

  // Get coupon categories
  getCouponCategories: async () => {
    try {
      const response = await api.get("/coupons/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon categories:", error);
      return [];
    }
  },

  // Get partner list
  getPartners: async () => {
    try {
      const response = await api.get("/coupons/partners");
      return response.data;
    } catch (error) {
      console.error("Error fetching partners:", error);
      return [];
    }
  },

  // Issue coupon to donor (system function)
  issueCouponToDonor: async (donorId, couponId, customMessage = null) => {
    try {
      const response = await api.post("/donor-coupons/issue", {
        donor_id: donorId,
        coupon_id: couponId,
        custom_message: customMessage,
      });
      return response.data;
    } catch (error) {
      console.error("Error issuing coupon to donor:", error);
      throw error;
    }
  },

  // Bulk issue coupons (admin function)
  bulkIssueCoupons: async (donorIds, couponId) => {
    try {
      const response = await api.post("/donor-coupons/bulk-issue", {
        donor_ids: donorIds,
        coupon_id: couponId,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk issuing coupons:", error);
      throw error;
    }
  },

  // Get coupon usage analytics
  getCouponAnalytics: async (donorId, dateRange = null) => {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append("date_from", dateRange.from);
        params.append("date_to", dateRange.to);
      }

      const response = await api.get(
        `/donors/${donorId}/coupon-analytics?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon analytics:", error);
      return {
        redemption_rate: 0,
        favorite_categories: [],
        most_used_partners: [],
        total_savings: 0,
      };
    }
  },

  // Report coupon issue
  reportCouponIssue: async (donorCouponId, issueType, description) => {
    try {
      const response = await api.post(
        `/donor-coupons/${donorCouponId}/report-issue`,
        {
          issue_type: issueType,
          description: description,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error reporting coupon issue:", error);
      throw error;
    }
  },

  // Get coupon terms and conditions
  getCouponTerms: async (couponId) => {
    try {
      const response = await api.get(`/coupons/${couponId}/terms`);
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon terms:", error);
      return { terms: "Terms and conditions not available" };
    }
  },

  // Check coupon eligibility
  checkCouponEligibility: async (donorId, couponId) => {
    try {
      const response = await api.get(
        `/donors/${donorId}/coupon-eligibility/${couponId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking coupon eligibility:", error);
      return {
        isEligible: false,
        reason: "Unable to check eligibility",
      };
    }
  },

  // Export coupon data
  exportCouponData: async (donorId, format = "json", filters = {}) => {
    try {
      const params = new URLSearchParams({ format });

      if (filters.status) params.append("status", filters.status);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);

      const response = await api.get(
        `/donors/${donorId}/coupons/export?${params}`,
        {
          responseType: "blob",
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error exporting coupon data:", error);
      throw error;
    }
  },

  // Validate coupon redemption data
  validateRedemptionData: (redemptionData) => {
    const errors = {};

    if (!redemptionData.donorCouponId) {
      errors.donorCouponId = "Coupon ID is required";
    }

    if (redemptionData.location && redemptionData.location.trim().length < 2) {
      errors.location = "Location must be at least 2 characters";
    }

    if (redemptionData.notes && redemptionData.notes.length > 500) {
      errors.notes = "Notes cannot exceed 500 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Get coupon QR code
  getCouponQRCode: async (donorCouponId) => {
    try {
      const response = await api.get(
        `/donor-coupons/${donorCouponId}/qr-code`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon QR code:", error);
      throw error;
    }
  },
};
