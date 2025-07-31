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

module.exports = router;
