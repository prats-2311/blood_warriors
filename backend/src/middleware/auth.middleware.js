const { supabase, supabaseAuth } = require("../utils/supabase");

/**
 * Middleware to authenticate requests using Supabase Auth
 */
const authenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    console.log("Auth middleware - checking request to:", req.path);
    console.log("Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid auth header format");
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extracted, length:", token.length);

    // Basic token format validation
    if (!token || token.length < 100) {
      console.log("Invalid token format");
      return res.status(401).json({
        status: "error",
        message: "Invalid token format",
      });
    }

    let user;
    let authError;

    try {
      // Verify the token with Supabase Auth (using anon key client)
      const authResult = await supabaseAuth.auth.getUser(token);
      user = authResult.data?.user;
      authError = authResult.error;

      console.log(
        "Supabase auth check - User found:",
        !!user,
        "Error:",
        authError?.message
      );
    } catch (networkError) {
      console.log("Network error during auth check:", networkError.message);

      // If it's a network error, try to decode the JWT manually as fallback
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString()
        );
        if (payload.exp && payload.exp > Date.now() / 1000) {
          // Token is not expired, create a minimal user object
          user = { id: payload.sub };
          console.log("Using JWT fallback for user:", payload.sub);
        } else {
          console.log("JWT token is expired");
          return res.status(401).json({
            status: "error",
            message: "Token expired",
          });
        }
      } catch (jwtError) {
        console.log("JWT decode failed:", jwtError.message);
        return res.status(401).json({
          status: "error",
          message: "Invalid token",
        });
      }
    }

    if (authError || !user) {
      console.log("Token validation failed:", authError?.message || "No user");
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
        debug: authError?.message,
      });
    }

    // Get the user details from our Users table with retry logic
    let userData;
    let userError;

    try {
      const result = await supabase
        .from("users")
        .select(
          "user_id, auth_id, email, phone_number, full_name, city, state, user_type, created_at"
        )
        .eq("auth_id", user.id)
        .single();

      userData = result.data;
      userError = result.error;

      // Handle case where data comes back as array (shouldn't happen with .single() but let's be safe)
      if (Array.isArray(userData) && userData.length > 0) {
        userData = userData[0];
      }
    } catch (dbError) {
      console.log("Database connection error:", dbError.message);
      userError = dbError;
    }

    console.log(
      "Database user lookup - Found:",
      !!userData,
      "Error:",
      userError?.message
    );

    if (userError || !userData) {
      console.log("User not found in database:", userError?.message);
      return res.status(401).json({
        status: "error",
        message: "User not found in database",
        debug: userError?.message,
      });
    }

    // Attach the user to the request object
    req.user = userData;
    console.log(
      "Authentication successful for user:",
      userData?.email || "unknown"
    );
    console.log("User ID:", userData?.user_id || "unknown");

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      status: "error",
      message: "Authentication failed",
      debug: error.message,
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
