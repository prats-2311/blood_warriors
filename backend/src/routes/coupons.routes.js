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

/**
 * Admin: Create new coupon
 */
router.post("/admin/create", authMiddleware.authenticate, async (req, res) => {
  try {
    const {
      partner_name,
      coupon_title,
      target_keywords,
      quantity_total,
      expiry_date
    } = req.body;

    // Basic admin check (in production, implement proper role-based access)
    const userEmail = req.user.email;
    if (!userEmail || !userEmail.includes('admin')) {
      return res.status(403).json({
        status: "error",
        message: "Admin access required",
      });
    }

    // Validate required fields
    if (!partner_name || !coupon_title || !target_keywords || !quantity_total) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: partner_name, coupon_title, target_keywords, quantity_total",
      });
    }

    // Validate target_keywords is an array
    if (!Array.isArray(target_keywords)) {
      return res.status(400).json({
        status: "error",
        message: "target_keywords must be an array",
      });
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        partner_name,
        coupon_title,
        target_keywords,
        quantity_total: parseInt(quantity_total),
        quantity_redeemed: 0,
        expiry_date: expiry_date || null
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating coupon:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create coupon",
      });
    }

    res.status(201).json({
      status: "success",
      message: "Coupon created successfully",
      data,
    });
  } catch (error) {
    console.error("Coupon creation error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Admin: Update coupon
 */
router.put("/admin/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partner_name,
      coupon_title,
      target_keywords,
      quantity_total,
      expiry_date
    } = req.body;

    // Basic admin check
    const userEmail = req.user.email;
    if (!userEmail || !userEmail.includes('admin')) {
      return res.status(403).json({
        status: "error",
        message: "Admin access required",
      });
    }

    const updateData = {};
    if (partner_name) updateData.partner_name = partner_name;
    if (coupon_title) updateData.coupon_title = coupon_title;
    if (target_keywords) {
      if (!Array.isArray(target_keywords)) {
        return res.status(400).json({
          status: "error",
          message: "target_keywords must be an array",
        });
      }
      updateData.target_keywords = target_keywords;
    }
    if (quantity_total) updateData.quantity_total = parseInt(quantity_total);
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date;

    const { data, error } = await supabase
      .from("coupons")
      .update(updateData)
      .eq("coupon_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating coupon:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update coupon",
      });
    }

    res.json({
      status: "success",
      message: "Coupon updated successfully",
      data,
    });
  } catch (error) {
    console.error("Coupon update error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Admin: Delete coupon
 */
router.delete("/admin/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Basic admin check
    const userEmail = req.user.email;
    if (!userEmail || !userEmail.includes('admin')) {
      return res.status(403).json({
        status: "error",
        message: "Admin access required",
      });
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("coupon_id", id);

    if (error) {
      console.error("Error deleting coupon:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete coupon",
      });
    }

    res.json({
      status: "success",
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Coupon deletion error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Admin: Get coupon analytics
 */
router.get("/admin/analytics", authMiddleware.authenticate, async (req, res) => {
  try {
    // Basic admin check
    const userEmail = req.user.email;
    if (!userEmail || !userEmail.includes('admin')) {
      return res.status(403).json({
        status: "error",
        message: "Admin access required",
      });
    }

    // Get coupon statistics
    const { data: coupons, error: couponsError } = await supabase
      .from("coupons")
      .select("*");

    if (couponsError) {
      throw couponsError;
    }

    // Get redemption statistics
    const { data: redemptions, error: redemptionsError } = await supabase
      .from("donorcoupons")
      .select(`
        status,
        issued_at,
        redeemed_at,
        coupons!inner(partner_name, coupon_title)
      `);

    if (redemptionsError) {
      throw redemptionsError;
    }

    // Calculate analytics
    const analytics = {
      total_coupons: coupons.length,
      active_coupons: coupons.filter(c =>
        c.quantity_redeemed < c.quantity_total &&
        (!c.expiry_date || new Date(c.expiry_date) > new Date())
      ).length,
      expired_coupons: coupons.filter(c =>
        c.expiry_date && new Date(c.expiry_date) <= new Date()
      ).length,
      total_issued: redemptions.length,
      total_redeemed: redemptions.filter(r => r.status === 'Redeemed').length,
      redemption_rate: redemptions.length > 0 ?
        (redemptions.filter(r => r.status === 'Redeemed').length / redemptions.length * 100).toFixed(2) : 0,
      partner_breakdown: {}
    };

    // Partner breakdown
    coupons.forEach(coupon => {
      if (!analytics.partner_breakdown[coupon.partner_name]) {
        analytics.partner_breakdown[coupon.partner_name] = {
          total_coupons: 0,
          total_quantity: 0,
          redeemed_quantity: 0
        };
      }
      analytics.partner_breakdown[coupon.partner_name].total_coupons++;
      analytics.partner_breakdown[coupon.partner_name].total_quantity += coupon.quantity_total;
      analytics.partner_breakdown[coupon.partner_name].redeemed_quantity += coupon.quantity_redeemed;
    });

    res.json({
      status: "success",
      data: analytics,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
