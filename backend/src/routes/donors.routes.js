const express = require("express");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");

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
 * Record a donation
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

    const { data, error } = await supabase
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

    if (error) {
      console.error("Error recording donation:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to record donation",
      });
    }

    // Update donor's last donation date
    await supabase
      .from("donors")
      .update({ last_donation_date: donation_date })
      .eq("donor_id", id);

    res.status(201).json({
      status: "success",
      message: "Donation recorded successfully",
      data,
    });
  } catch (error) {
    console.error("Donation recording error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
