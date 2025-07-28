import api from "./api";

export const aiService = {
  // Query CareBot
  queryCareBot: async (prompt) => {
    const response = await api.post("/ai/carebot/query", { prompt });
    return response.data;
  },
};
