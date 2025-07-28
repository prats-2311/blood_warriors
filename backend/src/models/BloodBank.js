const { supabase } = require("../utils/supabase");

class BloodBank {
  static async findAll() {
    const { data, error } = await supabase
      .from("BloodBanks")
      .select("*")
      .order("name");

    if (error) throw error;
    return data;
  }

  static async findById(bankId) {
    const { data, error } = await supabase
      .from("BloodBanks")
      .select("*")
      .eq("bank_id", bankId)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByCity(city) {
    const { data, error } = await supabase
      .from("BloodBanks")
      .select("*")
      .ilike("city", `%${city}%`)
      .order("name");

    if (error) throw error;
    return data;
  }

  static async findNearby(latitude, longitude, radiusKm = 25) {
    const { data, error } = await supabase
      .from("BloodBanks")
      .select("*")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) throw error;

    // Filter by distance
    const filtered = data.filter((bank) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        bank.latitude,
        bank.longitude
      );
      return distance <= radiusKm;
    });

    return filtered.sort((a, b) => {
      const distA = this.calculateDistance(
        latitude,
        longitude,
        a.latitude,
        a.longitude
      );
      const distB = this.calculateDistance(
        latitude,
        longitude,
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });
  }

  static async getStock(bankId) {
    const { data, error } = await supabase
      .from("BloodStock")
      .select(
        `
        *,
        BloodGroups!inner(group_name),
        BloodComponents!inner(component_name)
      `
      )
      .eq("bank_id", bankId)
      .gt("units_available", 0);

    if (error) throw error;
    return data;
  }

  static async updateStock(bankId, bloodGroupId, componentId, unitsAvailable) {
    const { data, error } = await supabase
      .from("BloodStock")
      .upsert({
        bank_id: bankId,
        blood_group_id: bloodGroupId,
        component_id: componentId,
        units_available: unitsAvailable,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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

module.exports = BloodBank;
