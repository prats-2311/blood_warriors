const axios = require("axios");

class QlooService {
  constructor() {
    this.apiKey = process.env.QLOO_API_KEY;
    this.apiUrl = process.env.QLOO_API_URL || "https://api.qloo.com/v1";
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getTasteProfile(preferences) {
    try {
      const response = await this.client.post("/taste", {
        preferences: preferences,
      });

      return response.data.keywords || [];
    } catch (error) {
      console.error("Error getting taste profile from Qloo:", error);
      // Return default keywords if Qloo is unavailable
      return ["food", "entertainment", "lifestyle", "health"];
    }
  }

  async getRecommendations(tasteKeywords, category = "all") {
    try {
      const response = await this.client.post("/recommendations", {
        taste_keywords: tasteKeywords,
        category: category,
        limit: 10,
      });

      return response.data.recommendations || [];
    } catch (error) {
      console.error("Error getting recommendations from Qloo:", error);
      return [];
    }
  }

  async updateDonorTasteProfile(donorId, preferences) {
    try {
      const keywords = await this.getTasteProfile(preferences);

      // Update donor's taste keywords in database
      const { supabase } = require("../utils/supabase");
      const { data, error } = await supabase
        .from("Donors")
        .update({ qloo_taste_keywords: JSON.stringify(keywords) })
        .eq("donor_id", donorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating donor taste profile:", error);
      throw error;
    }
  }

  // Mock method for development when Qloo API is not available
  getMockTasteKeywords() {
    const categories = [
      ["food", "dining", "restaurants", "cuisine"],
      ["entertainment", "movies", "music", "events"],
      ["lifestyle", "fashion", "wellness", "fitness"],
      ["travel", "hotels", "destinations", "experiences"],
      ["technology", "gadgets", "apps", "innovation"],
    ];

    // Return a random selection of keywords
    const selectedCategory =
      categories[Math.floor(Math.random() * categories.length)];
    return selectedCategory.slice(0, 2 + Math.floor(Math.random() * 3));
  }
}

module.exports = new QlooService();
