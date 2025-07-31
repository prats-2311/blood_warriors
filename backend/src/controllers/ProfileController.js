const { supabase } = require("../utils/supabase");
const Joi = require("joi");

class ProfileController {
  constructor() {
    // Validation schemas
    this.updateProfileSchema = Joi.object({
      full_name: Joi.string().min(2).max(100).optional(),
      phone_number: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      city: Joi.string().min(2).max(50).optional(),
      state: Joi.string().min(2).max(50).optional(),
      date_of_birth: Joi.date().max('now').optional(),
      blood_group_id: Joi.number().integer().positive().optional(),
      emergency_contact_name: Joi.string().min(2).max(100).optional(),
      emergency_contact_phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      medical_conditions: Joi.string().max(500).optional(),
      allergies: Joi.string().max(500).optional(),
      current_medications: Joi.string().max(500).optional(),
      preferred_donation_time: Joi.string().valid('morning', 'afternoon', 'evening', 'any').optional(),
      notification_preferences: Joi.object({
        email_notifications: Joi.boolean().optional(),
        sms_notifications: Joi.boolean().optional(),
        push_notifications: Joi.boolean().optional(),
        emergency_alerts: Joi.boolean().optional(),
      }).optional(),
    });
  }

  /**
   * Get user profile with role-specific data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      // Handle case where req.user might be an array
      let user = req.user;
      if (Array.isArray(user) && user.length > 0) {
        user = user[0];
      }

      console.log("Getting profile for user:", user.email);
      console.log("User ID:", user.user_id);
      const userId = user.user_id;
      const userType = user.user_type;

      let profileData = { ...user };

      // Add additional profile data based on user type
      try {
        if (userType === "Patient") {
          const { data: patientData, error: patientError } = await supabase
            .from("patients")
            .select(`
              date_of_birth, 
              blood_group_id,
              emergency_contact_name,
              emergency_contact_phone,
              medical_conditions,
              allergies,
              current_medications
            `)
            .eq("patient_id", userId)
            .single();

          if (patientError) {
            console.log("Patient data fetch error:", patientError.message);
          } else if (patientData) {
            const { data: bloodGroup } = await supabase
              .from("bloodgroups")
              .select("group_name")
              .eq("blood_group_id", patientData.blood_group_id)
              .single();

            profileData = {
              ...profileData,
              ...patientData,
              blood_group: bloodGroup?.group_name,
            };
          }
        } else if (userType === "Donor") {
          const { data: donorData, error: donorError } = await supabase
            .from("donors")
            .select(`
              blood_group_id, 
              donation_count,
              last_donation_date,
              preferred_donation_time,
              notification_preferences,
              is_available
            `)
            .eq("donor_id", userId)
            .single();

          if (donorError) {
            console.log("Donor data fetch error:", donorError.message);
          } else if (donorData) {
            const { data: bloodGroup } = await supabase
              .from("bloodgroups")
              .select("group_name")
              .eq("blood_group_id", donorData.blood_group_id)
              .single();

            profileData = {
              ...profileData,
              ...donorData,
              blood_group: bloodGroup?.group_name,
              donation_count: donorData.donation_count || 0,
            };
          }
        }
      } catch (profileError) {
        console.log("Profile enhancement error:", profileError.message);
        // Continue with basic profile data
      }

      console.log("Profile data prepared successfully");
      res.status(200).json({
        status: "success",
        data: profileData,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get profile",
        debug: error.message,
      });
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfile(req, res) {
    try {
      // Validate request
      const { error, value } = this.updateProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.details.map((detail) => ({
            field: detail.path[0],
            message: detail.message,
          })),
        });
      }

      const userId = req.user?.user_id;
      const userType = req.user?.user_type;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Separate fields for users table and role-specific tables
      const userFields = {};
      const roleFields = {};

      // Fields that go to users table
      const userTableFields = ['full_name', 'phone_number', 'city', 'state'];
      userTableFields.forEach(field => {
        if (value[field] !== undefined) {
          userFields[field] = value[field];
        }
      });

      // Fields that go to role-specific tables
      const roleTableFields = [
        'date_of_birth', 'blood_group_id', 'emergency_contact_name', 
        'emergency_contact_phone', 'medical_conditions', 'allergies', 
        'current_medications', 'preferred_donation_time', 'notification_preferences'
      ];
      roleTableFields.forEach(field => {
        if (value[field] !== undefined) {
          roleFields[field] = value[field];
        }
      });

      // Update users table if there are user fields to update
      if (Object.keys(userFields).length > 0) {
        userFields.updated_at = new Date().toISOString();
        
        const { error: userUpdateError } = await supabase
          .from("users")
          .update(userFields)
          .eq("user_id", userId);

        if (userUpdateError) {
          console.error("Failed to update user data:", userUpdateError);
          return res.status(500).json({
            status: "error",
            message: "Failed to update profile",
          });
        }
      }

      // Update role-specific table if there are role fields to update
      if (Object.keys(roleFields).length > 0) {
        let tableName, idField;
        
        if (userType === "Patient") {
          tableName = "patients";
          idField = "patient_id";
        } else if (userType === "Donor") {
          tableName = "donors";
          idField = "donor_id";
        }

        if (tableName) {
          const { error: roleUpdateError } = await supabase
            .from(tableName)
            .update(roleFields)
            .eq(idField, userId);

          if (roleUpdateError) {
            console.error(`Failed to update ${tableName} data:`, roleUpdateError);
            return res.status(500).json({
              status: "error",
              message: "Failed to update profile",
            });
          }
        }
      }

      // Fetch updated profile
      const updatedProfile = await this._fetchCompleteProfile(userId, userType);

      res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }

  /**
   * Get user statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStats(req, res) {
    try {
      const userId = req.user?.user_id;
      const userType = req.user?.user_type;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      let stats = {};

      if (userType === "Patient") {
        // Get patient statistics
        const { data: requestStats } = await supabase
          .from("donation_requests")
          .select("request_id, status, created_at")
          .eq("patient_id", userId);

        stats = {
          total_requests: requestStats?.length || 0,
          active_requests: requestStats?.filter(r => r.status === 'Open').length || 0,
          fulfilled_requests: requestStats?.filter(r => r.status === 'Fulfilled').length || 0,
        };
      } else if (userType === "Donor") {
        // Get donor statistics
        const { data: donorData } = await supabase
          .from("donors")
          .select("donation_count, last_donation_date")
          .eq("donor_id", userId)
          .single();

        const { data: responseStats } = await supabase
          .from("donation_responses")
          .select("response_id, status")
          .eq("donor_id", userId);

        stats = {
          total_donations: donorData?.donation_count || 0,
          last_donation: donorData?.last_donation_date,
          total_responses: responseStats?.length || 0,
          accepted_responses: responseStats?.filter(r => r.status === 'Accepted').length || 0,
        };
      }

      res.status(200).json({
        status: "success",
        data: stats,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get statistics",
      });
    }
  }

  /**
   * Fetch complete profile data
   * @private
   */
  async _fetchCompleteProfile(userId, userType) {
    try {
      // Get base user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!userData) return null;

      let profileData = { ...userData };

      // Add role-specific data
      if (userType === "Patient") {
        const { data: patientData } = await supabase
          .from("patients")
          .select("*")
          .eq("patient_id", userId)
          .single();

        if (patientData) {
          const { data: bloodGroup } = await supabase
            .from("bloodgroups")
            .select("group_name")
            .eq("blood_group_id", patientData.blood_group_id)
            .single();

          profileData = {
            ...profileData,
            ...patientData,
            blood_group: bloodGroup?.group_name,
          };
        }
      } else if (userType === "Donor") {
        const { data: donorData } = await supabase
          .from("donors")
          .select("*")
          .eq("donor_id", userId)
          .single();

        if (donorData) {
          const { data: bloodGroup } = await supabase
            .from("bloodgroups")
            .select("group_name")
            .eq("blood_group_id", donorData.blood_group_id)
            .single();

          profileData = {
            ...profileData,
            ...donorData,
            blood_group: bloodGroup?.group_name,
          };
        }
      }

      return profileData;
    } catch (error) {
      console.error("Fetch complete profile error:", error);
      return null;
    }
  }
}

module.exports = ProfileController;
