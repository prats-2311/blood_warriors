const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const router = express.Router();

/**
 * Debug endpoint to test authentication
 */
router.get("/auth-test", authenticate, (req, res) => {
  res.json({
    status: "success",
    message: "Authentication working",
    user: {
      user_id: req.user.user_id,
      email: req.user.email,
      user_type: req.user.user_type,
    },
  });
});

/**
 * Debug endpoint without authentication
 */
router.get("/ping", (req, res) => {
  res.json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
