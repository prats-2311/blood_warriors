import api from "./api";

export const aiService = {
  // Send a message to the AI chatbot
  sendMessage: async (message) => {
    const response = await api.post("/ai/chat", {
      prompt: message,
    });
    return response.data;
  },

  // Get chat history
  getChatHistory: async (limit = 50) => {
    const response = await api.get(`/ai/chat/history?limit=${limit}`);
    return response.data;
  },

  // Clear chat history
  clearChatHistory: async () => {
    const response = await api.delete("/ai/chat/history");
    return response.data;
  },

  // Get health recommendations
  getHealthRecommendations: async (userType) => {
    const response = await api.get(`/ai/recommendations?user_type=${userType}`);
    return response.data;
  },

  // Get emergency assistance
  getEmergencyAssistance: async (situation) => {
    const response = await api.post("/ai/emergency", {
      situation,
    });
    return response.data;
  },
};
