const express = require("express");
const { supabase } = require("../utils/supabase");
const AuthMiddleware = require("../middleware/AuthMiddleware");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

/**
 * Test authentication without middleware
 */
router.post("/test-auth", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Token required",
      });
    }

    // Test token validation
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error) {
      return res.json({
        status: "error",
        message: "Token validation failed",
        error: error.message,
      });
    }

    if (!user) {
      return res.json({
        status: "error",
        message: "No user found",
      });
    }

    // Test database lookup
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    res.json({
      status: "success",
      auth_user: {
        id: user.id,
        email: user.email,
      },
      db_user: userData,
      db_error: userError?.message,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * Test with middleware
 */
router.get("/test-middleware", authMiddleware.authenticate, (req, res) => {
  res.json({
    status: "success",
    message: "Middleware working",
    user: req.user,
  });
});

/**
 * List all users for debugging
 */
router.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, email, full_name, user_type, auth_id")
      .limit(10);

    res.json({
      status: "success",
      users: data,
      error: error?.message,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
