const express = require("express");
const {
  register,
  login,
  getProfile,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticate, getProfile);

// Debug route to test authentication
router.get("/debug/token", authenticate, (req, res) => {
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

module.exports = router;
