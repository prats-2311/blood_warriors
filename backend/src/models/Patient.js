const { supabase } = require("../utils/supabase");

class Patient {
  static async create(patientData) {
    const { data, error } = await supabase
      .from("Patients")
      .insert(patientData)
      .select(
        `
        *,
        Users!inner(full_name, email, phone_number),
        BloodGroups!inner(group_name)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(patientId) {
    const { data, error } = await supabase
      .from("Patients")
      .select(
        `
        *,
        Users!inner(full_name, email, phone_number),
        BloodGroups!inner(group_name)
      `
      )
      .eq("patient_id", patientId)
      .single();

    if (error) throw error;
    return data;
  }

  static async update(patientId, updates) {
    const { data, error } = await supabase
      .from("Patients")
      .update(updates)
      .eq("patient_id", patientId)
      .select(
        `
        *,
        Users!inner(full_name, email, phone_number),
        BloodGroups!inner(group_name)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async getRequests(patientId) {
    const { data, error } = await supabase
      .from("DonationRequests")
      .select(
        `
        *,
        BloodGroups!inner(group_name),
        BloodComponents!inner(component_name)
      `
      )
      .eq("patient_id", patientId)
      .order("request_datetime", { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = Patient;
