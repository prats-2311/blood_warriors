const { supabase } = require("../utils/supabase");
const QlooService = require("./QlooService");
const PersonalizationService = require("./PersonalizationService");

/**
 * RewardService - Manages the donor perks program
 * Handles coupon matching and reward assignment based on donor interests
 */
class RewardService {
  constructor() {
    this.maxCouponsPerDonor = 5;
    this.rewardCooldownHours = 24; // Prevent spam rewards
  }

  /**
   * Process donation reward for a donor
   * @param {string} donationId - Donation UUID
   * @param {string} donorId - Donor UUID
   * @returns {Promise<Object>} Reward processing result
   */
  async processDonationReward(donationId, donorId) {
    try {
      console.log(
        `Processing reward for donation ${donationId}, donor ${donorId}`
      );

      // Check if donor is eligible for rewards (cooldown period)
      const isEligible = await this.checkRewardEligibility(donorId);
      if (!isEligible) {
        return {
          success: false,
          reason: "Donor not eligible due to cooldown period",
          donorId,
          donationId,
        };
      }

      // Get donor interests
      const donorInterests = await PersonalizationService.getUserInterests(
        donorId,
        "donor"
      );

      if (!donorInterests || donorInterests.length === 0) {
        console.log(`No interests found for donor ${donorId}, skipping reward`);
        return {
          success: false,
          reason: "No donor interests available",
          donorId,
          donationId,
        };
      }

      // Enrich interests with Qloo if available
      let enrichedInterests = donorInterests;
      try {
        const qlooEnriched = await QlooService.getEnrichedInterests(
          donorInterests
        );
        if (qlooEnriched && qlooEnriched.length > 0) {
          enrichedInterests = qlooEnriched;
        }
      } catch (qlooError) {
        console.warn(
          "Qloo enrichment failed, using base interests:",
          qlooError.message
        );
      }

      // Find matching coupons
      const matchingCoupons = await this.matchCouponsToInterests(
        enrichedInterests
      );

      if (matchingCoupons.length === 0) {
        return {
          success: false,
          reason: "No matching coupons found",
          donorId,
          donationId,
          interests: donorInterests,
        };
      }

      // Select best coupon (highest match score)
      const selectedCoupon = matchingCoupons[0];

      // Assign coupon to donor
      const assignmentResult = await this.assignCouponToUser(
        donorId,
        selectedCoupon.coupon_id,
        donationId
      );

      if (assignmentResult.success) {
        // Send notification
        await this.notifyDonorOfReward(donorId, selectedCoupon);

        return {
          success: true,
          donorId,
          donationId,
          coupon: selectedCoupon,
          assignmentId: assignmentResult.assignmentId,
          interests: donorInterests,
          enrichedInterests,
          matchScore: selectedCoupon.match_score,
        };
      } else {
        return {
          success: false,
          reason: "Failed to assign coupon",
          donorId,
          donationId,
          error: assignmentResult.error,
        };
      }
    } catch (error) {
      console.error("Error processing donation reward:", error);
      return {
        success: false,
        reason: "Processing error",
        donorId,
        donationId,
        error: error.message,
      };
    }
  }

  /**
   * Match coupons to donor interests
   * @param {string[]} interests - Donor interests (enriched)
   * @returns {Promise<Object[]>} Matching coupons with scores
   */
  async matchCouponsToInterests(interests) {
    try {
      if (!interests || interests.length === 0) {
        return [];
      }

      // Use database function for efficient matching
      const { data, error } = await supabase.rpc(
        "find_matching_coupons_by_interests",
        {
          user_interests: interests,
          max_results: this.maxCouponsPerDonor,
        }
      );

      if (error) {
        console.error(
          "Database function error, falling back to manual matching:",
          error
        );
        return await this.fallbackCouponMatching(interests);
      }

      return data || [];
    } catch (error) {
      console.error("Error matching coupons to interests:", error);
      return await this.fallbackCouponMatching(interests);
    }
  }

  /**
   * Fallback coupon matching when database function fails
   * @param {string[]} interests - Donor interests
   * @returns {Promise<Object[]>} Matching coupons
   */
  async fallbackCouponMatching(interests) {
    try {
      const { data: coupons, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .gt("expiry_date", new Date().toISOString().split("T")[0]);

      if (error) throw error;

      const matchedCoupons = [];

      coupons.forEach((coupon) => {
        const matchScore = this.calculateMatchScore(
          coupon.target_keywords,
          interests
        );
        if (matchScore > 0) {
          matchedCoupons.push({
            ...coupon,
            match_score: matchScore,
          });
        }
      });

      // Sort by match score descending
      return matchedCoupons
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, this.maxCouponsPerDonor);
    } catch (error) {
      console.error("Fallback coupon matching failed:", error);
      return [];
    }
  }

  /**
   * Calculate match score between coupon keywords and user interests
   * @param {string[]|Object} couponKeywords - Coupon target keywords
   * @param {string[]} userInterests - User interests
   * @returns {number} Match score
   */
  calculateMatchScore(couponKeywords, userInterests) {
    if (!couponKeywords || !userInterests) return 0;

    // Handle JSONB format
    let keywords = couponKeywords;
    if (typeof couponKeywords === "string") {
      try {
        keywords = JSON.parse(couponKeywords);
      } catch (e) {
        keywords = [couponKeywords];
      }
    }

    if (!Array.isArray(keywords)) {
      keywords = Object.values(keywords);
    }

    // Calculate exact matches
    let exactMatches = 0;
    let partialMatches = 0;

    userInterests.forEach((interest) => {
      const lowerInterest = interest.toLowerCase();

      keywords.forEach((keyword) => {
        const lowerKeyword = keyword.toLowerCase();

        if (lowerInterest === lowerKeyword) {
          exactMatches += 2; // Exact matches get higher score
        } else if (
          lowerInterest.includes(lowerKeyword) ||
          lowerKeyword.includes(lowerInterest)
        ) {
          partialMatches += 1; // Partial matches get lower score
        }
      });
    });

    return exactMatches + partialMatches;
  }

  /**
   * Assign coupon to user
   * @param {string} donorId - Donor UUID
   * @param {string} couponId - Coupon ID
   * @param {string} donationId - Donation UUID (optional)
   * @returns {Promise<Object>} Assignment result
   */
  async assignCouponToUser(donorId, couponId, donationId = null) {
    try {
      // Generate unique redemption code
      const redemptionCode = this.generateRedemptionCode();

      // Create assignment record
      const { data, error } = await supabase
        .from("donorcoupons")
        .insert({
          donor_id: donorId,
          coupon_id: couponId,
          status: "Issued",
          unique_redemption_code: redemptionCode,
          issued_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error assigning coupon:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Update coupon quantity if applicable
      await this.updateCouponQuantity(couponId);

      return {
        success: true,
        assignmentId: data.id,
        redemptionCode: redemptionCode,
      };
    } catch (error) {
      console.error("Error in assignCouponToUser:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update coupon quantity after assignment
   * @param {string} couponId - Coupon ID
   */
  async updateCouponQuantity(couponId) {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({
          quantity_redeemed: supabase.raw("quantity_redeemed + 1"),
        })
        .eq("coupon_id", couponId);

      if (error) {
        console.error("Error updating coupon quantity:", error);
      }
    } catch (error) {
      console.error("Error in updateCouponQuantity:", error);
    }
  }

  /**
   * Generate unique redemption code
   * @returns {string} Redemption code
   */
  generateRedemptionCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BW-${result}`;
  }

  /**
   * Check if donor is eligible for rewards (cooldown check)
   * @param {string} donorId - Donor UUID
   * @returns {Promise<boolean>} Eligibility status
   */
  async checkRewardEligibility(donorId) {
    try {
      const cooldownTime = new Date();
      cooldownTime.setHours(cooldownTime.getHours() - this.rewardCooldownHours);

      const { data, error } = await supabase
        .from("donorcoupons")
        .select("issued_at")
        .eq("donor_id", donorId)
        .gte("issued_at", cooldownTime.toISOString())
        .limit(1);

      if (error) {
        console.error("Error checking reward eligibility:", error);
        return true; // Default to eligible on error
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error("Error in checkRewardEligibility:", error);
      return true; // Default to eligible on error
    }
  }

  /**
   * Notify donor of reward assignment
   * @param {string} donorId - Donor UUID
   * @param {Object} coupon - Coupon details
   */
  async notifyDonorOfReward(donorId, coupon) {
    try {
      // Get donor's FCM token for push notification
      const { data: donor, error } = await supabase
        .from("donors")
        .select(
          `
          *,
          users!inner(full_name, fcm_token)
        `
        )
        .eq("donor_id", donorId)
        .single();

      if (error || !donor) {
        console.error("Error getting donor for notification:", error);
        return;
      }

      const message = `🎉 Thank you for your donation! You've earned a reward: ${coupon.partner_name} - ${coupon.description}`;

      // Send push notification if FCM token exists
      if (donor.users.fcm_token) {
        // This would integrate with your existing notification service
        console.log(
          `Sending notification to ${donor.users.full_name}: ${message}`
        );
        // await NotificationService.sendPushNotification(donor.users.fcm_token, message);
      }

      // Create in-app notification record
      await supabase.from("notifications").insert({
        donor_id: donorId,
        message: message,
        status: "Sent",
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error notifying donor of reward:", error);
    }
  }

  /**
   * Get donor's reward history
   * @param {string} donorId - Donor UUID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Object[]>} Reward history
   */
  async getDonorRewardHistory(donorId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from("donorcoupons")
        .select(
          `
          *,
          coupons!inner(partner_name, description, discount_percentage)
        `
        )
        .eq("donor_id", donorId)
        .order("issued_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting donor reward history:", error);
      return [];
    }
  }

  /**
   * Get reward statistics for monitoring
   * @returns {Promise<Object>} Reward statistics
   */
  async getRewardStatistics() {
    try {
      // Get total rewards issued
      const { count: totalRewards, error: rewardsError } = await supabase
        .from("donorcoupons")
        .select("*", { count: "exact", head: true });

      if (rewardsError) throw rewardsError;

      // Get rewards issued in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentRewards, error: recentError } = await supabase
        .from("donorcoupons")
        .select("*", { count: "exact", head: true })
        .gte("issued_at", thirtyDaysAgo.toISOString());

      if (recentError) throw recentError;

      // Get redemption rate
      const { count: redeemedRewards, error: redeemedError } = await supabase
        .from("donorcoupons")
        .select("*", { count: "exact", head: true })
        .eq("status", "Redeemed");

      if (redeemedError) throw redeemedError;

      const redemptionRate =
        totalRewards > 0 ? (redeemedRewards / totalRewards) * 100 : 0;

      return {
        totalRewards: totalRewards || 0,
        recentRewards: recentRewards || 0,
        redeemedRewards: redeemedRewards || 0,
        redemptionRate: Math.round(redemptionRate * 100) / 100,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting reward statistics:", error);
      return {
        totalRewards: 0,
        recentRewards: 0,
        redeemedRewards: 0,
        redemptionRate: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Find matching coupons for preview (without assignment)
   * @param {string[]} interests - User interests
   * @param {number} limit - Maximum results
   * @returns {Promise<Object[]>} Matching coupons
   */
  async findMatchingCoupons(interests, limit = 5) {
    return await this.matchCouponsToInterests(interests);
  }

  /**
   * Redeem a coupon
   * @param {string} redemptionCode - Unique redemption code
   * @param {string} donorId - Donor UUID (for verification)
   * @returns {Promise<Object>} Redemption result
   */
  async redeemCoupon(redemptionCode, donorId) {
    try {
      // Find the coupon assignment
      const { data: assignment, error: findError } = await supabase
        .from("donorcoupons")
        .select(
          `
          *,
          coupons!inner(*)
        `
        )
        .eq("unique_redemption_code", redemptionCode)
        .eq("donor_id", donorId)
        .eq("status", "Issued")
        .single();

      if (findError || !assignment) {
        return {
          success: false,
          reason: "Invalid redemption code or coupon already redeemed",
        };
      }

      // Check if coupon is still valid
      const now = new Date();
      const expiryDate = new Date(assignment.coupons.expiry_date);

      if (now > expiryDate) {
        return {
          success: false,
          reason: "Coupon has expired",
        };
      }

      // Mark as redeemed
      const { error: updateError } = await supabase
        .from("donorcoupons")
        .update({
          status: "Redeemed",
          redeemed_at: new Date().toISOString(),
        })
        .eq("id", assignment.id);

      if (updateError) {
        console.error("Error updating coupon status:", updateError);
        return {
          success: false,
          reason: "Failed to redeem coupon",
        };
      }

      return {
        success: true,
        coupon: assignment.coupons,
        redeemedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      return {
        success: false,
        reason: "Redemption error",
        error: error.message,
      };
    }
  }
}

module.exports = new RewardService();
