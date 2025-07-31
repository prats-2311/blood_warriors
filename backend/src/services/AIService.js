const axios = require("axios");
const { supabase } = require("../utils/supabase");
const PersonalizationService = require("./PersonalizationService");
const QlooService = require("./QlooService");
const FallbackResponseService = require("./FallbackResponseService");

class AIService {
  constructor() {
    this.llmApiUrl = process.env.LLM_API_URL;
    this.llmApiKey = process.env.LLM_API_KEY;

    // Initialize with Hugging Face Inference API as default
    this.client = axios.create({
      baseURL: this.llmApiUrl || "https://api-inference.huggingface.co/models",
      headers: {
        Authorization: `Bearer ${this.llmApiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async generateChatResponse(userId, prompt, userType = null) {
    try {
      // Get user type if not provided
      if (!userType) {
        userType = await PersonalizationService.getUserType(userId);
      }

      // Build personalized prompt with interests
      const personalizedPrompt = await this.buildPersonalizedPrompt(
        userId,
        prompt,
        userType
      );

      // Generate response using LLM
      const response = await this.callLLM(personalizedPrompt);

      // Save chat history
      await this.saveChatHistory(userId, prompt, response);

      return response;
    } catch (error) {
      console.error("Error generating chat response:", error);

      // Try to get user interests for personalized fallback
      try {
        const interests = await PersonalizationService.getUserInterests(
          userId,
          userType || "patient"
        );
        return FallbackResponseService.getPersonalizedFallback(
          prompt,
          interests,
          userType || "patient"
        );
      } catch (fallbackError) {
        console.error("Error getting personalized fallback:", fallbackError);
        return this.getFallbackResponse(prompt);
      }
    }
  }

  async callLLM(prompt) {
    try {
      // Using Hugging Face Inference API with a medical/health-focused model
      const response = await this.client.post("/microsoft/DialoGPT-medium", {
        inputs: prompt,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          do_sample: true,
          pad_token_id: 50256,
        },
      });

      if (
        response.data &&
        response.data[0] &&
        response.data[0].generated_text
      ) {
        // Extract only the bot's response
        const fullText = response.data[0].generated_text;
        const botResponse = fullText.split("CareBot:").pop().trim();
        return botResponse || this.getFallbackResponse(prompt);
      }

      return this.getFallbackResponse(prompt);
    } catch (error) {
      console.error("LLM API error:", error);
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Build personalized prompt with user interests and context
   * @param {string} userId - User UUID
   * @param {string} prompt - User's message
   * @param {string} userType - 'patient' or 'donor'
   * @returns {Promise<string>} Personalized prompt for LLM
   */
  async buildPersonalizedPrompt(userId, prompt, userType) {
    try {
      // Get personalized context
      const personalizedContext = await this.getPersonalizedContext(
        userId,
        userType
      );

      // Get recent chat history
      const chatHistory = await this.getChatHistory(userId, 5);

      // Build the complete personalized prompt
      let systemPrompt = `You are CareBot, a supportive and empathetic companion for a Thalassemia patient. Your goal is to provide comfort and suggest positive distractions based on their interests.

User Context:
- User Type: ${userType}
- Interests: ${JSON.stringify(personalizedContext.baseInterests)}`;

      if (
        personalizedContext.enrichedInterests.length >
        personalizedContext.baseInterests.length
      ) {
        systemPrompt += `
- Related Interests: ${JSON.stringify(personalizedContext.enrichedInterests)}`;
      }

      if (chatHistory && chatHistory.length > 0) {
        systemPrompt += `\n\nRecent conversation:`;
        chatHistory
          .reverse()
          .slice(0, 3)
          .forEach((chat) => {
            systemPrompt += `\nUser: ${chat.prompt}\nCareBot: ${chat.response}`;
          });
      }

      systemPrompt += `\n\nGuidelines:
- Provide accurate information about Thalassemia, blood donation, and health
- Be empathetic and supportive
- When appropriate, suggest activities or content related to their interests: ${personalizedContext.baseInterests.join(
        ", "
      )}
- Encourage regular medical checkups
- Promote blood donation awareness
- If asked about medical emergencies, advise consulting healthcare professionals
- Keep responses concise and helpful
- Use their interests to provide personalized suggestions when they're feeling down or bored`;

      return `${systemPrompt}\n\nUser: ${prompt}\nCareBot:`;
    } catch (error) {
      console.error("Error building personalized prompt:", error);
      // Fallback to basic prompt
      return `You are CareBot, a compassionate AI assistant for Thalassemia care and blood donation support.\n\nUser: ${prompt}\nCareBot:`;
    }
  }

  /**
   * Get personalized context for user
   * @param {string} userId - User UUID
   * @param {string} userType - 'patient' or 'donor'
   * @returns {Promise<Object>} Personalized context
   */
  async getPersonalizedContext(userId, userType) {
    try {
      const chatHistory = await this.getChatHistory(userId, 5);
      return await PersonalizationService.buildPersonalizedContext(
        userId,
        userType,
        chatHistory
      );
    } catch (error) {
      console.error("Error getting personalized context:", error);
      return {
        userId,
        userType,
        baseInterests: [],
        enrichedInterests: [],
        conversationHistory: [],
        contextMetadata: { error: error.message },
      };
    }
  }

  /**
   * Generate interest-based suggestions
   * @param {string[]} interests - User interests
   * @param {string} mood - User's current mood/context
   * @param {string} context - Additional context
   * @returns {Promise<string>} Personalized suggestions
   */
  async generateInterestBasedSuggestions(
    interests,
    mood = "neutral",
    context = ""
  ) {
    if (!interests || interests.length === 0) {
      return "I'd be happy to help you find something enjoyable to do. What are some of your interests or hobbies?";
    }

    const suggestions = [];

    // Map interests to specific suggestions
    const interestSuggestions = {
      cricket: [
        "watching cricket highlights on YouTube",
        "reading about your favorite cricket players",
        "following live cricket scores",
        "discussing cricket with friends",
      ],
      movies: [
        "watching a feel-good Bollywood movie",
        "exploring movie reviews and recommendations",
        "watching movie trailers for upcoming releases",
        "discussing favorite movies with friends",
      ],
      music: [
        "listening to your favorite songs",
        "discovering new music on streaming platforms",
        "watching music videos",
        "learning about your favorite artists",
      ],
      food: [
        "trying a new recipe",
        "watching cooking videos",
        "exploring food blogs",
        "planning your next meal",
      ],
      books: [
        "reading a good book",
        "exploring book recommendations",
        "joining online book discussions",
        "listening to audiobooks",
      ],
      travel: [
        "planning future trips",
        "watching travel documentaries",
        "exploring virtual tours online",
        "reading travel blogs",
      ],
    };

    // Generate suggestions based on user's interests
    interests.slice(0, 3).forEach((interest) => {
      const interestSuggestions_list =
        interestSuggestions[interest.toLowerCase()];
      if (interestSuggestions_list) {
        const randomSuggestion =
          interestSuggestions_list[
            Math.floor(Math.random() * interestSuggestions_list.length)
          ];
        suggestions.push(randomSuggestion);
      }
    });

    if (suggestions.length === 0) {
      return `Based on your interests in ${interests.join(
        ", "
      )}, there are many activities you could explore to lift your spirits.`;
    }

    let response = "";
    if (mood === "sad" || mood === "down") {
      response = "I'm sorry to hear you're feeling down. ";
    } else if (mood === "bored") {
      response = "I understand you're feeling bored. ";
    }

    response += `Since you enjoy ${interests
      .slice(0, 2)
      .join(" and ")}, how about ${suggestions[0]}`;

    if (suggestions.length > 1) {
      response += ` or ${suggestions[1]}`;
    }

    response +=
      "? Sometimes engaging with our interests can really help improve our mood.";

    return response;
  }

  /**
   * Get personalized fallback response based on interests
   * @param {string} prompt - User's message
   * @param {string[]} interests - User interests
   * @returns {string} Personalized fallback response
   */
  getPersonalizedFallback(prompt, interests) {
    const lowerPrompt = prompt.toLowerCase();

    // Detect mood/context from prompt
    let mood = "neutral";
    if (
      lowerPrompt.includes("sad") ||
      lowerPrompt.includes("down") ||
      lowerPrompt.includes("depressed")
    ) {
      mood = "sad";
    } else if (
      lowerPrompt.includes("bored") ||
      lowerPrompt.includes("boring")
    ) {
      mood = "bored";
    }

    // Thalassemia-related responses with personalization
    if (lowerPrompt.includes("thalassemia")) {
      let response =
        "Thalassemia is a genetic blood disorder that affects hemoglobin production. Regular blood transfusions and proper medical care are essential. Please consult with your hematologist for personalized advice.";

      if (interests.length > 0) {
        response += ` In the meantime, engaging in activities you enjoy like ${interests
          .slice(0, 2)
          .join(" and ")} can help maintain a positive outlook.`;
      }

      return response;
    }

    // Mood-based responses with interests
    if (mood === "sad" || mood === "bored") {
      if (interests.length > 0) {
        return this.generateInterestBasedSuggestions(interests, mood);
      } else {
        return mood === "sad"
          ? "I'm sorry to hear you're feeling down. It's completely normal to have difficult days. Would you like to share what interests or activities usually help you feel better?"
          : "I understand you're feeling bored. What are some activities or interests that you usually enjoy? I'd be happy to suggest something based on what you like.";
      }
    }

    // Blood donation responses
    if (lowerPrompt.includes("donate") || lowerPrompt.includes("donation")) {
      return "Blood donation is a noble act that saves lives! Healthy individuals can donate blood every 3 months. Make sure you're well-rested, hydrated, and have eaten before donating.";
    }

    // Health and wellness with personalization
    if (lowerPrompt.includes("health") || lowerPrompt.includes("wellness")) {
      let response =
        "Maintaining good health involves regular exercise, balanced nutrition, adequate sleep, and routine medical checkups. For Thalassemia patients, following your treatment plan is crucial.";

      if (interests.includes("fitness") || interests.includes("sports")) {
        response +=
          " I see you're interested in fitness/sports, which is great for maintaining good health!";
      }

      return response;
    }

    // Emergency or urgent
    if (lowerPrompt.includes("emergency") || lowerPrompt.includes("urgent")) {
      return "For medical emergencies, please contact your healthcare provider immediately or call emergency services. I'm here to provide general information and support.";
    }

    // Default personalized response
    if (interests.length > 0) {
      return `I'm here to help you with information about Thalassemia care, blood donation, and general health topics. I also notice you're interested in ${interests
        .slice(0, 2)
        .join(
          " and "
        )}, so feel free to chat about those topics too! How can I assist you today?`;
    }

    return "I'm here to help you with information about Thalassemia care, blood donation, and general health topics. How can I assist you today?";
  }

  buildContext(user, chatHistory) {
    let context = `You are CareBot, a compassionate AI assistant specialized in Thalassemia care and blood donation support. You provide helpful, accurate, and empathetic responses.

User Profile:
- Name: ${user.full_name}
- Type: ${user.user_type}`;

    if (user.Patients && user.Patients.length > 0) {
      context += `
- Patient with Thalassemia
- Blood Group: Information available in profile`;
    }

    if (user.Donors && user.Donors.length > 0) {
      context += `
- Blood Donor
- Available for SOS: ${user.Donors[0].is_available_for_sos ? "Yes" : "No"}`;
    }

    if (chatHistory && chatHistory.length > 0) {
      context += `\n\nRecent conversation:`;
      chatHistory.reverse().forEach((chat) => {
        context += `\nUser: ${chat.prompt}\nCareBot: ${chat.response}`;
      });
    }

    context += `\n\nGuidelines:
- Provide accurate information about Thalassemia, blood donation, and health
- Be empathetic and supportive
- Encourage regular medical checkups
- Promote blood donation awareness
- If asked about medical emergencies, advise consulting healthcare professionals
- Keep responses concise and helpful`;

    return context;
  }

  getFallbackResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Thalassemia-related responses
    if (lowerPrompt.includes("thalassemia")) {
      return "Thalassemia is a genetic blood disorder that affects hemoglobin production. Regular blood transfusions and proper medical care are essential. Please consult with your hematologist for personalized advice.";
    }

    // Blood donation responses
    if (lowerPrompt.includes("donate") || lowerPrompt.includes("donation")) {
      return "Blood donation is a noble act that saves lives! Healthy individuals can donate blood every 3 months. Make sure you're well-rested, hydrated, and have eaten before donating.";
    }

    // Health and wellness
    if (lowerPrompt.includes("health") || lowerPrompt.includes("wellness")) {
      return "Maintaining good health involves regular exercise, balanced nutrition, adequate sleep, and routine medical checkups. For Thalassemia patients, following your treatment plan is crucial.";
    }

    // Emergency or urgent
    if (lowerPrompt.includes("emergency") || lowerPrompt.includes("urgent")) {
      return "For medical emergencies, please contact your healthcare provider immediately or call emergency services. I'm here to provide general information and support.";
    }

    // Default response
    return "I'm here to help you with information about Thalassemia care, blood donation, and general health topics. How can I assist you today?";
  }

  async saveChatHistory(userId, prompt, response) {
    try {
      const { error } = await supabase.from("chathistory").insert({
        user_id: userId,
        prompt: prompt,
        response: response,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  async getChatHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from("chathistory")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async clearChatHistory(userId) {
    const { error } = await supabase
      .from("chathistory")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    return { message: "Chat history cleared successfully" };
  }
}

module.exports = new AIService();
