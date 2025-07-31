const express = require("express");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

/**
 * Get all donation requests
 */
router.get("/", authMiddleware.authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donationrequests")
      .select(
        `
        *,
        patients!inner(
          patient_id,
          users!inner(full_name, phone_number, city, state)
        ),
        bloodgroups!inner(group_name),
        bloodcomponents!inner(component_name)
      `
      )
      .eq("status", "Open")
      .order("request_datetime", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch requests",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Requests fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Create a new donation request
 */
router.post("/", authMiddleware.authenticate, async (req, res) => {
  try {
    const {
      blood_group_id,
      component_id,
      units_required,
      urgency,
      hospital_name,
      hospital_address,
      notes,
    } = req.body;

    const userId = req.user.user_id;

    // Validate required fields
    if (!blood_group_id || !component_id || !units_required || !urgency) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields",
      });
    }

    // Create the request
    const { data, error } = await supabase
      .from("donationrequests")
      .insert({
        patient_id: userId,
        blood_group_id,
        component_id,
        units_required,
        urgency,
        hospital_name,
        hospital_address,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating request:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create request",
      });
    }

    res.status(201).json({
      status: "success",
      message: "Request created successfully",
      data,
    });
  } catch (error) {
    console.error("Request creation error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
