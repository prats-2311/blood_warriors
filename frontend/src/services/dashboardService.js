import api from "./api";

export const dashboardService = {
  // Get patient statistics from database
  getPatientStats: async (userId) => {
    try {
      const response = await api.get(`/dashboard/patient-stats/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching patient stats:", error);
      // Return mock data as fallback
      return {
        totalRequests: 0,
        activeRequests: 0,
        fulfilledRequests: 0,
        cancelledRequests: 0,
        urgentRequests: 0,
        sosRequests: 0,
      };
    }
  },

  // Get donor statistics from database
  getDonorStats: async (userId) => {
    try {
      const response = await api.get(`/dashboard/donor-stats/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donor stats:", error);
      // Return mock data as fallback
      return {
        totalDonations: 0,
        availableCoupons: 0,
        redeemedCoupons: 0,
        unreadNotifications: 0,
        acceptedRequests: 0,
        sosAvailability: true,
      };
    }
  },

  // Get recent requests with proper joins
  getRecentRequests: async (userId, userType, limit = 5) => {
    try {
      const endpoint =
        userType === "Patient"
          ? `/dashboard/patient-requests/${userId}?limit=${limit}`
          : `/dashboard/available-requests?limit=${limit}&donor_id=${userId}`;

      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent requests:", error);
      // Return mock data as fallback
      return [
        {
          request_id: "mock-1",
          blood_group_name: "O+",
          component_name: "Whole Blood",
          urgency: "Urgent",
          status: "Open",
          units_required: 2,
          request_datetime: new Date().toISOString(),
          patient_name: "John Doe",
          hospital_name: "City Hospital",
          notes: "Urgent surgery required",
        },
        {
          request_id: "mock-2",
          blood_group_name: "A+",
          component_name: "Platelets",
          urgency: "SOS",
          status: "Open",
          units_required: 1,
          request_datetime: new Date(Date.now() - 86400000).toISOString(),
          patient_name: "Jane Smith",
          hospital_name: "General Hospital",
          notes: "Cancer treatment support",
        },
      ];
    }
  },

  // Get recent notifications for donors
  getRecentNotifications: async (donorId, limit = 5) => {
    try {
      const response = await api.get(
        `/dashboard/donor-notifications/${donorId}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching recent notifications:", error);
      // Return mock data as fallback
      return [
        {
          notification_id: "mock-notif-1",
          message: "New urgent blood request matching your type",
          status: "Sent",
          sent_at: new Date().toISOString(),
          request_details: {
            blood_group_name: "O+",
            urgency: "Urgent",
            hospital_name: "City Hospital",
          },
        },
      ];
    }
  },

  // Get recent donations for donors
  getRecentDonations: async (donorId, limit = 5) => {
    try {
      const response = await api.get(
        `/dashboard/donor-donations/${donorId}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching recent donations:", error);
      // Return mock data as fallback
      return [
        {
          donation_id: "mock-donation-1",
          donation_date: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
          units_donated: 1,
          bank_name: "City Blood Bank",
          request_id: "req-123",
        },
      ];
    }
  },

  // Get comprehensive dashboard data
  getDashboardData: async (userId, userType) => {
    try {
      const [stats, recentRequests, recentNotifications, recentDonations] =
        await Promise.allSettled([
          userType === "Patient"
            ? dashboardService.getPatientStats(userId)
            : dashboardService.getDonorStats(userId),
          dashboardService.getRecentRequests(userId, userType),
          userType === "Donor"
            ? dashboardService.getRecentNotifications(userId)
            : Promise.resolve([]),
          userType === "Donor"
            ? dashboardService.getRecentDonations(userId)
            : Promise.resolve([]),
        ]);

      return {
        stats: stats.status === "fulfilled" ? stats.value : {},
        recentRequests:
          recentRequests.status === "fulfilled" ? recentRequests.value : [],
        recentNotifications:
          recentNotifications.status === "fulfilled"
            ? recentNotifications.value
            : [],
        recentDonations:
          recentDonations.status === "fulfilled" ? recentDonations.value : [],
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  },

  // Get blood group statistics
  getBloodGroupStats: async () => {
    try {
      const response = await api.get("/dashboard/blood-group-stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching blood group stats:", error);
      return {
        "A+": { requests: 0, donors: 0 },
        "A-": { requests: 0, donors: 0 },
        "B+": { requests: 0, donors: 0 },
        "B-": { requests: 0, donors: 0 },
        "AB+": { requests: 0, donors: 0 },
        "AB-": { requests: 0, donors: 0 },
        "O+": { requests: 0, donors: 0 },
        "O-": { requests: 0, donors: 0 },
      };
    }
  },

  // Get system-wide statistics
  getSystemStats: async () => {
    try {
      const response = await api.get("/dashboard/system-stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching system stats:", error);
      return {
        totalUsers: 0,
        totalDonors: 0,
        totalPatients: 0,
        totalRequests: 0,
        totalDonations: 0,
        activeRequests: 0,
        bloodBanks: 0,
      };
    }
  },

  // Get health tips based on user type
  getHealthTips: async (userType) => {
    try {
      const response = await api.get(
        `/dashboard/health-tips?user_type=${userType}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching health tips:", error);
      // Return default tips as fallback
      if (userType === "Patient") {
        return [
          "Take your prescribed medications exactly as directed by your doctor",
          "Maintain regular follow-ups with your hematologist",
          "Monitor your iron levels regularly to prevent iron overload",
          "Stay up to date with vaccinations to prevent infections",
        ];
      } else {
        return [
          "Stay hydrated by drinking plenty of water before and after donation",
          "Eat iron-rich foods to maintain healthy blood levels",
          "Get adequate rest before donating blood",
          "Wait at least 8 weeks between whole blood donations",
        ];
      }
    }
  },

  // Update dashboard preferences
  updateDashboardPreferences: async (userId, preferences) => {
    try {
      const response = await api.put(
        `/dashboard/preferences/${userId}`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error("Error updating dashboard preferences:", error);
      throw error;
    }
  },

  // Get dashboard preferences
  getDashboardPreferences: async (userId) => {
    try {
      const response = await api.get(`/dashboard/preferences/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard preferences:", error);
      return {
        showHealthTips: true,
        showRecentActivity: true,
        showStatistics: true,
        refreshInterval: 300000, // 5 minutes
      };
    }
  },
};
