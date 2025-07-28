const { supabase } = require("../utils/supabase");

class DonationRequest {
  static async create(requestData) {
    const { data, error } = await supabase
      .from("DonationRequests")
      .insert(requestData)
      .select(
        `
        *,
        Patients!inner(
          *,
          Users!inner(full_name, phone_number)
        ),
        BloodGroups!inner(group_name),
        BloodComponents!inner(component_name)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(requestId) {
    const { data, error } = await supabase
      .from("DonationRequests")
      .select(
        `
        *,
        Patients!inner(
          *,
          Users!inner(full_name, phone_number)
        ),
        BloodGroups!inner(group_name),
        BloodComponents!inner(component_name)
      `
      )
      .eq("request_id", requestId)
      .single();

    if (error) throw error;
    return data;
  }

  static async findAll(filters = {}) {
    let query = supabase.from("DonationRequests").select(`
        *,
        Patients!inner(
          *,
          Users!inner(full_name, phone_number)
        ),
        BloodGroups!inner(group_name),
        BloodComponents!inner(component_name)
      `);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.urgency) {
      query = query.eq("urgency", filters.urgency);
    }

    if (filters.blood_group_id) {
      query = query.eq("blood_group_id", filters.blood_group_id);
    }

    const { data, error } = await query.order("request_datetime", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }

  static async update(requestId, updates) {
    const { data, error } = await supabase
      .from("DonationRequests")
      .update(updates)
      .eq("request_id", requestId)
      .select(
        `
        *,
        Patients!inner(
          *,
          Users!inner(full_name, phone_number)
        ),
        BloodGroups!inner(group_name),
        BloodComponents!inner(component_name)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async createSOSNotifications(requestId, maxDistance = 15) {
    const { data, error } = await supabase.rpc("create_sos_notifications", {
      p_request_id: requestId,
      p_max_distance_km: maxDistance,
    });

    if (error) throw error;
    return data;
  }

  static async findOpenRequests() {
    const { data, error } = await supabase
      .from("DonationRequests")
      .select(
        `
        *,
        Patients!inner(
          *,
          Users!inner(full_name, phone_number)
        ),
        BloodGroups!inner(group_name),
        BloodComponents!inner(component_name)
      `
      )
      .eq("status", "Open")
      .order("request_datetime", { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = DonationRequest;
