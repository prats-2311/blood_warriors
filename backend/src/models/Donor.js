const { supabase } = require("../utils/supabase");

class Donor {
  static async create(donorData) {
    const { data, error } = await supabase
      .from("Donors")
      .insert(donorData)
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

  static async findById(donorId) {
    const { data, error } = await supabase
      .from("Donors")
      .select(
        `
        *,
        Users!inner(full_name, email, phone_number),
        BloodGroups!inner(group_name)
      `
      )
      .eq("donor_id", donorId)
      .single();

    if (error) throw error;
    return data;
  }

  static async update(donorId, updates) {
    const { data, error } = await supabase
      .from("Donors")
      .update(updates)
      .eq("donor_id", donorId)
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

  static async findEligibleDonors(requestId, maxDistance = 15) {
    const { data, error } = await supabase.rpc("find_eligible_donors", {
      p_request_id: requestId,
      p_max_distance_km: maxDistance,
    });

    if (error) throw error;
    return data;
  }

  static async updateLocation(donorId, latitude, longitude) {
    const { data, error } = await supabase
      .from("Donors")
      .update({
        latitude,
        longitude,
      })
      .eq("donor_id", donorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findNearby(
    latitude,
    longitude,
    radiusKm = 10,
    bloodGroupId = null
  ) {
    let query = supabase
      .from("Donors")
      .select(
        `
        *,
        Users!inner(full_name, email, phone_number),
        BloodGroups!inner(group_name)
      `
      )
      .eq("is_available_for_sos", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (bloodGroupId) {
      query = query.eq("blood_group_id", bloodGroupId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by distance (simple calculation for now)
    const filtered = data.filter((donor) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        donor.latitude,
        donor.longitude
      );
      return distance <= radiusKm;
    });

    return filtered;
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = Donor;
