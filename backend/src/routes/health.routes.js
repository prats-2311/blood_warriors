const express = require("express");
const { supabase } = require("../utils/supabase");
const router = express.Router();

/**
 * Health check endpoint
 */
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const { data, error } = await supabase
      .from("bloodgroups")
      .select("count")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return res.status(503).json({
        status: "error",
        message: "Database connection failed",
        error: error.message,
        responseTime: `${responseTime}ms`,
      });
    }

    res.status(200).json({
      status: "healthy",
      message: "All systems operational",
      database: "connected",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Database connection test endpoint
 */
router.get("/db", async (req, res) => {
  try {
    const startTime = Date.now();

    // Test multiple database operations
    const tests = await Promise.allSettled([
      supabase.from("bloodgroups").select("count").limit(1),
      supabase.from("bloodcomponents").select("count").limit(1),
      supabase.from("users").select("count").limit(1),
    ]);

    const responseTime = Date.now() - startTime;
    const results = tests.map((test, index) => ({
      table: ["bloodgroups", "bloodcomponents", "users"][index],
      status: test.status,
      error: test.status === "rejected" ? test.reason?.message : null,
    }));

    const allPassed = tests.every((test) => test.status === "fulfilled");

    res.status(allPassed ? 200 : 503).json({
      status: allPassed ? "healthy" : "degraded",
      database: {
        overall: allPassed ? "connected" : "issues detected",
        tests: results,
        responseTime: `${responseTime}ms`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Database health check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
