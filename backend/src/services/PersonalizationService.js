const { supabase } = require("../utils/supabase");
const QlooService = require("./QlooService");

class PersonalizationService {
  constructor() {
    this.maxInterests = 20;
    this.maxInterestLength = 50;
    this.minInterestLength = 2;
  }

  /**
   * Update patient interests
   * @param {string} patientId - Patient UUID
   * @param {string[]} interests - Array of interest keywords
   * @returns {Promise<Object>} Updated patient data
   */
  async updatePatientInterests(patientId, interests) {
    try {
      // Validate and sanitize interests
      const sanitizedInterests = this.sanitizeInterests(interests);

      if (!this.validateInterests(sanitizedInterests)) {
        throw new Error("Invalid interests provided");
      }

      // Update patient record
      const { data, error } = await supabase
        .from("patients")
        .update({ taste_keywords: JSON.stringify(sanitizedInterests) })
        .eq("patient_id", patientId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        interests: sanitizedInterests,
      };
    } catch (error) {
      console.error("Error updating patient interests:", error);
      throw error;
    }
  }

  /**
   * Update donor interests
   * @param {string} donorId - Donor UUID
   * @param {string[]} interests - Array of interest keywords
   * @returns {Promise<Object>} Updated donor data
   */
  async updateDonorInterests(donorId, interests) {
    try {
      // Validate and sanitize interests
      const sanitizedInterests = this.sanitizeInterests(interests);

      if (!this.validateInterests(sanitizedInterests)) {
        throw new Error("Invalid interests provided");
      }

      // Update donor record
      const { data, error } = await supabase
        .from("donors")
        .update({ qloo_taste_keywords: JSON.stringify(sanitizedInterests) })
        .eq("donor_id", donorId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        interests: sanitizedInterests,
      };
    } catch (error) {
      console.error("Error updating donor interests:", error);
      throw error;
    }
  }

  /**
   * Get enriched interests using Qloo API
   * @param {string} userId - User UUID
   * @param {string} userType - 'patient' or 'donor'
   * @returns {Promise<Object>} Base and enriched interests
   */
  async getEnrichedInterests(userId, userType) {
    try {
      // Get base interests from database
      const baseInterests = await this.getUserInterests(userId, userType);

      if (!baseInterests || baseInterests.length === 0) {
        return {
          baseInterests: [],
          enrichedInterests: [],
          qlooEnrichmentUsed: false,
        };
      }

      // Try to enrich with Qloo
      let enrichedInterests = [...baseInterests];
      let qlooEnrichmentUsed = false;

      try {
        const qlooKeywords = await QlooService.getTasteProfile(baseInterests);
        if (qlooKeywords && qlooKeywords.length > 0) {
          // Combine base interests with Qloo enriched keywords
          enrichedInterests = [...new Set([...baseInterests, ...qlooKeywords])];
          qlooEnrichmentUsed = true;
        }
      } catch (qlooError) {
        console.warn(
          "Qloo enrichment failed, using base interests:",
          qlooError.message
        );
        // Continue with base interests only
      }

      return {
        baseInterests,
        enrichedInterests,
        qlooEnrichmentUsed,
      };
    } catch (error) {
      console.error("Error getting enriched interests:", error);
      throw error;
    }
  }

  /**
   * Get user interests from database
   * @param {string} userId - User UUID
   * @param {string} userType - 'patient' or 'donor'
   * @returns {Promise<string[]>} Array of interest keywords
   */
  async getUserInterests(userId, userType) {
    try {
      let query;
      let fieldName;

      if (userType === "patient") {
        query = supabase
          .from("patients")
          .select("taste_keywords")
          .eq("patient_id", userId);
        fieldName = "taste_keywords";
      } else if (userType === "donor") {
        query = supabase
          .from("donors")
          .select("qloo_taste_keywords")
          .eq("donor_id", userId);
        fieldName = "qloo_taste_keywords";
      } else {
        throw new Error('Invalid user type. Must be "patient" or "donor"');
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === "PGRST116") {
          // User not found
          return [];
        }
        throw error;
      }

      const interests = data[fieldName];

      // Handle both string and array formats
      if (typeof interests === "string") {
        try {
          return JSON.parse(interests);
        } catch (parseError) {
          console.warn("Failed to parse interests JSON:", parseError);
          return [];
        }
      }

      return Array.isArray(interests) ? interests : [];
    } catch (error) {
      console.error("Error getting user interests:", error);
      return [];
    }
  }

  /**
   * Build personalized context for AI prompts
   * @param {string} userId - User UUID
   * @param {string} userType - 'patient' or 'donor'
   * @param {Array} conversationHistory - Recent chat history
   * @returns {Promise<Object>} Personalized context object
   */
  async buildPersonalizedContext(userId, userType, conversationHistory = []) {
    try {
      const interestData = await this.getEnrichedInterests(userId, userType);

      return {
        userId,
        userType,
        baseInterests: interestData.baseInterests,
        enrichedInterests: interestData.enrichedInterests,
        conversationHistory,
        contextMetadata: {
          qlooEnrichmentUsed: interestData.qlooEnrichmentUsed,
          interestsCount: interestData.baseInterests.length,
          enrichedCount: interestData.enrichedInterests.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error building personalized context:", error);

      // Return minimal context on error
      return {
        userId,
        userType,
        baseInterests: [],
        enrichedInterests: [],
        conversationHistory,
        contextMetadata: {
          qlooEnrichmentUsed: false,
          interestsCount: 0,
          enrichedCount: 0,
          timestamp: new Date().toISOString(),
          error: error.message,
        },
      };
    }
  }

  /**
   * Enrich context with Qloo data
   * @param {string[]} baseInterests - Base user interests
   * @returns {Promise<Object>} Enriched context data
   */
  async enrichContextWithQloo(baseInterests) {
    try {
      if (!baseInterests || baseInterests.length === 0) {
        return {
          enrichedInterests: [],
          recommendations: [],
          qlooUsed: false,
        };
      }

      // Get enriched keywords from Qloo
      const enrichedKeywords = await QlooService.getTasteProfile(baseInterests);

      // Get recommendations based on interests
      const recommendations = await QlooService.getRecommendations(
        baseInterests
      );

      return {
        enrichedInterests: enrichedKeywords || [],
        recommendations: recommendations || [],
        qlooUsed: true,
      };
    } catch (error) {
      console.warn("Qloo enrichment failed:", error.message);

      return {
        enrichedInterests: baseInterests,
        recommendations: [],
        qlooUsed: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate interests array
   * @param {string[]} interests - Array of interest keywords
   * @returns {boolean} True if valid
   */
  validateInterests(interests) {
    if (!Array.isArray(interests)) {
      return false;
    }

    if (interests.length > this.maxInterests) {
      return false;
    }

    return interests.every(
      (interest) =>
        typeof interest === "string" &&
        interest.length >= this.minInterestLength &&
        interest.length <= this.maxInterestLength
    );
  }

  /**
   * Sanitize interests array
   * @param {string[]} interests - Array of interest keywords
   * @returns {string[]} Sanitized interests
   */
  sanitizeInterests(interests) {
    if (!Array.isArray(interests)) {
      return [];
    }

    return interests
      .map((interest) => {
        if (typeof interest !== "string") {
          return null;
        }

        // Trim whitespace and convert to lowercase
        const sanitized = interest.trim().toLowerCase();

        // Check length constraints
        if (
          sanitized.length < this.minInterestLength ||
          sanitized.length > this.maxInterestLength
        ) {
          return null;
        }

        return sanitized;
      })
      .filter((interest) => interest !== null)
      .slice(0, this.maxInterests); // Limit to max interests
  }

  /**
   * Get user type from user ID
   * @param {string} userId - User UUID
   * @returns {Promise<string>} User type ('patient' or 'donor')
   */
  async getUserType(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_type")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      return data.user_type;
    } catch (error) {
      console.error("Error getting user type:", error);
      throw error;
    }
  }

  /**
   * Check if user has interests stored
   * @param {string} userId - User UUID
   * @param {string} userType - 'patient' or 'donor'
   * @returns {Promise<boolean>} True if user has interests
   */
  async hasInterests(userId, userType) {
    try {
      const interests = await this.getUserInterests(userId, userType);
      return interests && interests.length > 0;
    } catch (error) {
      console.error("Error checking if user has interests:", error);
      return false;
    }
  }

  /**
   * Get interest statistics for monitoring
   * @returns {Promise<Object>} Interest statistics
   */
  async getInterestStatistics() {
    try {
      // Get patient interest stats
      const { data: patientStats, error: patientError } = await supabase
        .from("patients")
        .select("taste_keywords")
        .not("taste_keywords", "is", null);

      if (patientError) throw patientError;

      // Get donor interest stats
      const { data: donorStats, error: donorError } = await supabase
        .from("donors")
        .select("qloo_taste_keywords")
        .not("qloo_taste_keywords", "is", null);

      if (donorError) throw donorError;

      const patientWithInterests = patientStats.filter((p) => {
        const interests =
          typeof p.taste_keywords === "string"
            ? JSON.parse(p.taste_keywords)
            : p.taste_keywords;
        return Array.isArray(interests) && interests.length > 0;
      }).length;

      const donorWithInterests = donorStats.filter((d) => {
        const interests =
          typeof d.qloo_taste_keywords === "string"
            ? JSON.parse(d.qloo_taste_keywords)
            : d.qloo_taste_keywords;
        return Array.isArray(interests) && interests.length > 0;
      }).length;

      return {
        totalPatients: patientStats.length,
        patientsWithInterests: patientWithInterests,
        totalDonors: donorStats.length,
        donorsWithInterests: donorWithInterests,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting interest statistics:", error);
      throw error;
    }
  }
}

module.exports = new PersonalizationService();
