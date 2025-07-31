const QlooService = require("../services/QlooService");
const axios = require("axios");

// Mock axios
jest.mock("axios");

describe("QlooService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.QLOO_API_KEY = "test-api-key";
    process.env.QLOO_API_URL = "https://api.qloo.com/v1";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.QLOO_API_KEY;
    delete process.env.QLOO_API_URL;
  });

  describe("Configuration", () => {
    test("should be enabled when API key is provided", () => {
      expect(QlooService.isApiAvailable()).toBe(true);
    });

    test("should be disabled when API key is not provided", () => {
      delete process.env.QLOO_API_KEY;
      // Create new instance to test without API key
      const QlooServiceClass = require("../services/QlooService").constructor;
      const serviceWithoutKey = new QlooServiceClass();
      expect(serviceWithoutKey.isEnabled).toBe(false);
    });

    test("should return correct status information", () => {
      const status = QlooService.getStatus();

      expect(status).toEqual({
        enabled: true,
        apiUrl: "https://api.qloo.com/v1",
        hasApiKey: true,
        timeout: 5000,
        maxRetries: 3,
        rateLimitDelay: 100,
      });
    });
  });

  describe("getTasteProfile", () => {
    test("should get taste profile from Qloo API", async () => {
      const mockResponse = {
        data: {
          keywords: ["sports", "entertainment", "bollywood"],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getTasteProfile(["cricket", "movies"]);

      expect(result).toEqual(["sports", "entertainment", "bollywood"]);
      expect(mockPost).toHaveBeenCalledWith("/taste", {
        preferences: ["cricket", "movies"],
      });
    });

    test("should return fallback keywords on API error", async () => {
      const mockPost = jest.fn().mockRejectedValue(new Error("API Error"));
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getTasteProfile(["cricket", "movies"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Should contain related keywords for cricket and movies
      expect(
        result.some((keyword) =>
          ["sports", "games", "entertainment", "cinema"].includes(keyword)
        )
      ).toBe(true);
    });

    test("should return empty array for invalid input", async () => {
      const result1 = await QlooService.getTasteProfile([]);
      const result2 = await QlooService.getTasteProfile("not array");
      const result3 = await QlooService.getTasteProfile(null);

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
    });

    test("should use mock data when API is disabled", async () => {
      // Create service without API key
      delete process.env.QLOO_API_KEY;
      const QlooServiceClass = require("../services/QlooService").constructor;
      const serviceWithoutKey = new QlooServiceClass();

      const result = await serviceWithoutKey.getTasteProfile(["cricket"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getRecommendations", () => {
    test("should get recommendations from Qloo API", async () => {
      const mockResponse = {
        data: {
          recommendations: [
            { name: "IPL Cricket", category: "sports" },
            { name: "Bollywood Movies", category: "entertainment" },
          ],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getRecommendations([
        "cricket",
        "movies",
      ]);

      expect(result).toEqual(mockResponse.data.recommendations);
      expect(mockPost).toHaveBeenCalledWith("/recommendations", {
        taste_keywords: ["cricket", "movies"],
        category: "all",
        limit: 10,
      });
    });

    test("should return mock recommendations on API error", async () => {
      const mockPost = jest.fn().mockRejectedValue(new Error("API Error"));
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getRecommendations(["cricket"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("category");
    });

    test("should filter recommendations by category", async () => {
      const mockPost = jest.fn().mockRejectedValue(new Error("Use fallback"));
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getRecommendations(
        ["cricket"],
        "sports"
      );

      expect(Array.isArray(result)).toBe(true);
      // All results should be sports category
      result.forEach((rec) => {
        expect(rec.category).toBe("sports");
      });
    });

    test("should return empty array for invalid input", async () => {
      const result1 = await QlooService.getRecommendations([]);
      const result2 = await QlooService.getRecommendations("not array");

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });
  });

  describe("getEnrichedInterests", () => {
    test("should enrich interests with Qloo data", async () => {
      const mockResponse = {
        data: {
          keywords: ["sports", "entertainment", "bollywood"],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getEnrichedInterests([
        "cricket",
        "movies",
      ]);

      expect(result).toEqual([
        "cricket",
        "movies",
        "sports",
        "entertainment",
        "bollywood",
      ]);
    });

    test("should return original interests on error", async () => {
      const mockPost = jest.fn().mockRejectedValue(new Error("API Error"));
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getEnrichedInterests([
        "cricket",
        "movies",
      ]);

      expect(result).toEqual(["cricket", "movies"]);
    });

    test("should return empty array for invalid input", async () => {
      const result1 = await QlooService.getEnrichedInterests([]);
      const result2 = await QlooService.getEnrichedInterests(null);

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    test("should remove duplicates from enriched interests", async () => {
      const mockResponse = {
        data: {
          keywords: ["cricket", "sports", "movies"], // Contains duplicates
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.getEnrichedInterests([
        "cricket",
        "movies",
      ]);

      // Should not have duplicates
      expect(result).toEqual(["cricket", "movies", "sports"]);
    });
  });

  describe("makeApiCall", () => {
    test("should make successful API call", async () => {
      const mockResponse = { data: { success: true } };
      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.makeApiCall("/test", { data: "test" });

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith("/test", { data: "test" });
    });

    test("should retry on server errors", async () => {
      const mockPost = jest
        .fn()
        .mockRejectedValueOnce(new Error("Server Error"))
        .mockRejectedValueOnce(new Error("Server Error"))
        .mockResolvedValueOnce({ data: { success: true } });

      axios.create.mockReturnValue({ post: mockPost });

      const result = await QlooService.makeApiCall("/test", { data: "test" });

      expect(result.data.success).toBe(true);
      expect(mockPost).toHaveBeenCalledTimes(3);
    });

    test("should not retry on client errors", async () => {
      const clientError = new Error("Client Error");
      clientError.response = { status: 400 };

      const mockPost = jest.fn().mockRejectedValue(clientError);
      axios.create.mockReturnValue({ post: mockPost });

      await expect(
        QlooService.makeApiCall("/test", { data: "test" })
      ).rejects.toThrow("Client Error");

      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    test("should throw after max retries", async () => {
      const mockPost = jest.fn().mockRejectedValue(new Error("Server Error"));
      axios.create.mockReturnValue({ post: mockPost });

      await expect(
        QlooService.makeApiCall("/test", { data: "test" })
      ).rejects.toThrow("Server Error");

      expect(mockPost).toHaveBeenCalledTimes(3); // maxRetries
    });
  });

  describe("getFallbackKeywords", () => {
    test("should return related keywords for known preferences", () => {
      const result = QlooService.getFallbackKeywords(["cricket", "movies"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some((keyword) =>
          ["sports", "games", "entertainment", "cinema"].includes(keyword)
        )
      ).toBe(true);
    });

    test("should return mock keywords for unknown preferences", () => {
      const result = QlooService.getFallbackKeywords(["unknown", "preference"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test("should handle non-array input", () => {
      const result = QlooService.getFallbackKeywords("not array");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test("should remove duplicates and limit results", () => {
      const result = QlooService.getFallbackKeywords([
        "cricket",
        "cricket",
        "movies",
      ]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(8);
      // Should not have duplicates
      expect(new Set(result).size).toBe(result.length);
    });
  });

  describe("getMockRecommendations", () => {
    test("should return mock recommendations for known keywords", () => {
      const result = QlooService.getMockRecommendations(["cricket", "movies"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("category");
      expect(result[0]).toHaveProperty("type");
    });

    test("should filter by category", () => {
      const result = QlooService.getMockRecommendations(["cricket"], "sports");

      expect(Array.isArray(result)).toBe(true);
      result.forEach((rec) => {
        expect(rec.category).toBe("sports");
      });
    });

    test("should limit results to 10", () => {
      const manyKeywords = ["cricket", "movies", "food", "music"];
      const result = QlooService.getMockRecommendations(manyKeywords);

      expect(result.length).toBeLessThanOrEqual(10);
    });

    test("should handle non-array input", () => {
      const result = QlooService.getMockRecommendations("not array");

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("delay", () => {
    test("should delay execution", async () => {
      const startTime = Date.now();
      await QlooService.delay(100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });
});
