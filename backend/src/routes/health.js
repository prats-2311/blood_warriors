const express = require("express");
const router = express.Router();

/**
 * Health check endpoint for deployment monitoring
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    services: {
      database: "connected", // You can add actual health checks here
      ai: "available",
      personalization: "active",
    },
  });
});

/**
 * API status endpoint
 */
router.get("/status", (req, res) => {
  res.status(200).json({
    api: "Blood Warriors AI Personalization API",
    version: "1.0.0",
    status: "operational",
    features: {
      personalization: true,
      aiChat: true,
      rewardSystem: true,
      qlooIntegration: !!process.env.QLOO_API_KEY,
      llmIntegration: !!process.env.LLM_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
