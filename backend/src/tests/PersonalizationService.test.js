const PersonalizationService = require("../services/PersonalizationService");
const { supabase } = require("../utils/supabase");
const QlooService = require("../services/QlooService");

// Mock dependencies
jest.mock("../utils/supabase");
jest.mock("../services/QlooService");

describe("PersonalizationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateInterests", () => {
    test("should validate correct interests array", () => {
      const interests = ["cricket", "movies", "music"];
      expect(PersonalizationService.validateInterests(interests)).toBe(true);
    });

    test("should reject non-array input", () => {
      expect(PersonalizationService.validateInterests("not an array")).toBe(
        false
      );
      expect(PersonalizationService.validateInterests(null)).toBe(false);
      expect(PersonalizationService.validateInterests(undefined)).toBe(false);
    });

    test("should reject array with too many interests", () => {
      const tooManyInterests = Array(25).fill("interest");
      expect(PersonalizationService.validateInterests(tooManyInterests)).toBe(
        false
      );
    });

    test("should reject interests that are too short or too long", () => {
      const invalidInterests = ["a", "valid", "x".repeat(51)];
      expect(PersonalizationService.validateInterests(invalidInterests)).toBe(
        false
      );
    });

    test("should reject non-string interests", () => {
      const invalidInterests = ["valid", 123, "another"];
      expect(PersonalizationService.validateInterests(invalidInterests)).toBe(
        false
      );
    });
  });

  describe("sanitizeInterests", () => {
    test("should sanitize and normalize interests", () => {
      const input = ["  CRICKET  ", "Movies", "MUSIC", "", "a", "valid"];
      const expected = ["cricket", "movies", "music", "valid"];
      expect(PersonalizationService.sanitizeInterests(input)).toEqual(expected);
    });

    test("should handle non-array input", () => {
      expect(PersonalizationService.sanitizeInterests("not array")).toEqual([]);
      expect(PersonalizationService.sanitizeInterests(null)).toEqual([]);
    });

    test("should filter out non-string elements", () => {
      const input = ["valid", 123, null, "another", undefined];
      const expected = ["valid", "another"];
      expect(PersonalizationService.sanitizeInterests(input)).toEqual(expected);
    });

    test("should limit to maximum interests", () => {
      const tooMany = Array(25).fill("interest");
      const result = PersonalizationService.sanitizeInterests(tooMany);
      expect(result.length).toBe(20); // maxInterests
    });
  });

  describe("updatePatientInterests", () => {
    test("should successfully update patient interests", async () => {
      const mockPatientData = {
        patient_id: "patient-123",
        taste_keywords: '["cricket", "movies"]',
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPatientData,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await PersonalizationService.updatePatientInterests(
        "patient-123",
        ["cricket", "movies"]
      );

      expect(result.success).toBe(true);
      expect(result.interests).toEqual(["cricket", "movies"]);
      expect(supabase.from).toHaveBeenCalledWith("patients");
    });

    test("should handle database errors", async () => {
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      });

      await expect(
        PersonalizationService.updatePatientInterests("patient-123", [
          "cricket",
        ])
      ).rejects.toThrow();
    });

    test("should reject invalid interests", async () => {
      await expect(
        PersonalizationService.updatePatientInterests("patient-123", "invalid")
      ).rejects.toThrow("Invalid interests provided");
    });
  });

  describe("updateDonorInterests", () => {
    test("should successfully update donor interests", async () => {
      const mockDonorData = {
        donor_id: "donor-123",
        qloo_taste_keywords: '["food", "travel"]',
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockDonorData,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await PersonalizationService.updateDonorInterests(
        "donor-123",
        ["food", "travel"]
      );

      expect(result.success).toBe(true);
      expect(result.interests).toEqual(["food", "travel"]);
      expect(supabase.from).toHaveBeenCalledWith("donors");
    });
  });

  describe("getUserInterests", () => {
    test("should get patient interests", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { taste_keywords: ["cricket", "movies"] },
              error: null,
            }),
          }),
        }),
      });

      const interests = await PersonalizationService.getUserInterests(
        "patient-123",
        "patient"
      );

      expect(interests).toEqual(["cricket", "movies"]);
      expect(supabase.from).toHaveBeenCalledWith("patients");
    });

    test("should get donor interests", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { qloo_taste_keywords: ["food", "travel"] },
              error: null,
            }),
          }),
        }),
      });

      const interests = await PersonalizationService.getUserInterests(
        "donor-123",
        "donor"
      );

      expect(interests).toEqual(["food", "travel"]);
      expect(supabase.from).toHaveBeenCalledWith("donors");
    });

    test("should handle JSON string interests", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { taste_keywords: '["cricket", "movies"]' },
              error: null,
            }),
          }),
        }),
      });

      const interests = await PersonalizationService.getUserInterests(
        "patient-123",
        "patient"
      );

      expect(interests).toEqual(["cricket", "movies"]);
    });

    test("should return empty array for user not found", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      const interests = await PersonalizationService.getUserInterests(
        "nonexistent",
        "patient"
      );

      expect(interests).toEqual([]);
    });

    test("should reject invalid user type", async () => {
      await expect(
        PersonalizationService.getUserInterests("user-123", "invalid")
      ).rejects.toThrow("Invalid user type");
    });
  });

  describe("getEnrichedInterests", () => {
    test("should enrich interests with Qloo data", async () => {
      // Mock getUserInterests
      jest
        .spyOn(PersonalizationService, "getUserInterests")
        .mockResolvedValue(["cricket", "movies"]);

      // Mock QlooService
      QlooService.getTasteProfile.mockResolvedValue([
        "sports",
        "entertainment",
        "bollywood",
      ]);

      const result = await PersonalizationService.getEnrichedInterests(
        "user-123",
        "patient"
      );

      expect(result.baseInterests).toEqual(["cricket", "movies"]);
      expect(result.enrichedInterests).toEqual([
        "cricket",
        "movies",
        "sports",
        "entertainment",
        "bollywood",
      ]);
      expect(result.qlooEnrichmentUsed).toBe(true);
    });

    test("should handle Qloo API failure gracefully", async () => {
      jest
        .spyOn(PersonalizationService, "getUserInterests")
        .mockResolvedValue(["cricket", "movies"]);

      QlooService.getTasteProfile.mockRejectedValue(
        new Error("Qloo API error")
      );

      const result = await PersonalizationService.getEnrichedInterests(
        "user-123",
        "patient"
      );

      expect(result.baseInterests).toEqual(["cricket", "movies"]);
      expect(result.enrichedInterests).toEqual(["cricket", "movies"]);
      expect(result.qlooEnrichmentUsed).toBe(false);
    });

    test("should handle empty interests", async () => {
      jest
        .spyOn(PersonalizationService, "getUserInterests")
        .mockResolvedValue([]);

      const result = await PersonalizationService.getEnrichedInterests(
        "user-123",
        "patient"
      );

      expect(result.baseInterests).toEqual([]);
      expect(result.enrichedInterests).toEqual([]);
      expect(result.qlooEnrichmentUsed).toBe(false);
    });
  });

  describe("buildPersonalizedContext", () => {
    test("should build complete personalized context", async () => {
      jest
        .spyOn(PersonalizationService, "getEnrichedInterests")
        .mockResolvedValue({
          baseInterests: ["cricket", "movies"],
          enrichedInterests: ["cricket", "movies", "sports", "entertainment"],
          qlooEnrichmentUsed: true,
        });

      const conversationHistory = [{ prompt: "Hello", response: "Hi there!" }];

      const context = await PersonalizationService.buildPersonalizedContext(
        "user-123",
        "patient",
        conversationHistory
      );

      expect(context.userId).toBe("user-123");
      expect(context.userType).toBe("patient");
      expect(context.baseInterests).toEqual(["cricket", "movies"]);
      expect(context.enrichedInterests).toEqual([
        "cricket",
        "movies",
        "sports",
        "entertainment",
      ]);
      expect(context.conversationHistory).toEqual(conversationHistory);
      expect(context.contextMetadata.qlooEnrichmentUsed).toBe(true);
      expect(context.contextMetadata.interestsCount).toBe(2);
      expect(context.contextMetadata.enrichedCount).toBe(4);
    });

    test("should handle errors gracefully", async () => {
      jest
        .spyOn(PersonalizationService, "getEnrichedInterests")
        .mockRejectedValue(new Error("Database error"));

      const context = await PersonalizationService.buildPersonalizedContext(
        "user-123",
        "patient"
      );

      expect(context.userId).toBe("user-123");
      expect(context.userType).toBe("patient");
      expect(context.baseInterests).toEqual([]);
      expect(context.enrichedInterests).toEqual([]);
      expect(context.contextMetadata.error).toBe("Database error");
    });
  });

  describe("enrichContextWithQloo", () => {
    test("should enrich context with Qloo data", async () => {
      const baseInterests = ["cricket", "movies"];

      QlooService.getTasteProfile.mockResolvedValue([
        "sports",
        "entertainment",
      ]);
      QlooService.getRecommendations.mockResolvedValue([
        { name: "IPL Cricket", category: "sports" },
        { name: "Bollywood Movies", category: "entertainment" },
      ]);

      const result = await PersonalizationService.enrichContextWithQloo(
        baseInterests
      );

      expect(result.enrichedInterests).toEqual(["sports", "entertainment"]);
      expect(result.recommendations).toHaveLength(2);
      expect(result.qlooUsed).toBe(true);
    });

    test("should handle empty interests", async () => {
      const result = await PersonalizationService.enrichContextWithQloo([]);

      expect(result.enrichedInterests).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.qlooUsed).toBe(false);
    });

    test("should handle Qloo API failure", async () => {
      const baseInterests = ["cricket", "movies"];

      QlooService.getTasteProfile.mockRejectedValue(new Error("API error"));

      const result = await PersonalizationService.enrichContextWithQloo(
        baseInterests
      );

      expect(result.enrichedInterests).toEqual(baseInterests);
      expect(result.recommendations).toEqual([]);
      expect(result.qlooUsed).toBe(false);
      expect(result.error).toBe("API error");
    });
  });

  describe("hasInterests", () => {
    test("should return true when user has interests", async () => {
      jest
        .spyOn(PersonalizationService, "getUserInterests")
        .mockResolvedValue(["cricket", "movies"]);

      const result = await PersonalizationService.hasInterests(
        "user-123",
        "patient"
      );
      expect(result).toBe(true);
    });

    test("should return false when user has no interests", async () => {
      jest
        .spyOn(PersonalizationService, "getUserInterests")
        .mockResolvedValue([]);

      const result = await PersonalizationService.hasInterests(
        "user-123",
        "patient"
      );
      expect(result).toBe(false);
    });

    test("should return false on error", async () => {
      jest
        .spyOn(PersonalizationService, "getUserInterests")
        .mockRejectedValue(new Error("Database error"));

      const result = await PersonalizationService.hasInterests(
        "user-123",
        "patient"
      );
      expect(result).toBe(false);
    });
  });
});
