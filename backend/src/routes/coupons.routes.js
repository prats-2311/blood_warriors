const express = require("express");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

/**
 * Get all available coupons
 */
router.get("/", authMiddleware.authenticate, async (req, res) => {
  try {
    const { partner_name, limit = 50 } = req.query;

    let query = supabase
      .from("coupons")
      .select("*")
      .gt("quantity_total", 0)
      .where("quantity_redeemed", "lt", "quantity_total")
      .or("expiry_date.is.null,expiry_date.gte.now()")
      .order("coupon_id", { ascending: false })
      .limit(limit);

    if (partner_name) {
      query = query.ilike("partner_name", `%${partner_name}%`);
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
 * Get coupon by ID
 */
router.get("/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("coupon_id", id)
      .single();

    if (error) {
      console.error("Error fetching coupon:", error);
      return res.status(404).json({
        status: "error",
        message: "Coupon not found",
      });
    }

    res.json({
      status: "success",
      data,
    });
  } catch (error) {
    console.error("Coupon fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Redeem a donor coupon
 */
router.post("/redeem", authMiddleware.authenticate, async (req, res) => {
  try {
    const { redemption_code } = req.body;
    const userId = req.user.user_id;

    if (!redemption_code) {
      return res.status(400).json({
        status: "error",
        message: "Redemption code is required",
      });
    }

    // Find the donor coupon
    const { data: donorCoupon, error: fetchError } = await supabase
      .from("donorcoupons")
      .select(
        `
        *,
        coupons!inner(*)
      `
      )
      .eq("unique_redemption_code", redemption_code)
      .eq("donor_id", userId)
      .eq("status", "Issued")
      .single();

    if (fetchError || !donorCoupon) {
      return res.status(404).json({
        status: "error",
        message: "Invalid redemption code or coupon already redeemed",
      });
    }

    // Check if coupon is expired
    if (donorCoupon.coupons.expiry_date && new Date(donorCoupon.coupons.expiry_date) < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Coupon has expired",
      });
    }

    // Update coupon status to redeemed
    const { error: updateError } = await supabase
      .from("donorcoupons")
      .update({ status: "Redeemed" })
      .eq("id", donorCoupon.id);

    if (updateError) {
      console.error("Error redeeming coupon:", updateError);
      return res.status(500).json({
        status: "error",
        message: "Failed to redeem coupon",
      });
    }

    res.json({
      status: "success",
      message: "Coupon redeemed successfully",
      data: {
        coupon_title: donorCoupon.coupons.coupon_title,
        partner_name: donorCoupon.coupons.partner_name,
        redeemed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Coupon redemption error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Validate redemption code
 */
router.post("/validate", authMiddleware.authenticate, async (req, res) => {
  try {
    const { redemption_code } = req.body;
    const userId = req.user.user_id;

    if (!redemption_code) {
      return res.status(400).json({
        status: "error",
        message: "Redemption code is required",
      });
    }

    const { data: donorCoupon, error } = await supabase
      .from("donorcoupons")
      .select(
        `
        *,
        coupons!inner(*)
      `
      )
      .eq("unique_redemption_code", redemption_code)
      .eq("donor_id", userId)
      .single();

    if (error || !donorCoupon) {
      return res.json({
        status: "success",
        data: {
          isValid: false,
          message: "Invalid redemption code",
        },
      });
    }

    const isExpired = donorCoupon.coupons.expiry_date && 
                     new Date(donorCoupon.coupons.expiry_date) < new Date();
    const isRedeemed = donorCoupon.status === "Redeemed";

    res.json({
      status: "success",
      data: {
        isValid: !isExpired && !isRedeemed,
        isExpired,
        isRedeemed,
        coupon: donorCoupon.coupons,
        message: isExpired ? "Coupon has expired" : 
                isRedeemed ? "Coupon already redeemed" : 
                "Valid coupon",
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
