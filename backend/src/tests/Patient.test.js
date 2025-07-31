const Patient = require("../models/Patient");
const { supabase } = require("../utils/supabase");

// Mock supabase
jest.mock("../utils/supabase");

describe("Patient Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Interest Management", () => {
    describe("updateInterests", () => {
      test("should successfully update patient interests", async () => {
        const mockPatientData = {
          patient_id: "patient-123",
          taste_keywords: '["cricket", "movies"]',
          users: { full_name: "John Doe" },
          bloodgroups: { group_name: "A+" },
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

        const result = await Patient.updateInterests("patient-123", [
          "cricket",
          "movies",
        ]);

        expect(result).toEqual(mockPatientData);
        expect(supabase.from).toHaveBeenCalledWith("patients");
      });

      test("should sanitize interests before updating", async () => {
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

        await Patient.updateInterests("patient-123", [
          "  CRICKET  ",
          "Movies",
          "",
          123,
        ]);

        // Check that update was called with sanitized interests
        const updateCall = supabase.from().update;
        expect(updateCall).toHaveBeenCalledWith({
          taste_keywords: '["cricket","movies"]',
        });
      });

      test("should reject non-array interests", async () => {
        await expect(
          Patient.updateInterests("patient-123", "not an array")
        ).rejects.toThrow("Interests must be an array");
      });

      test("should limit interests to 20 items", async () => {
        const manyInterests = Array(25).fill("interest");

        supabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { patient_id: "patient-123" },
                  error: null,
                }),
              }),
            }),
          }),
        });

        await Patient.updateInterests("patient-123", manyInterests);

        const updateCall = supabase.from().update;
        const updatedInterests = JSON.parse(
          updateCall.mock.calls[0][0].taste_keywords
        );
        expect(updatedInterests.length).toBe(20);
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
          Patient.updateInterests("patient-123", ["cricket"])
        ).rejects.toThrow();
      });
    });

    describe("getInterests", () => {
      test("should get patient interests as array", async () => {
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

        const interests = await Patient.getInterests("patient-123");

        expect(interests).toEqual(["cricket", "movies"]);
        expect(supabase.from).toHaveBeenCalledWith("patients");
      });

      test("should parse JSON string interests", async () => {
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

        const interests = await Patient.getInterests("patient-123");

        expect(interests).toEqual(["cricket", "movies"]);
      });

      test("should return empty array for null interests", async () => {
        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { taste_keywords: null },
                error: null,
              }),
            }),
          }),
        });

        const interests = await Patient.getInterests("patient-123");

        expect(interests).toEqual([]);
      });

      test("should return empty array for patient not found", async () => {
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

        const interests = await Patient.getInterests("nonexistent");

        expect(interests).toEqual([]);
      });

      test("should handle invalid JSON gracefully", async () => {
        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { taste_keywords: "invalid json" },
                error: null,
              }),
            }),
          }),
        });

        const interests = await Patient.getInterests("patient-123");

        expect(interests).toEqual([]);
      });

      test("should throw on database errors", async () => {
        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        });

        await expect(Patient.getInterests("patient-123")).rejects.toThrow();
      });
    });

    describe("findByInterests", () => {
      test("should find patients with matching interests", async () => {
        const mockPatients = [
          {
            patient_id: "patient-1",
            taste_keywords: ["cricket", "movies"],
            users: { full_name: "John Doe" },
            bloodgroups: { group_name: "A+" },
          },
          {
            patient_id: "patient-2",
            taste_keywords: ["cricket", "music"],
            users: { full_name: "Jane Smith" },
            bloodgroups: { group_name: "B+" },
          },
        ];

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            overlaps: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockPatients,
                error: null,
              }),
            }),
          }),
        });

        const result = await Patient.findByInterests(["cricket"], 10);

        expect(result).toEqual(mockPatients);
        expect(supabase.from).toHaveBeenCalledWith("patients");
      });

      test("should return empty array for empty interests", async () => {
        const result = await Patient.findByInterests([]);
        expect(result).toEqual([]);
      });

      test("should return empty array for non-array interests", async () => {
        const result = await Patient.findByInterests("not array");
        expect(result).toEqual([]);
      });

      test("should handle database errors", async () => {
        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            overlaps: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        });

        await expect(Patient.findByInterests(["cricket"])).rejects.toThrow();
      });
    });

    describe("hasInterests", () => {
      test("should return true when patient has interests", async () => {
        jest
          .spyOn(Patient, "getInterests")
          .mockResolvedValue(["cricket", "movies"]);

        const result = await Patient.hasInterests("patient-123");
        expect(result).toBe(true);
      });

      test("should return false when patient has no interests", async () => {
        jest.spyOn(Patient, "getInterests").mockResolvedValue([]);

        const result = await Patient.hasInterests("patient-123");
        expect(result).toBe(false);
      });

      test("should return false on error", async () => {
        jest
          .spyOn(Patient, "getInterests")
          .mockRejectedValue(new Error("Database error"));

        const result = await Patient.hasInterests("patient-123");
        expect(result).toBe(false);
      });
    });

    describe("validateInterests", () => {
      test("should validate correct interests", () => {
        const interests = ["cricket", "movies", "music"];
        const result = Patient.validateInterests(interests);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test("should reject non-array input", () => {
        const result = Patient.validateInterests("not array");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Interests must be an array");
      });

      test("should reject too many interests", () => {
        const tooMany = Array(25).fill("interest");
        const result = Patient.validateInterests(tooMany);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Maximum 20 interests allowed");
      });

      test("should reject non-string interests", () => {
        const interests = ["valid", 123, "another"];
        const result = Patient.validateInterests(interests);

        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) => error.includes("must be a string"))
        ).toBe(true);
      });

      test("should reject too short interests", () => {
        const interests = ["valid", "a"];
        const result = Patient.validateInterests(interests);

        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) => error.includes("at least 2 characters"))
        ).toBe(true);
      });

      test("should reject too long interests", () => {
        const interests = ["valid", "x".repeat(51)];
        const result = Patient.validateInterests(interests);

        expect(result.isValid).toBe(false);
        expect(
          result.errors.some((error) =>
            error.includes("less than 50 characters")
          )
        ).toBe(true);
      });
    });

    describe("findSimilarPatients", () => {
      test("should find patients with similar interests", async () => {
        const mockSimilarPatients = [
          {
            patient_id: "patient-2",
            taste_keywords: ["cricket", "music"],
            users: { full_name: "Jane Smith" },
          },
        ];

        jest
          .spyOn(Patient, "getInterests")
          .mockResolvedValue(["cricket", "movies"]);

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            overlaps: jest.fn().mockReturnValue({
              neq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: mockSimilarPatients,
                  error: null,
                }),
              }),
            }),
          }),
        });

        const result = await Patient.findSimilarPatients("patient-1", 5);

        expect(result).toEqual(mockSimilarPatients);
      });

      test("should return empty array when patient has no interests", async () => {
        jest.spyOn(Patient, "getInterests").mockResolvedValue([]);

        const result = await Patient.findSimilarPatients("patient-1");
        expect(result).toEqual([]);
      });

      test("should handle errors gracefully", async () => {
        jest
          .spyOn(Patient, "getInterests")
          .mockRejectedValue(new Error("Database error"));

        const result = await Patient.findSimilarPatients("patient-1");
        expect(result).toEqual([]);
      });
    });
  });

  describe("Existing Methods", () => {
    test("should create patient", async () => {
      const patientData = {
        patient_id: "patient-123",
        blood_group_id: 1,
        date_of_birth: "1990-01-01",
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: patientData,
              error: null,
            }),
          }),
        }),
      });

      const result = await Patient.create(patientData);
      expect(result).toEqual(patientData);
    });

    test("should find patient by ID", async () => {
      const patientData = {
        patient_id: "patient-123",
        users: { full_name: "John Doe" },
        bloodgroups: { group_name: "A+" },
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: patientData,
              error: null,
            }),
          }),
        }),
      });

      const result = await Patient.findById("patient-123");
      expect(result).toEqual(patientData);
    });
  });
});
