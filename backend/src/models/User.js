const { supabase } = require("../utils/supabase");

class User {
  static async create(userData) {
    const { data, error } = await supabase
      .from("Users")
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByAuthId(authId) {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("auth_id", authId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  static async findById(userId) {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async update(userId, updates) {
    const { data, error } = await supabase
      .from("Users")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }
}

module.exports = User;
