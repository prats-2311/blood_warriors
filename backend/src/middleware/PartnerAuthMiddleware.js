/**
 * Middleware to authenticate partner API requests
 */
const authenticatePartner = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        status: "error",
        message: "API key required",
      });
    }

    // In a real implementation, you would validate the API key against a database
    // For now, we'll use a simple environment variable check
    if (apiKey !== process.env.PARTNER_API_KEY) {
      return res.status(401).json({
        status: "error",
        message: "Invalid API key",
      });
    }

    next();
  } catch (error) {
    console.error("Partner authentication error:", error);
    res.status(500).json({
      status: "error",
      message: "Authentication failed",
    });
  }
};

module.exports = {
  authenticatePartner,
};
