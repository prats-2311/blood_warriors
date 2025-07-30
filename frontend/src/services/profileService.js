import api from "./api";

export const profileService = {
  // Get complete user profile with all related data
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  // Update user profile in users table
  updateUserProfile: async (userId, profileData) => {
    try {
      const response = await api.put(`/users/${userId}/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  // Update donor-specific settings in donors table
  updateDonorSettings: async (donorId, settings) => {
    try {
      const response = await api.put(`/donors/${donorId}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error("Error updating donor settings:", error);
      throw error;
    }
  },

  // Update patient-specific information in patients table
  updatePatientInfo: async (patientId, patientData) => {
    try {
      const response = await api.put(
        `/patients/${patientId}/info`,
        patientData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating patient info:", error);
      throw error;
    }
  },

  // Update donor location with PostGIS support
  updateLocation: async (donorId, coordinates) => {
    try {
      const response = await api.put(`/donors/${donorId}/location`, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  },

  // Get user's blood group information
  getBloodGroupInfo: async (bloodGroupId) => {
    try {
      const response = await api.get(`/blood-groups/${bloodGroupId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching blood group info:", error);
      throw error;
    }
  },

  // Update user's blood group (admin only or during registration)
  updateBloodGroup: async (userId, bloodGroupId) => {
    try {
      const response = await api.put(`/users/${userId}/blood-group`, {
        blood_group_id: bloodGroupId,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating blood group:", error);
      throw error;
    }
  },

  // Get profile completion status
  getProfileCompletionStatus: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/profile-completion`);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile completion status:", error);
      // Return a reasonable fallback
      return {
        isComplete: false,
        missingFields: ["emergency_contact"],
        completionPercentage: 75,
      };
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (userId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append("profile_picture", imageFile);

      const response = await api.post(
        `/users/${userId}/profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  },

  // Delete profile picture
  deleteProfilePicture: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}/profile-picture`);
      return response.data;
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      throw error;
    }
  },

  // Get user's activity summary
  getActivitySummary: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/activity-summary`);
      return response.data;
    } catch (error) {
      console.error("Error fetching activity summary:", error);
      return {
        totalRequests: 0,
        totalDonations: 0,
        totalNotifications: 0,
        lastActivity: null,
      };
    }
  },

  // Update user preferences
  updatePreferences: async (userId, preferences) => {
    try {
      const response = await api.put(
        `/users/${userId}/preferences`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error("Error updating preferences:", error);
      throw error;
    }
  },

  // Get user preferences
  getPreferences: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/preferences`);
      return response.data;
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        language: "en",
        timezone: "UTC",
      };
    }
  },

  // Validate profile data before submission
  validateProfileData: (profileData, userType) => {
    const errors = {};

    // Common validations
    if (!profileData.full_name || profileData.full_name.trim().length < 2) {
      errors.full_name = "Full name must be at least 2 characters long";
    }

    if (
      !profileData.phone_number ||
      !/^\+?[\d\s\-()]{10,}$/.test(profileData.phone_number)
    ) {
      errors.phone_number = "Please enter a valid phone number";
    }

    if (
      !profileData.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    // Patient-specific validations
    if (userType === "Patient") {
      if (!profileData.date_of_birth) {
        errors.date_of_birth = "Date of birth is required";
      } else {
        const birthDate = new Date(profileData.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0 || age > 120) {
          errors.date_of_birth = "Please enter a valid date of birth";
        }
      }

      if (
        profileData.emergency_contact &&
        !/^\+?[\d\s\-()]{10,}$/.test(profileData.emergency_contact)
      ) {
        errors.emergency_contact =
          "Please enter a valid emergency contact number";
      }
    }

    // Donor-specific validations
    if (userType === "Donor") {
      if (profileData.last_donation_date) {
        const donationDate = new Date(profileData.last_donation_date);
        const today = new Date();
        if (donationDate > today) {
          errors.last_donation_date =
            "Last donation date cannot be in the future";
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Check if user can donate based on last donation date
  checkDonationEligibility: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/donation-eligibility`);
      return response.data;
    } catch (error) {
      console.error("Error checking donation eligibility:", error);
      return {
        isEligible: false,
        reason: "Unable to check eligibility",
        nextEligibleDate: null,
      };
    }
  },

  // Get user's privacy settings
  getPrivacySettings: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/privacy-settings`);
      return response.data;
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      return {
        showProfile: true,
        showLocation: false,
        showDonationHistory: false,
        allowContact: true,
      };
    }
  },

  // Update user's privacy settings
  updatePrivacySettings: async (userId, privacySettings) => {
    try {
      const response = await api.put(
        `/users/${userId}/privacy-settings`,
        privacySettings
      );
      return response.data;
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      throw error;
    }
  },

  // Deactivate user account
  deactivateAccount: async (userId, reason) => {
    try {
      const response = await api.put(`/users/${userId}/deactivate`, { reason });
      return response.data;
    } catch (error) {
      console.error("Error deactivating account:", error);
      throw error;
    }
  },

  // Reactivate user account
  reactivateAccount: async (userId) => {
    try {
      const response = await api.put(`/users/${userId}/reactivate`);
      return response.data;
    } catch (error) {
      console.error("Error reactivating account:", error);
      throw error;
    }
  },
};
