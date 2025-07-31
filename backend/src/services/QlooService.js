const axios = require("axios");

class QlooService {
  constructor() {
    this.apiKey = process.env.QLOO_API_KEY;
    this.apiUrl = process.env.QLOO_API_URL || "https://api.qloo.com/v1";
    this.isEnabled = !!this.apiKey;
    this.rateLimitDelay = 100; // ms between requests
    this.maxRetries = 3;
    this.timeout = 5000; // 5 seconds

    if (this.isEnabled) {
      this.client = axios.create({
        baseURL: this.apiUrl,
        timeout: this.timeout,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });
    }
  }

  async getTasteProfile(preferences) {
    if (!this.isEnabled) {
      console.warn("Qloo API not configured, using mock data");
      return this.getMockTasteKeywords();
    }

    try {
      // Validate input
      if (!Array.isArray(preferences) || preferences.length === 0) {
        return [];
      }

      const response = await this.makeApiCall("/taste", {
        preferences: preferences,
      });

      return response.data.keywords || [];
    } catch (error) {
      console.error("Error getting taste profile from Qloo:", error);
      // Return enhanced fallback based on input preferences
      return this.getFallbackKeywords(preferences);
    }
  }

  async getRecommendations(tasteKeywords, category = "all") {
    if (!this.isEnabled) {
      console.warn("Qloo API not configured, using mock recommendations");
      return this.getMockRecommendations(tasteKeywords, category);
    }

    try {
      // Validate input
      if (!Array.isArray(tasteKeywords) || tasteKeywords.length === 0) {
        return [];
      }

      const response = await this.makeApiCall("/recommendations", {
        taste_keywords: tasteKeywords,
        category: category,
        limit: 10,
      });

      return response.data.recommendations || [];
    } catch (error) {
      console.error("Error getting recommendations from Qloo:", error);
      return this.getMockRecommendations(tasteKeywords, category);
    }
  }

  async updateDonorTasteProfile(donorId, preferences) {
    try {
      const keywords = await this.getTasteProfile(preferences);

      // Update donor's taste keywords in database
      const { supabase } = require("../utils/supabase");
      const { data, error } = await supabase
        .from("donors")
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

  /**
   * Get enriched interests by expanding base interests with related concepts
   * @param {string[]} baseInterests - Base user interests
   * @returns {Promise<string[]>} Enriched interest keywords
   */
  async getEnrichedInterests(baseInterests) {
    if (!Array.isArray(baseInterests) || baseInterests.length === 0) {
      return [];
    }

    try {
      // Get taste profile to expand interests
      const enrichedKeywords = await this.getTasteProfile(baseInterests);

      // Combine base interests with enriched keywords, removing duplicates
      const combined = [...new Set([...baseInterests, ...enrichedKeywords])];

      return combined;
    } catch (error) {
      console.error("Error enriching interests:", error);
      return baseInterests; // Return original interests on error
    }
  }

  /**
   * Make API call with retry logic and rate limiting
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} API response
   */
  async makeApiCall(endpoint, data) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Add rate limiting delay
        if (attempt > 1) {
          await this.delay(this.rateLimitDelay * attempt);
        }

        const response = await this.client.post(endpoint, data);
        return response;
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          throw error;
        }

        console.warn(`Qloo API attempt ${attempt} failed:`, error.message);

        // If this is the last attempt, throw the error
        if (attempt === this.maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  /**
   * Delay execution for rate limiting
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get fallback keywords based on input preferences
   * @param {string[]} preferences - Original preferences
   * @returns {string[]} Fallback keywords
   */
  getFallbackKeywords(preferences) {
    if (!Array.isArray(preferences)) {
      return this.getMockTasteKeywords();
    }

    const keywordMap = {
      cricket: ["sports", "games", "competition", "team sports"],
      movies: ["entertainment", "cinema", "films", "bollywood"],
      music: ["entertainment", "songs", "concerts", "artists"],
      food: ["dining", "restaurants", "cuisine", "cooking"],
      travel: ["destinations", "hotels", "experiences", "adventure"],
      books: ["reading", "literature", "authors", "stories"],
      fitness: ["health", "exercise", "wellness", "sports"],
      technology: ["gadgets", "apps", "innovation", "digital"],
      fashion: ["style", "clothing", "trends", "shopping"],
      art: ["creativity", "painting", "culture", "museums"],
    };

    const fallbackKeywords = [];

    preferences.forEach((preference) => {
      const related = keywordMap[preference.toLowerCase()];
      if (related) {
        fallbackKeywords.push(...related.slice(0, 2)); // Add 2 related keywords
      }
    });

    // If no matches found, return generic keywords
    if (fallbackKeywords.length === 0) {
      return this.getMockTasteKeywords();
    }

    // Remove duplicates and limit to reasonable number
    return [...new Set(fallbackKeywords)].slice(0, 8);
  }

  /**
   * Get mock recommendations for development/fallback
   * @param {string[]} tasteKeywords - Taste keywords
   * @param {string} category - Category filter
   * @returns {Object[]} Mock recommendations
   */
  getMockRecommendations(tasteKeywords, category) {
    const mockRecommendations = {
      cricket: [
        { name: "IPL Cricket Match", category: "sports", type: "event" },
        {
          name: "Cricket World Cup Highlights",
          category: "entertainment",
          type: "video",
        },
      ],
      movies: [
        {
          name: "Latest Bollywood Films",
          category: "entertainment",
          type: "movie",
        },
        { name: "Cinema Hall Near You", category: "location", type: "venue" },
      ],
      food: [
        { name: "Local Restaurant Deals", category: "dining", type: "offer" },
        { name: "Food Delivery Apps", category: "service", type: "app" },
      ],
      music: [
        { name: "Concert Tickets", category: "entertainment", type: "event" },
        { name: "Music Streaming Service", category: "service", type: "app" },
      ],
    };

    const recommendations = [];

    if (Array.isArray(tasteKeywords)) {
      tasteKeywords.forEach((keyword) => {
        const keywordRecs = mockRecommendations[keyword.toLowerCase()];
        if (keywordRecs) {
          recommendations.push(...keywordRecs);
        }
      });
    }

    // Filter by category if specified
    if (category && category !== "all") {
      return recommendations.filter((rec) => rec.category === category);
    }

    return recommendations.slice(0, 10); // Limit to 10 recommendations
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

  /**
   * Check if Qloo API is available and configured
   * @returns {boolean} True if API is available
   */
  isApiAvailable() {
    return this.isEnabled;
  }

  /**
   * Get API status and configuration info
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      rateLimitDelay: this.rateLimitDelay,
    };
  }
}

module.exports = new QlooService();
