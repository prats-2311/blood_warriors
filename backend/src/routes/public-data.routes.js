const express = require("express");
const { supabase } = require("../utils/supabase");

const router = express.Router();

/**
 * Get all blood groups
 */
router.get("/blood-groups", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bloodgroups")
      .select("*")
      .order("blood_group_id");

    if (error) {
      console.error("Error fetching blood groups:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch blood groups",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Blood groups fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get all blood components
 */
router.get("/blood-components", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bloodcomponents")
      .select("*")
      .order("component_id");

    if (error) {
      console.error("Error fetching blood components:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch blood components",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Blood components fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get all blood banks
 */
router.get("/blood-banks", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bloodbanks")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching blood banks:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch blood banks",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Blood banks fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
