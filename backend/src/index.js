require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Validate environment variables
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingVars.join(", ")
  );
  process.exit(1);
}

console.log("✅ Environment variables validated");

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? ["http://localhost:3000", "http://localhost:3100"]
        : process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Blood Warriors API is running" });
});

// API routes
app.use("/api/health", require("./routes/health"));
app.use("/api/debug", require("./routes/debug.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/requests", require("./routes/requests.routes"));
app.use("/api/donors", require("./routes/donors.routes"));
app.use("/api/public-data", require("./routes/public-data.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/partner", require("./routes/partner.routes"));
app.use("/api/notifications", require("./routes/notifications.routes"));
app.use("/api/coupons", require("./routes/coupons.routes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
});

// Start server
app.listen(port, () => {
  console.log(`🩸 Blood Warriors API running on port ${port}`);
});
