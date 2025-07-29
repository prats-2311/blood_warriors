require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? ["http://localhost:3100", "http://127.0.0.1:3100"]
        : process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Simple health check route
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Blood Warriors API is running" });
});

// API routes
app.use("/api/health", require("./routes/health.routes"));
app.use("/api/debug", require("./routes/debug.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/requests", require("./routes/requests.routes"));
app.use("/api/donors", require("./routes/donors.routes"));
app.use("/api/public-data", require("./routes/public-data.routes"));
app.use("/api/partner", require("./routes/partner.routes"));
app.use("/api/ai", require("./routes/ai.routes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Blood Warriors API running on port ${port}`);
});
