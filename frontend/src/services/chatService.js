import api from "./api";

export const chatService = {
  // Save chat message to chathistory table
  saveChatMessage: async (userId, prompt, response) => {
    try {
      const chatResponse = await api.post("/chat/save", {
        user_id: userId,
        prompt: prompt,
        response: response,
      });
      return chatResponse.data;
    } catch (error) {
      console.error("Error saving chat message:", error);
      throw error;
    }
  },

  // Get chat history with pagination and filtering
  getChatHistory: async (userId, options = {}) => {
    try {
      const params = new URLSearchParams();

      if (options.limit) params.append("limit", options.limit);
      if (options.offset) params.append("offset", options.offset);
      if (options.date_from) params.append("date_from", options.date_from);
      if (options.date_to) params.append("date_to", options.date_to);
      if (options.search) params.append("search", options.search);

      const response = await api.get(`/users/${userId}/chat-history?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
  },

  // Clear chat history with user confirmation
  clearChatHistory: async (userId, confirmationToken = null) => {
    try {
      const response = await api.delete(`/users/${userId}/chat-history`, {
        data: { confirmation_token: confirmationToken },
      });
      return response.data;
    } catch (error) {
      console.error("Error clearing chat history:", error);
      throw error;
    }
  },

  // Send message to AI and get response
  sendMessage: async (userId, message, context = {}) => {
    try {
      const response = await api.post("/chat/message", {
        user_id: userId,
        message: message,
        context: context,
        user_type: context.user_type,
        blood_group: context.blood_group,
      });

      // Automatically save the conversation
      if (response.data.success) {
        await chatService.saveChatMessage(
          userId,
          message,
          response.data.response
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get chat session information
  getChatSession: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/chat-session`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat session:", error);
      return {
        session_id: null,
        started_at: null,
        message_count: 0,
        last_activity: null,
      };
    }
  },

  // Start new chat session
  startChatSession: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/chat-session/start`);
      return response.data;
    } catch (error) {
      console.error("Error starting chat session:", error);
      throw error;
    }
  },

  // End chat session
  endChatSession: async (userId, sessionId) => {
    try {
      const response = await api.post(
        `/users/${userId}/chat-session/${sessionId}/end`
      );
      return response.data;
    } catch (error) {
      console.error("Error ending chat session:", error);
      throw error;
    }
  },

  // Get chat statistics
  getChatStats: async (userId, dateRange = null) => {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append("date_from", dateRange.from);
        params.append("date_to", dateRange.to);
      }

      const response = await api.get(`/users/${userId}/chat-stats?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat stats:", error);
      return {
        total_messages: 0,
        total_sessions: 0,
        average_session_length: 0,
        most_common_topics: [],
      };
    }
  },

  // Search chat history
  searchChatHistory: async (userId, searchQuery, options = {}) => {
    try {
      const params = new URLSearchParams({ q: searchQuery });

      if (options.limit) params.append("limit", options.limit);
      if (options.date_from) params.append("date_from", options.date_from);
      if (options.date_to) params.append("date_to", options.date_to);
      if (options.message_type)
        params.append("message_type", options.message_type);

      const response = await api.get(
        `/users/${userId}/chat-history/search?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching chat history:", error);
      throw error;
    }
  },

  // Export chat history
  exportChatHistory: async (userId, format = "json", options = {}) => {
    try {
      const params = new URLSearchParams({ format });

      if (options.date_from) params.append("date_from", options.date_from);
      if (options.date_to) params.append("date_to", options.date_to);
      if (options.include_context) params.append("include_context", "true");

      const response = await api.get(
        `/users/${userId}/chat-history/export?${params}`,
        {
          responseType: "blob",
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error exporting chat history:", error);
      throw error;
    }
  },

  // Get suggested questions based on user type
  getSuggestedQuestions: async (userType, bloodGroup = null) => {
    try {
      const params = new URLSearchParams({ user_type: userType });
      if (bloodGroup) params.append("blood_group", bloodGroup);

      const response = await api.get(`/chat/suggested-questions?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching suggested questions:", error);
      // Return default suggestions as fallback
      if (userType === "Patient") {
        return [
          "What should I know before receiving a blood transfusion?",
          "How can I prepare for my upcoming transfusion?",
          "What are the side effects of blood transfusion?",
          "How long does a blood transfusion take?",
        ];
      } else {
        return [
          "What are the requirements for blood donation?",
          "How often can I donate blood?",
          "What should I do before donating blood?",
          "What happens during blood donation?",
        ];
      }
    }
  },

  // Get chat context for better AI responses
  getChatContext: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/chat-context`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat context:", error);
      return {
        user_type: null,
        blood_group: null,
        recent_activity: [],
        preferences: {},
      };
    }
  },

  // Update chat preferences
  updateChatPreferences: async (userId, preferences) => {
    try {
      const response = await api.put(
        `/users/${userId}/chat-preferences`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error("Error updating chat preferences:", error);
      throw error;
    }
  },

  // Get chat preferences
  getChatPreferences: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/chat-preferences`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat preferences:", error);
      return {
        save_history: true,
        show_suggestions: true,
        enable_notifications: false,
        language: "en",
      };
    }
  },

  // Rate chat response
  rateChatResponse: async (chatId, rating, feedback = null) => {
    try {
      const response = await api.post(`/chat/${chatId}/rate`, {
        rating: rating, // 1-5 stars
        feedback: feedback,
      });
      return response.data;
    } catch (error) {
      console.error("Error rating chat response:", error);
      throw error;
    }
  },

  // Report inappropriate content
  reportContent: async (chatId, reason, description = null) => {
    try {
      const response = await api.post(`/chat/${chatId}/report`, {
        reason: reason,
        description: description,
      });
      return response.data;
    } catch (error) {
      console.error("Error reporting content:", error);
      throw error;
    }
  },

  // Get chat analytics for admin
  getChatAnalytics: async (dateRange = null) => {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append("date_from", dateRange.from);
        params.append("date_to", dateRange.to);
      }

      const response = await api.get(`/chat/analytics?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat analytics:", error);
      return {
        total_conversations: 0,
        active_users: 0,
        average_response_time: 0,
        satisfaction_rating: 0,
      };
    }
  },

  // Get emergency assistance
  getEmergencyAssistance: async (userId, situation) => {
    try {
      const response = await api.post("/chat/emergency", {
        user_id: userId,
        situation: situation,
      });
      return response.data;
    } catch (error) {
      console.error("Error getting emergency assistance:", error);
      throw error;
    }
  },

  // Validate chat message
  validateMessage: (message) => {
    const errors = {};

    if (!message || typeof message !== "string") {
      errors.message = "Message is required";
    } else if (message.trim().length === 0) {
      errors.message = "Message cannot be empty";
    } else if (message.length > 1000) {
      errors.message = "Message cannot exceed 1000 characters";
    } else if (message.trim().length < 2) {
      errors.message = "Message must be at least 2 characters long";
    }

    // Check for potentially harmful content
    const harmfulPatterns = [
      /\b(suicide|kill myself|end it all)\b/i,
      /\b(drug|illegal|prescription abuse)\b/i,
    ];

    if (harmfulPatterns.some((pattern) => pattern.test(message))) {
      errors.content = "Message contains potentially harmful content";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Format chat message for display
  formatMessage: (message, timestamp) => {
    return {
      text: message.trim(),
      timestamp: new Date(timestamp),
      formattedTime: new Date(timestamp).toLocaleTimeString(),
      formattedDate: new Date(timestamp).toLocaleDateString(),
    };
  },

  // Get chat health tips
  getHealthTips: async (userType, bloodGroup = null) => {
    try {
      const params = new URLSearchParams({ user_type: userType });
      if (bloodGroup) params.append("blood_group", bloodGroup);

      const response = await api.get(`/chat/health-tips?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching health tips:", error);
      return [];
    }
  },
};
