import api from "./api";

export const donationService = {
  // Record a new donation in the donations table
  recordDonation: async (donationData) => {
    try {
      const response = await api.post("/donations", {
        donor_id: donationData.donor_id,
        bank_id: donationData.bank_id,
        request_id: donationData.request_id,
        donation_date: donationData.donation_date,
        units_donated: donationData.units_donated || 1,
        notes: donationData.notes,
      });
      return response.data;
    } catch (error) {
      console.error("Error recording donation:", error);
      throw error;
    }
  },

  // Get donation history with filtering and statistics
  getDonationHistory: async (donorId, filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.bank_id) params.append("bank_id", filters.bank_id);
      if (filters.request_id) params.append("request_id", filters.request_id);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.offset) params.append("offset", filters.offset);

      const response = await api.get(`/donors/${donorId}/donations?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation history:", error);
      throw error;
    }
  },

  // Update donation count in donors table
  updateDonationCount: async (donorId) => {
    try {
      const response = await api.put(`/donors/${donorId}/donation-count`);
      return response.data;
    } catch (error) {
      console.error("Error updating donation count:", error);
      throw error;
    }
  },

  // Get donation details by ID
  getDonationDetails: async (donationId) => {
    try {
      const response = await api.get(`/donations/${donationId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation details:", error);
      throw error;
    }
  },

  // Update donation details
  updateDonation: async (donationId, updateData) => {
    try {
      const response = await api.put(`/donations/${donationId}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error updating donation:", error);
      throw error;
    }
  },

  // Delete donation record
  deleteDonation: async (donationId) => {
    try {
      const response = await api.delete(`/donations/${donationId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting donation:", error);
      throw error;
    }
  },

  // Get donation statistics for a donor
  getDonationStats: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/donation-stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation stats:", error);
      return {
        total_donations: 0,
        total_units: 0,
        last_donation_date: null,
        next_eligible_date: null,
        donation_streak: 0,
        favorite_blood_bank: null,
      };
    }
  },

  // Check donation eligibility
  checkDonationEligibility: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/donation-eligibility`);
      return response.data;
    } catch (error) {
      console.error("Error checking donation eligibility:", error);
      return {
        is_eligible: false,
        reason: "Unable to check eligibility",
        next_eligible_date: null,
        days_until_eligible: null,
      };
    }
  },

  // Generate donation certificate
  generateDonationCertificate: async (donationId, format = "pdf") => {
    try {
      const response = await api.get(
        `/donations/${donationId}/certificate?format=${format}`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating donation certificate:", error);
      throw error;
    }
  },

  // Get donation milestones
  getDonationMilestones: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/milestones`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation milestones:", error);
      return {
        current_milestone: null,
        next_milestone: null,
        progress_percentage: 0,
        achievements: [],
      };
    }
  },

  // Get donation impact statistics
  getDonationImpact: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/impact`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation impact:", error);
      return {
        lives_potentially_saved: 0,
        patients_helped: 0,
        hospitals_served: 0,
        total_impact_score: 0,
      };
    }
  },

  // Schedule donation appointment
  scheduleDonationAppointment: async (donorId, appointmentData) => {
    try {
      const response = await api.post(`/donors/${donorId}/appointments`, {
        bank_id: appointmentData.bank_id,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        notes: appointmentData.notes,
      });
      return response.data;
    } catch (error) {
      console.error("Error scheduling donation appointment:", error);
      throw error;
    }
  },

  // Get donation appointments
  getDonationAppointments: async (donorId, status = null) => {
    try {
      const params = status ? `?status=${status}` : "";
      const response = await api.get(
        `/donors/${donorId}/appointments${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching donation appointments:", error);
      throw error;
    }
  },

  // Cancel donation appointment
  cancelDonationAppointment: async (appointmentId, reason = null) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/cancel`, {
        reason: reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error canceling donation appointment:", error);
      throw error;
    }
  },

  // Get donation reminders
  getDonationReminders: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/reminders`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation reminders:", error);
      return [];
    }
  },

  // Set donation reminder
  setDonationReminder: async (donorId, reminderData) => {
    try {
      const response = await api.post(`/donors/${donorId}/reminders`, {
        reminder_date: reminderData.reminder_date,
        reminder_type: reminderData.reminder_type,
        message: reminderData.message,
        is_recurring: reminderData.is_recurring || false,
      });
      return response.data;
    } catch (error) {
      console.error("Error setting donation reminder:", error);
      throw error;
    }
  },

  // Get donation feedback
  getDonationFeedback: async (donationId) => {
    try {
      const response = await api.get(`/donations/${donationId}/feedback`);
      return response.data;
    } catch (error) {
      console.error("Error fetching donation feedback:", error);
      return null;
    }
  },

  // Submit donation feedback
  submitDonationFeedback: async (donationId, feedbackData) => {
    try {
      const response = await api.post(`/donations/${donationId}/feedback`, {
        rating: feedbackData.rating,
        experience_rating: feedbackData.experience_rating,
        staff_rating: feedbackData.staff_rating,
        facility_rating: feedbackData.facility_rating,
        comments: feedbackData.comments,
        would_recommend: feedbackData.would_recommend,
      });
      return response.data;
    } catch (error) {
      console.error("Error submitting donation feedback:", error);
      throw error;
    }
  },

  // Get donation trends
  getDonationTrends: async (donorId, period = "1year") => {
    try {
      const response = await api.get(
        `/donors/${donorId}/donation-trends?period=${period}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching donation trends:", error);
      return {
        trends: [],
        total_by_month: {},
        average_per_month: 0,
      };
    }
  },

  // Export donation history
  exportDonationHistory: async (donorId, format = "json", filters = {}) => {
    try {
      const params = new URLSearchParams({ format });

      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.include_certificates)
        params.append("include_certificates", "true");

      const response = await api.get(
        `/donors/${donorId}/donations/export?${params}`,
        {
          responseType: "blob",
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error exporting donation history:", error);
      throw error;
    }
  },

  // Get donation leaderboard
  getDonationLeaderboard: async (period = "all", limit = 10) => {
    try {
      const response = await api.get(
        `/donations/leaderboard?period=${period}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching donation leaderboard:", error);
      return [];
    }
  },

  // Get donor rank
  getDonorRank: async (donorId, period = "all") => {
    try {
      const response = await api.get(
        `/donors/${donorId}/rank?period=${period}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching donor rank:", error);
      return {
        rank: null,
        total_donors: 0,
        percentile: 0,
      };
    }
  },

  // Validate donation data
  validateDonationData: (donationData) => {
    const errors = {};

    if (!donationData.donor_id) {
      errors.donor_id = "Donor ID is required";
    }

    if (!donationData.donation_date) {
      errors.donation_date = "Donation date is required";
    } else {
      const donationDate = new Date(donationData.donation_date);
      const today = new Date();
      if (donationDate > today) {
        errors.donation_date = "Donation date cannot be in the future";
      }
    }

    if (
      !donationData.units_donated ||
      donationData.units_donated < 1 ||
      donationData.units_donated > 5
    ) {
      errors.units_donated = "Units donated must be between 1 and 5";
    }

    if (!donationData.bank_id && !donationData.request_id) {
      errors.location = "Either blood bank or request must be specified";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Calculate next eligible donation date
  calculateNextEligibleDate: (
    lastDonationDate,
    donationType = "whole_blood"
  ) => {
    const intervals = {
      whole_blood: 56, // 8 weeks
      platelets: 7, // 1 week
      plasma: 28, // 4 weeks
    };

    const intervalDays = intervals[donationType] || intervals.whole_blood;
    const lastDate = new Date(lastDonationDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + intervalDays);

    return nextDate;
  },
};
