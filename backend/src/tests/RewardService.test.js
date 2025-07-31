const RewardService = require("../services/RewardService");
const { supabase } = require("../utils/supabase");
const PersonalizationService = require("../services/PersonalizationService");
const QlooService = require("../services/QlooService");

// Mock dependencies
jest.mock("../utils/supabase");
jest.mock("../services/PersonalizationService");
jest.mock("../services/QlooService");

describe("RewardService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processDonationReward", () => {
    test("should successfully process donation reward", async () => {
      // Mock eligibility check
      jest
        .spyOn(RewardService, "checkRewardEligibility")
        .mockResolvedValue(true);

      // Mock user interests
      PersonalizationService.getUserInterests.mockResolvedValue([
        "food",
        "entertainment",
      ]);

      // Mock Qloo enrichment
      QlooService.getEnrichedInterests.mockResolvedValue([
        "food",
        "entertainment",
        "dining",
        "movies",
      ]);

      // Mock coupon matching
      jest.spyOn(RewardService, "matchCouponsToInterests").mockResolvedValue([
        {
          coupon_id: "coupon-123",
          partner_name: "Restaurant ABC",
          description: "20% off dinner",
          match_score: 3,
        },
      ]);

      // Mock coupon assignment
      jest.spyOn(RewardService, "assignCouponToUser").mockResolvedValue({
        success: true,
        assignmentId: "assignment-123",
        redemptionCode: "BW-ABC12345",
      });

      // Mock notification
      jest.spyOn(RewardService, "notifyDonorOfReward").mockResolvedValue();

      const result = await RewardService.processDonationReward(
        "donation-123",
        "donor-456"
      );

      expect(result.success).toBe(true);
      expect(result.coupon.partner_name).toBe("Restaurant ABC");
      expect(result.matchScore).toBe(3);
      expect(PersonalizationService.getUserInterests).toHaveBeenCalledWith(
        "donor-456",
        "donor"
      );
    });

    test("should handle donor not eligible due to cooldown", async () => {
      jest
        .spyOn(RewardService, "checkRewardEligibility")
        .mockResolvedValue(false);

      const result = await RewardService.processDonationReward(
        "donation-123",
        "donor-456"
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Donor not eligible due to cooldown period");
    });

    test("should handle donor with no interests", async () => {
      jest
        .spyOn(RewardService, "checkRewardEligibility")
        .mockResolvedValue(true);
      PersonalizationService.getUserInterests.mockResolvedValue([]);

      const result = await RewardService.processDonationReward(
        "donation-123",
        "donor-456"
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("No donor interests available");
    });

    test("should handle no matching coupons", async () => {
      jest
        .spyOn(RewardService, "checkRewardEligibility")
        .mockResolvedValue(true);
      PersonalizationService.getUserInterests.mockResolvedValue(["food"]);
      QlooService.getEnrichedInterests.mockResolvedValue(["food", "dining"]);
      jest
        .spyOn(RewardService, "matchCouponsToInterests")
        .mockResolvedValue([]);

      const result = await RewardService.processDonationReward(
        "donation-123",
        "donor-456"
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("No matching coupons found");
    });

    test("should handle Qloo enrichment failure gracefully", async () => {
      jest
        .spyOn(RewardService, "checkRewardEligibility")
        .mockResolvedValue(true);
      PersonalizationService.getUserInterests.mockResolvedValue(["food"]);
      QlooService.getEnrichedInterests.mockRejectedValue(
        new Error("Qloo API error")
      );

      jest
        .spyOn(RewardService, "matchCouponsToInterests")
        .mockResolvedValue([
          {
            coupon_id: "coupon-123",
            partner_name: "Restaurant",
            match_score: 1,
          },
        ]);
      jest.spyOn(RewardService, "assignCouponToUser").mockResolvedValue({
        success: true,
        assignmentId: "assignment-123",
      });
      jest.spyOn(RewardService, "notifyDonorOfReward").mockResolvedValue();

      const result = await RewardService.processDonationReward(
        "donation-123",
        "donor-456"
      );

      expect(result.success).toBe(true);
      expect(result.enrichedInterests).toEqual(["food"]); // Should use base interests
    });

    test("should handle assignment failure", async () => {
      jest
        .spyOn(RewardService, "checkRewardEligibility")
        .mockResolvedValue(true);
      PersonalizationService.getUserInterests.mockResolvedValue(["food"]);
      jest
        .spyOn(RewardService, "matchCouponsToInterests")
        .mockResolvedValue([
          {
            coupon_id: "coupon-123",
            partner_name: "Restaurant",
            match_score: 1,
          },
        ]);
      jest.spyOn(RewardService, "assignCouponToUser").mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await RewardService.processDonationReward(
        "donation-123",
        "donor-456"
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Failed to assign coupon");
    });
  });

  describe("matchCouponsToInterests", () => {
    test("should use database function for matching", async () => {
      const mockCoupons = [
        {
          coupon_id: "coupon-123",
          partner_name: "Restaurant ABC",
          description: "20% off",
          match_score: 2,
        },
      ];

      supabase.rpc.mockResolvedValue({
        data: mockCoupons,
        error: null,
      });

      const result = await RewardService.matchCouponsToInterests([
        "food",
        "dining",
      ]);

      expect(supabase.rpc).toHaveBeenCalledWith(
        "find_matching_coupons_by_interests",
        {
          user_interests: ["food", "dining"],
          max_results: 5,
        }
      );
      expect(result).toEqual(mockCoupons);
    });

    test("should fallback to manual matching on database function error", async () => {
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Function not found" },
      });

      jest
        .spyOn(RewardService, "fallbackCouponMatching")
        .mockResolvedValue([{ coupon_id: "coupon-123", match_score: 1 }]);

      const result = await RewardService.matchCouponsToInterests(["food"]);

      expect(RewardService.fallbackCouponMatching).toHaveBeenCalledWith([
        "food",
      ]);
      expect(result).toHaveLength(1);
    });

    test("should return empty array for no interests", async () => {
      const result = await RewardService.matchCouponsToInterests([]);
      expect(result).toEqual([]);
    });
  });

  describe("fallbackCouponMatching", () => {
    test("should manually match coupons to interests", async () => {
      const mockCoupons = [
        {
          coupon_id: "coupon-1",
          partner_name: "Restaurant",
          target_keywords: ["food", "dining"],
          is_active: true,
          expiry_date: "2025-12-31",
        },
        {
          coupon_id: "coupon-2",
          partner_name: "Cinema",
          target_keywords: ["movies", "entertainment"],
          is_active: true,
          expiry_date: "2025-12-31",
        },
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({
              data: mockCoupons,
              error: null,
            }),
          }),
        }),
      });

      const result = await RewardService.fallbackCouponMatching([
        "food",
        "movies",
      ]);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("match_score");
      expect(result[0].match_score).toBeGreaterThan(0);
    });

    test("should handle database error in fallback", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      const result = await RewardService.fallbackCouponMatching(["food"]);
      expect(result).toEqual([]);
    });
  });

  describe("calculateMatchScore", () => {
    test("should calculate exact matches correctly", () => {
      const couponKeywords = ["food", "dining"];
      const userInterests = ["food", "entertainment"];

      const score = RewardService.calculateMatchScore(
        couponKeywords,
        userInterests
      );
      expect(score).toBe(2); // One exact match
    });

    test("should calculate partial matches correctly", () => {
      const couponKeywords = ["restaurant"];
      const userInterests = ["food"];

      const score = RewardService.calculateMatchScore(
        couponKeywords,
        userInterests
      );
      expect(score).toBe(0); // No matches
    });

    test("should handle JSON string keywords", () => {
      const couponKeywords = '["food", "dining"]';
      const userInterests = ["food"];

      const score = RewardService.calculateMatchScore(
        couponKeywords,
        userInterests
      );
      expect(score).toBe(2); // One exact match
    });

    test("should handle null/undefined inputs", () => {
      expect(RewardService.calculateMatchScore(null, ["food"])).toBe(0);
      expect(RewardService.calculateMatchScore(["food"], null)).toBe(0);
      expect(RewardService.calculateMatchScore(null, null)).toBe(0);
    });
  });

  describe("assignCouponToUser", () => {
    test("should successfully assign coupon", async () => {
      const mockAssignment = {
        id: "assignment-123",
        donor_id: "donor-456",
        coupon_id: "coupon-789",
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAssignment,
              error: null,
            }),
          }),
        }),
      });

      jest.spyOn(RewardService, "updateCouponQuantity").mockResolvedValue();

      const result = await RewardService.assignCouponToUser(
        "donor-456",
        "coupon-789"
      );

      expect(result.success).toBe(true);
      expect(result.assignmentId).toBe("assignment-123");
      expect(result.redemptionCode).toMatch(/^BW-[A-Z0-9]{8}$/);
    });

    test("should handle assignment error", async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      const result = await RewardService.assignCouponToUser(
        "donor-456",
        "coupon-789"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("checkRewardEligibility", () => {
    test("should return true when donor is eligible", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await RewardService.checkRewardEligibility("donor-123");
      expect(result).toBe(true);
    });

    test("should return false when donor has recent reward", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ issued_at: new Date().toISOString() }],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await RewardService.checkRewardEligibility("donor-123");
      expect(result).toBe(false);
    });

    test("should default to eligible on database error", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      });

      const result = await RewardService.checkRewardEligibility("donor-123");
      expect(result).toBe(true);
    });
  });

  describe("generateRedemptionCode", () => {
    test("should generate valid redemption code", () => {
      const code = RewardService.generateRedemptionCode();
      expect(code).toMatch(/^BW-[A-Z0-9]{8}$/);
    });

    test("should generate unique codes", () => {
      const code1 = RewardService.generateRedemptionCode();
      const code2 = RewardService.generateRedemptionCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe("redeemCoupon", () => {
    test("should successfully redeem valid coupon", async () => {
      const mockAssignment = {
        id: "assignment-123",
        status: "Issued",
        coupons: {
          coupon_id: "coupon-123",
          partner_name: "Restaurant",
          expiry_date: "2025-12-31",
        },
      };

      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAssignment,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await RewardService.redeemCoupon(
        "BW-ABC12345",
        "donor-123"
      );

      expect(result.success).toBe(true);
      expect(result.coupon.partner_name).toBe("Restaurant");
    });

    test("should reject invalid redemption code", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Not found" },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await RewardService.redeemCoupon("INVALID", "donor-123");

      expect(result.success).toBe(false);
      expect(result.reason).toBe(
        "Invalid redemption code or coupon already redeemed"
      );
    });

    test("should reject expired coupon", async () => {
      const mockAssignment = {
        id: "assignment-123",
        status: "Issued",
        coupons: {
          coupon_id: "coupon-123",
          partner_name: "Restaurant",
          expiry_date: "2020-01-01", // Expired
        },
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAssignment,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await RewardService.redeemCoupon(
        "BW-ABC12345",
        "donor-123"
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Coupon has expired");
    });
  });

  describe("getDonorRewardHistory", () => {
    test("should get donor reward history", async () => {
      const mockHistory = [
        {
          id: "assignment-1",
          issued_at: "2025-01-01",
          coupons: {
            partner_name: "Restaurant",
            description: "20% off",
          },
        },
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

      const result = await RewardService.getDonorRewardHistory("donor-123");

      expect(result).toEqual(mockHistory);
      expect(supabase.from).toHaveBeenCalledWith("donorcoupons");
    });

    test("should handle database error", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      });

      const result = await RewardService.getDonorRewardHistory("donor-123");
      expect(result).toEqual([]);
    });
  });

  describe("getRewardStatistics", () => {
    test("should get reward statistics", async () => {
      // Mock total rewards count
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          count: 100,
          error: null,
        }),
      });

      // Mock recent rewards count
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({
            count: 20,
            error: null,
          }),
        }),
      });

      // Mock redeemed rewards count
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 30,
            error: null,
          }),
        }),
      });

      const result = await RewardService.getRewardStatistics();

      expect(result.totalRewards).toBe(100);
      expect(result.recentRewards).toBe(20);
      expect(result.redeemedRewards).toBe(30);
      expect(result.redemptionRate).toBe(30);
    });

    test("should handle database errors in statistics", async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          count: null,
          error: { message: "Database error" },
        }),
      });

      const result = await RewardService.getRewardStatistics();

      expect(result.totalRewards).toBe(0);
      expect(result.error).toBe("Database error");
    });
  });
});
