const { supabase } = require("../utils/supabase");

class Patient {
  static async create(patientData) {
    const { data, error } = await supabase
      .from("patients")
      .insert(patientData)
      .select(
        `
        *,
        users!inner(full_name, email, phone_number),
        bloodgroups!inner(group_name)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(patientId) {
    const { data, error } = await supabase
      .from("patients")
      .select(
        `
        *,
        users!inner(full_name, email, phone_number),
        bloodgroups!inner(group_name)
      `
      )
      .eq("patient_id", patientId)
      .single();

    if (error) throw error;
    return data;
  }

  static async update(patientId, updates) {
    const { data, error } = await supabase
      .from("patients")
      .update(updates)
      .eq("patient_id", patientId)
      .select(
        `
        *,
        users!inner(full_name, email, phone_number),
        bloodgroups!inner(group_name)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async getRequests(patientId) {
    const { data, error } = await supabase
      .from("donationrequests")
      .select(
        `
        *,
        bloodgroups!inner(group_name),
        bloodcomponents!inner(component_name)
      `
      )
      .eq("patient_id", patientId)
      .order("request_datetime", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Update patient interests
   * @param {string} patientId - Patient UUID
   * @param {string[]} interests - Array of interest keywords
   * @returns {Promise<Object>} Updated patient data
   */
  static async updateInterests(patientId, interests) {
    // Validate interests
    if (!Array.isArray(interests)) {
      throw new Error('Interests must be an array');
    }

    // Sanitize interests
    const sanitizedInterests = interests
      .filter(interest => typeof interest === 'string' && interest.trim().length > 0)
      .map(interest => interest.trim().toLowerCase())
      .slice(0, 20); // Limit to 20 interests

    const { data, error } = await supabase
      .from("patients")
      .update({ taste_keywords: JSON.stringify(sanitizedInterests) })
      .eq("patient_id", patientId)
      .select(
        `
        *,
        users!inner(full_name, email, phone_number),
        bloodgroups!inner(group_name)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get patient interests
   * @param {string} patientId - Patient UUID
   * @returns {Promise<string[]>} Array of interest keywords
   */
  static async getInterests(patientId) {
    const { data, error } = await supabase
      .from("patients")
      .select("taste_keywords")
      .eq("patient_id", patientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Patient not found
        return [];
      }
      throw error;
    }

    if (!data.taste_keywords) {
      return [];
    }

    // Handle both string and array formats
    if (typeof data.taste_keywords === 'string') {
      try {
        return JSON.parse(data.taste_keywords);
      } catch (parseError) {
        console.warn('Failed to parse patient interests:', parseError);
        return [];
      }
    }

    return Array.isArray(data.taste_keywords) ? data.taste_keywords : [];
  }

  /**
   * Find patients by interests
   * @param {string[]} interests - Array of interests to match
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object[]>} Array of matching patients
   */
  static async findByInterests(interests, limit = 10) {
    if (!Array.isArray(interests) || interests.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("patients")
      .select(
        `
        patient_id,
        taste_keywords,
        users!inner(full_name, email),
        bloodgroups!inner(group_name)
      `
      )
      .overlaps('taste_keywords', interests)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if patient has interests stored
   * @param {string} patientId - Patient UUID
   * @returns {Promise<boolean>} True if patient has interests
   */
  static async hasInterests(patientId) {
    try {
      const interests = await this.getInterests(patientId);
      return interests && interests.length > 0;
    } catch (error) {
      console.error('Error checking patient interests:', error);
      return false;
    }
  }

  /**
   * Validate interest data
   * @param {string[]} interests - Array of interests to validate
   * @returns {Object} Validation result
   */
  static validateInterests(interests) {
    const errors = [];
    
    if (!Array.isArray(interests)) {
      errors.push('Interests must be an array');
      return { isValid: false, errors };
    }

    if (interests.length > 20) {
      errors.push('Maximum 20 interests allowed');
    }

    interests.forEach((interest, index) => {
      if (typeof interest !== 'string') {
        errors.push(`Interest at index ${index} must be a string`);
      } else if (interest.trim().length < 2) {
        errors.push(`Interest at index ${index} must be at least 2 characters long`);
      } else if (interest.length > 50) {
        errors.push(`Interest at index ${index} must be less than 50 characters`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get patients with similar interests for recommendations
   * @param {string} patientId - Patient UUID
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object[]>} Array of patients with similar interests
   */
  static async findSimilarPatients(patientId, limit = 5) {
    try {
      // Get current patient's interests
      const currentInterests = await this.getInterests(patientId);
      
      if (currentInterests.length === 0) {
        return [];
      }

      // Find patients with overlapping interests
      const { data, error } = await supabase
        .from("patients")
        .select(
          `
          patient_id,
          taste_keywords,
          users!inner(full_name)
        `
        )
        .overlaps('taste_keywords', currentInterests)
        .neq('patient_id', patientId)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding similar patients:', error);
      return [];
    }
  }

module.exports = Patient;
