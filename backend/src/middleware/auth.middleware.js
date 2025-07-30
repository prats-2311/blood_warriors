const { supabase, supabaseAuth } = require("../utils/supabase");

/**
 * Middleware to authenticate requests using Supabase Auth
 */
const authenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token with Supabase Auth (using anon key client)
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // Get the user details from our Users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    // Attach the user to the request object
    req.user = userData;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      status: "error",
      message: "Authentication failed",
    });
  }
};

/**
 * Middleware to check if the user is a patient
 */
const isPatient = (req, res, next) => {
  if (!req.user || req.user.user_type !== "Patient") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Patient role required.",
    });
  }
  next();
};

/**
 * Middleware to check if the user is a donor
 */
const isDonor = (req, res, next) => {
  if (!req.user || req.user.user_type !== "Donor") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Donor role required.",
    });
  }
  next();
};

/**
 * Middleware to check if the user is an admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.user_type !== "Admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Admin role required.",
    });
  }
  next();
};

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
  authenticate,
  isPatient,
  isDonor,
  isAdmin,
  authenticatePartner,
};
