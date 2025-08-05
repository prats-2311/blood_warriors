const express = require("express");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");
const qlooService = require("../services/qlooService");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

/**
 * Get all donors
 */
router.get("/", authMiddleware.authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donors")
      .select(
        `
        *,
        users!inner(full_name, phone_number, city, state),
        bloodgroups!inner(group_name)
      `
      )
      .eq("is_available_for_sos", true)
      .order("donation_count", { ascending: false });

    if (error) {
      console.error("Error fetching donors:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch donors",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Donors fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get donor by ID
 */
router.get("/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("donors")
      .select(
        `
        *,
        users!inner(full_name, phone_number, city, state, email),
        bloodgroups!inner(group_name)
      `
      )
      .eq("donor_id", id)
      .single();

    if (error) {
      console.error("Error fetching donor:", error);
      return res.status(404).json({
        status: "error",
        message: "Donor not found",
      });
    }

    res.json({
      status: "success",
      data,
    });
  } catch (error) {
    console.error("Donor fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Update donor location
 */
router.put("/:id/location", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const userId = req.user.user_id;

    // Check if user is updating their own profile or is admin
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this donor",
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: "error",
        message: "Latitude and longitude are required",
      });
    }

    const { error } = await supabase
      .from("donors")
      .update({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      })
      .eq("donor_id", id);

    if (error) {
      console.error("Error updating donor location:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update location",
      });
    }

    res.json({
      status: "success",
      message: "Location updated successfully",
    });
  } catch (error) {
    console.error("Location update error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Update donor SOS availability
 */
router.put("/:id/sos-availability", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available_for_sos } = req.body;
    const userId = req.user.user_id;

    // Check if user is updating their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this donor",
      });
    }

    const { error } = await supabase
      .from("donors")
      .update({
        is_available_for_sos: Boolean(is_available_for_sos),
      })
      .eq("donor_id", id);

    if (error) {
      console.error("Error updating SOS availability:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update SOS availability",
      });
    }

    res.json({
      status: "success",
      message: "SOS availability updated successfully",
    });
  } catch (error) {
    console.error("SOS availability update error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Update donor interests/taste keywords
 */
router.put("/:id/interests", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { interests } = req.body;
    const userId = req.user.user_id;

    // Check if user is updating their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this donor",
      });
    }

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        status: "error",
        message: "Interests must be an array",
      });
    }

    const { error } = await supabase
      .from("donors")
      .update({
        qloo_taste_keywords: interests,
      })
      .eq("donor_id", id);

    if (error) {
      console.error("Error updating donor interests:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update interests",
      });
    }

    res.json({
      status: "success",
      message: "Interests updated successfully",
    });
  } catch (error) {
    console.error("Interests update error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get donor notifications
 */
router.get("/:id/notifications", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    const userId = req.user.user_id;

    // Check if user is accessing their own notifications
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to access these notifications",
      });
    }

    let query = supabase
      .from("notifications")
      .select(
        `
        *,
        donationrequests!inner(
          request_id,
          urgency,
          units_required,
          hospital_name,
          bloodgroups!inner(group_name),
          bloodcomponents!inner(component_name)
        )
      `
      )
      .eq("donor_id", id)
      .order("sent_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch notifications",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get donor coupons
 */
router.get("/:id/coupons", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const userId = req.user.user_id;

    // Check if user is accessing their own coupons
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to access these coupons",
      });
    }

    let query = supabase
      .from("donorcoupons")
      .select(
        `
        *,
        coupons!inner(
          coupon_id,
          partner_name,
          coupon_title,
          expiry_date
        )
      `
      )
      .eq("donor_id", id)
      .order("issued_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching coupons:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch coupons",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Coupons fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Record a donation and automatically issue reward coupons
 */
router.post("/:id/donations", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_id, request_id, donation_date, units_donated = 1 } = req.body;
    const userId = req.user.user_id;

    // Check if user is recording their own donation
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to record donation for this donor",
      });
    }

    if (!donation_date) {
      return res.status(400).json({
        status: "error",
        message: "Donation date is required",
      });
    }

    // Start transaction
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: id,
        bank_id,
        request_id,
        donation_date,
        units_donated,
      })
      .select()
      .single();

    if (donationError) {
      console.error("Error recording donation:", donationError);
      return res.status(500).json({
        status: "error",
        message: "Failed to record donation",
      });
    }

    // Update donor's last donation date and increment donation count
    const { data: updatedDonor, error: updateError } = await supabase
      .from("donors")
      .update({
        last_donation_date: donation_date,
        donation_count: supabase.sql`donation_count + 1`
      })
      .eq("donor_id", id)
      .select("qloo_taste_keywords, donation_count")
      .single();

    if (updateError) {
      console.error("Error updating donor:", updateError);
    }

    // Automatic coupon issuance based on donation milestones and interests
    let issuedCoupons = [];
    try {
      issuedCoupons = await issueDonationRewardCoupons(id, updatedDonor);
    } catch (couponError) {
      console.error("Error issuing reward coupons:", couponError);
      // Don't fail the donation recording if coupon issuance fails
    }

    res.status(201).json({
      status: "success",
      message: "Donation recorded successfully",
      data: {
        donation,
        reward_coupons: issuedCoupons,
        total_donations: updatedDonor?.donation_count || 1
      },
    });
  } catch (error) {
    console.error("Donation recording error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Issue reward coupons based on donation milestones and interests
 */
async function issueDonationRewardCoupons(donorId, donorData) {
  const issuedCoupons = [];
  const donationCount = donorData?.donation_count || 1;
  const interests = donorData?.qloo_taste_keywords || [];

  // Define reward milestones
  const milestones = [
    { count: 1, message: "First donation reward!" },
    { count: 5, message: "5 donations milestone!" },
    { count: 10, message: "10 donations milestone!" },
    { count: 25, message: "25 donations milestone!" },
    { count: 50, message: "50 donations milestone!" }
  ];

  // Check if this donation hits a milestone
  const milestone = milestones.find(m => m.count === donationCount);

  if (milestone) {
    // Get available coupons
    const { data: availableCoupons, error: couponsError } = await supabase
      .from("coupons")
      .select("*")
      .gt("quantity_total", 0)
      .where("quantity_redeemed", "lt", "quantity_total")
      .or("expiry_date.is.null,expiry_date.gte.now()");

    if (!couponsError && availableCoupons && availableCoupons.length > 0) {
      // Get personalized recommendations
      const recommendations = await qlooService.generateCouponRecommendations(
        interests,
        availableCoupons,
        milestone.count >= 10 ? 3 : 2 // More coupons for higher milestones
      );

      if (recommendations.success && recommendations.recommendations.length > 0) {
        // Issue the recommended coupons
        for (const coupon of recommendations.recommendations) {
          try {
            const redemptionCode = generateRedemptionCode();

            const { data: issuedCoupon, error: issueError } = await supabase
              .from("donorcoupons")
              .insert({
                donor_id: donorId,
                coupon_id: coupon.coupon_id,
                unique_redemption_code: redemptionCode,
                status: "Issued"
              })
              .select(`
                *,
                coupons!inner(coupon_title, partner_name, expiry_date)
              `)
              .single();

            if (!issueError) {
              // Update coupon redeemed count
              await supabase
                .from("coupons")
                .update({
                  quantity_redeemed: supabase.sql`quantity_redeemed + 1`
                })
                .eq("coupon_id", coupon.coupon_id);

              issuedCoupons.push({
                ...issuedCoupon,
                milestone: milestone.message,
                match_score: coupon.match_score
              });
            }
          } catch (error) {
            console.error("Error issuing individual coupon:", error);
          }
        }
      }
    }
  }

  return issuedCoupons;
}

/**
 * Generate unique redemption code
 */
function generateRedemptionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get personalized coupon recommendations for donor
 */
router.get("/:id/coupon-recommendations", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    const userId = req.user.user_id;

    // Check if user is accessing their own recommendations
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to access these recommendations",
      });
    }

    // Get donor's interests
    const { data: donor, error: donorError } = await supabase
      .from("donors")
      .select("qloo_taste_keywords")
      .eq("donor_id", id)
      .single();

    if (donorError || !donor) {
      return res.status(404).json({
        status: "error",
        message: "Donor not found",
      });
    }

    // Get available coupons
    const { data: coupons, error: couponsError } = await supabase
      .from("coupons")
      .select("*")
      .gt("quantity_total", 0)
      .where("quantity_redeemed", "lt", "quantity_total")
      .or("expiry_date.is.null,expiry_date.gte.now()");

    if (couponsError) {
      console.error("Error fetching coupons:", couponsError);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch available coupons",
      });
    }

    // Generate recommendations using Qloo
    const recommendations = await qlooService.generateCouponRecommendations(
      donor.qloo_taste_keywords || [],
      coupons || [],
      parseInt(limit)
    );

    res.json({
      status: "success",
      data: recommendations,
    });
  } catch (error) {
    console.error("Coupon recommendations error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Enrich donor interests using Qloo
 */
router.post("/:id/enrich-interests", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Check if user is updating their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this donor",
      });
    }

    // Get current interests
    const { data: donor, error: donorError } = await supabase
      .from("donors")
      .select("qloo_taste_keywords")
      .eq("donor_id", id)
      .single();

    if (donorError || !donor) {
      return res.status(404).json({
        status: "error",
        message: "Donor not found",
      });
    }

    const currentInterests = donor.qloo_taste_keywords || [];

    if (currentInterests.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No interests found to enrich. Please add some interests first.",
      });
    }

    // Enrich interests using Qloo
    const enrichedKeywords = await qlooService.getTasteProfile(currentInterests);

    // Combine original and enriched interests
    const allInterests = [...new Set([...currentInterests, ...enrichedKeywords])];

    // Update donor's interests
    const { error: updateError } = await supabase
      .from("donors")
      .update({
        qloo_taste_keywords: allInterests,
      })
      .eq("donor_id", id);

    if (updateError) {
      console.error("Error updating enriched interests:", updateError);
      return res.status(500).json({
        status: "error",
        message: "Failed to update enriched interests",
      });
    }

    res.json({
      status: "success",
      message: "Interests enriched successfully",
      data: {
        original_count: currentInterests.length,
        enriched_count: allInterests.length,
        new_interests: enrichedKeywords,
        all_interests: allInterests,
      },
    });
  } catch (error) {
    console.error("Interest enrichment error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
