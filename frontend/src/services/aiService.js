import api from "./api";

export const aiService = {
  // Query CareBot with a message
  queryCareBot: async (message) => {
    try {
      const response = await api.post("/ai/carebot/query", {
        message: message,
      });
      return response.data;
    } catch (error) {
      console.error("Error querying CareBot:", error);
      throw error;
    }
  },

  // Get chat history
  getChatHistory: async (limit = 50, offset = 0) => {
    try {
      const response = await api.get(`/ai/carebot/history?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  sendMessage: async (message) => {
    return await aiService.queryCareBot(message);
  },

  // Get patient interests
  getPatientInterests: async () => {
    try {
      const response = await api.get("/ai/patient/interests");
      return response.data;
    } catch (error) {
      console.error("Error fetching patient interests:", error);
      throw error;
    }
  },

  // Update patient interests
  updatePatientInterests: async (interests) => {
    try {
      const response = await api.put("/ai/patient/interests", {
        interests: interests
      });
      return response.data;
    } catch (error) {
      console.error("Error updating patient interests:", error);
      throw error;
    }
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
