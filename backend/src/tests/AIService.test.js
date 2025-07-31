const AIService = require("../services/AIService");
const PersonalizationService = require("../services/PersonalizationService");
const { supabase } = require("../utils/supabase");
const axios = require("axios");

// Mock dependencies
jest.mock("../services/PersonalizationService");
jest.mock("../utils/supabase");
jest.mock("axios");

describe("AIService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateChatResponse", () => {
    test("should generate personalized chat response", async () => {
      // Mock PersonalizationService methods
      PersonalizationService.getUserType.mockResolvedValue("patient");

      // Mock buildPersonalizedPrompt
      jest
        .spyOn(AIService, "buildPersonalizedPrompt")
        .mockResolvedValue("Personalized prompt for LLM");

      // Mock callLLM
      jest
        .spyOn(AIService, "callLLM")
        .mockResolvedValue("Personalized response from LLM");

      // Mock saveChatHistory
      jest.spyOn(AIService, "saveChatHistory").mockResolvedValue();

      const response = await AIService.generateChatResponse(
        "user-123",
        "I feel sad"
      );

      expect(response).toBe("Personalized response from LLM");
      expect(PersonalizationService.getUserType).toHaveBeenCalledWith(
        "user-123"
      );
      expect(AIService.buildPersonalizedPrompt).toHaveBeenCalledWith(
        "user-123",
        "I feel sad",
        "patient"
      );
      expect(AIService.saveChatHistory).toHaveBeenCalledWith(
        "user-123",
        "I feel sad",
        "Personalized response from LLM"
      );
    });

    test("should use provided user type", async () => {
      jest
        .spyOn(AIService, "buildPersonalizedPrompt")
        .mockResolvedValue("Personalized prompt");
      jest.spyOn(AIService, "callLLM").mockResolvedValue("Response");
      jest.spyOn(AIService, "saveChatHistory").mockResolvedValue();

      await AIService.generateChatResponse("user-123", "Hello", "donor");

      expect(PersonalizationService.getUserType).not.toHaveBeenCalled();
      expect(AIService.buildPersonalizedPrompt).toHaveBeenCalledWith(
        "user-123",
        "Hello",
        "donor"
      );
    });

    test("should fallback to personalized fallback on error", async () => {
      PersonalizationService.getUserType.mockRejectedValue(
        new Error("Database error")
      );
      PersonalizationService.getUserInterests.mockResolvedValue([
        "cricket",
        "movies",
      ]);

      jest
        .spyOn(AIService, "getPersonalizedFallback")
        .mockReturnValue("Personalized fallback response");

      const response = await AIService.generateChatResponse(
        "user-123",
        "Hello"
      );

      expect(response).toBe("Personalized fallback response");
      expect(AIService.getPersonalizedFallback).toHaveBeenCalledWith("Hello", [
        "cricket",
        "movies",
      ]);
    });

    test("should fallback to generic response on complete failure", async () => {
      PersonalizationService.getUserType.mockRejectedValue(
        new Error("Database error")
      );
      PersonalizationService.getUserInterests.mockRejectedValue(
        new Error("Another error")
      );

      jest
        .spyOn(AIService, "getFallbackResponse")
        .mockReturnValue("Generic fallback response");

      const response = await AIService.generateChatResponse(
        "user-123",
        "Hello"
      );

      expect(response).toBe("Generic fallback response");
      expect(AIService.getFallbackResponse).toHaveBeenCalledWith("Hello");
    });
  });

  describe("buildPersonalizedPrompt", () => {
    test("should build personalized prompt with interests", async () => {
      const mockContext = {
        baseInterests: ["cricket", "movies"],
        enrichedInterests: ["cricket", "movies", "sports", "entertainment"],
      };

      const mockChatHistory = [{ prompt: "Hello", response: "Hi there!" }];

      jest
        .spyOn(AIService, "getPersonalizedContext")
        .mockResolvedValue(mockContext);
      jest
        .spyOn(AIService, "getChatHistory")
        .mockResolvedValue(mockChatHistory);

      const prompt = await AIService.buildPersonalizedPrompt(
        "user-123",
        "I feel bored",
        "patient"
      );

      expect(prompt).toContain("User Type: patient");
      expect(prompt).toContain('Interests: ["cricket","movies"]');
      expect(prompt).toContain(
        'Related Interests: ["cricket","movies","sports","entertainment"]'
      );
      expect(prompt).toContain("User: I feel bored");
      expect(prompt).toContain("CareBot:");
      expect(prompt).toContain("cricket, movies");
    });

    test("should handle context without enriched interests", async () => {
      const mockContext = {
        baseInterests: ["cricket"],
        enrichedInterests: ["cricket"], // Same as base
      };

      jest
        .spyOn(AIService, "getPersonalizedContext")
        .mockResolvedValue(mockContext);
      jest.spyOn(AIService, "getChatHistory").mockResolvedValue([]);

      const prompt = await AIService.buildPersonalizedPrompt(
        "user-123",
        "Hello",
        "patient"
      );

      expect(prompt).toContain('Interests: ["cricket"]');
      expect(prompt).not.toContain("Related Interests:");
    });

    test("should fallback to basic prompt on error", async () => {
      jest
        .spyOn(AIService, "getPersonalizedContext")
        .mockRejectedValue(new Error("Context error"));

      const prompt = await AIService.buildPersonalizedPrompt(
        "user-123",
        "Hello",
        "patient"
      );

      expect(prompt).toBe(
        "You are CareBot, a compassionate AI assistant for Thalassemia care and blood donation support.\n\nUser: Hello\nCareBot:"
      );
    });
  });

  describe("getPersonalizedContext", () => {
    test("should get personalized context", async () => {
      const mockChatHistory = [{ prompt: "Hello", response: "Hi!" }];

      const mockContext = {
        userId: "user-123",
        userType: "patient",
        baseInterests: ["cricket"],
        enrichedInterests: ["cricket", "sports"],
      };

      jest
        .spyOn(AIService, "getChatHistory")
        .mockResolvedValue(mockChatHistory);
      PersonalizationService.buildPersonalizedContext.mockResolvedValue(
        mockContext
      );

      const context = await AIService.getPersonalizedContext(
        "user-123",
        "patient"
      );

      expect(context).toEqual(mockContext);
      expect(
        PersonalizationService.buildPersonalizedContext
      ).toHaveBeenCalledWith("user-123", "patient", mockChatHistory);
    });

    test("should handle errors gracefully", async () => {
      jest.spyOn(AIService, "getChatHistory").mockResolvedValue([]);
      PersonalizationService.buildPersonalizedContext.mockRejectedValue(
        new Error("Context error")
      );

      const context = await AIService.getPersonalizedContext(
        "user-123",
        "patient"
      );

      expect(context).toEqual({
        userId: "user-123",
        userType: "patient",
        baseInterests: [],
        enrichedInterests: [],
        conversationHistory: [],
        contextMetadata: { error: "Context error" },
      });
    });
  });

  describe("generateInterestBasedSuggestions", () => {
    test("should generate suggestions based on interests", async () => {
      const interests = ["cricket", "movies"];
      const response = await AIService.generateInterestBasedSuggestions(
        interests,
        "bored"
      );

      expect(response).toContain("cricket");
      expect(response).toContain("movies");
      expect(response).toContain("bored");
    });

    test("should handle sad mood", async () => {
      const interests = ["music"];
      const response = await AIService.generateInterestBasedSuggestions(
        interests,
        "sad"
      );

      expect(response).toContain("I'm sorry to hear you're feeling down");
      expect(response).toContain("music");
    });

    test("should handle empty interests", async () => {
      const response = await AIService.generateInterestBasedSuggestions([]);

      expect(response).toBe(
        "I'd be happy to help you find something enjoyable to do. What are some of your interests or hobbies?"
      );
    });

    test("should handle unknown interests", async () => {
      const interests = ["unknown", "interest"];
      const response = await AIService.generateInterestBasedSuggestions(
        interests
      );

      expect(response).toContain("unknown, interest");
      expect(response).toContain("activities you could explore");
    });
  });

  describe("getPersonalizedFallback", () => {
    test("should provide personalized thalassemia response", () => {
      const interests = ["cricket", "movies"];
      const response = AIService.getPersonalizedFallback(
        "Tell me about thalassemia",
        interests
      );

      expect(response).toContain("Thalassemia is a genetic blood disorder");
      expect(response).toContain("cricket and movies");
      expect(response).toContain("positive outlook");
    });

    test("should handle sad mood with interests", () => {
      const interests = ["music"];
      const response = AIService.getPersonalizedFallback(
        "I feel sad",
        interests
      );

      expect(response).toContain("I'm sorry to hear you're feeling down");
      expect(response).toContain("music");
    });

    test("should handle bored mood without interests", () => {
      const response = AIService.getPersonalizedFallback("I am bored", []);

      expect(response).toContain("I understand you're feeling bored");
      expect(response).toContain("What are some activities");
    });

    test("should provide personalized health response", () => {
      const interests = ["fitness", "sports"];
      const response = AIService.getPersonalizedFallback(
        "health tips",
        interests
      );

      expect(response).toContain("Maintaining good health");
      expect(response).toContain("fitness/sports");
    });

    test("should provide personalized default response", () => {
      const interests = ["cricket", "movies"];
      const response = AIService.getPersonalizedFallback(
        "random question",
        interests
      );

      expect(response).toContain("cricket and movies");
      expect(response).toContain("How can I assist you today?");
    });

    test("should provide generic response without interests", () => {
      const response = AIService.getPersonalizedFallback("random question", []);

      expect(response).toBe(
        "I'm here to help you with information about Thalassemia care, blood donation, and general health topics. How can I assist you today?"
      );
    });
  });

  describe("Chat History Management", () => {
    test("should save chat history", async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      await AIService.saveChatHistory("user-123", "Hello", "Hi there!");

      expect(supabase.from).toHaveBeenCalledWith("chathistory");
      expect(supabase.from().insert).toHaveBeenCalledWith({
        user_id: "user-123",
        prompt: "Hello",
        response: "Hi there!",
      });
    });

    test("should get chat history", async () => {
      const mockHistory = [
        { prompt: "Hello", response: "Hi!", timestamp: "2023-01-01" },
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockHistory,
                error: null,
              }),
            }),
          }),
        }),
      });

      const history = await AIService.getChatHistory("user-123", 10);

      expect(history).toEqual(mockHistory);
      expect(supabase.from).toHaveBeenCalledWith("chathistory");
    });

    test("should clear chat history", async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await AIService.clearChatHistory("user-123");

      expect(result).toEqual({ message: "Chat history cleared successfully" });
      expect(supabase.from).toHaveBeenCalledWith("chathistory");
    });
  });
});
