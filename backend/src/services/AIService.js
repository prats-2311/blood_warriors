const axios = require("axios");
const { supabase } = require("../utils/supabase");

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

  async generateChatResponse(userId, prompt) {
    try {
      // Get user context for personalized responses
      const { data: user, error: userError } = await supabase
        .from("Users")
        .select(
          `
          *,
          Patients(*),
          Donors(*)
        `
        )
        .eq("user_id", userId)
        .single();

      if (userError) throw userError;

      // Get recent chat history for context
      const { data: chatHistory, error: historyError } = await supabase
        .from("ChatHistory")
        .select("prompt, response")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(5);

      if (historyError) throw historyError;

      // Build context for the AI
      const context = this.buildContext(user, chatHistory);
      const fullPrompt = `${context}\n\nUser: ${prompt}\nCareBot:`;

      // Generate response using LLM
      const response = await this.callLLM(fullPrompt);

      // Save chat history
      await this.saveChatHistory(userId, prompt, response);

      return response;
    } catch (error) {
      console.error("Error generating chat response:", error);

      // Fallback to predefined responses
      return this.getFallbackResponse(prompt);
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
      const { error } = await supabase.from("ChatHistory").insert({
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
      .from("ChatHistory")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async clearChatHistory(userId) {
    const { error } = await supabase
      .from("ChatHistory")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    return { message: "Chat history cleared successfully" };
  }
}

module.exports = new AIService();
