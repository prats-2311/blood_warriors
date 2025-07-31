const JWTService = require("../services/JWTService");
const { supabase } = require("../utils/supabase");

class AuthMiddleware {
  constructor() {
    this.jwtService = new JWTService();

    // Rate limiting storage (in production, use Redis)
    this.rateLimitStore = new Map();
    this.loginAttemptStore = new Map();

    // Rate limiting configuration
    this.rateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // Max requests per window
      maxLoginAttempts: 5, // Max login attempts per IP
      lockoutDuration: 15 * 60 * 1000, // 15 minutes lockout
    };
  }

  /**
   * JWT token validation middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticate = async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = this.jwtService.extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: "AUTH_TOKEN_MISSING",
            message: "Authentication token is required",
          },
        });
      }

      // Verify the access token
      let decoded;
      try {
        decoded = this.jwtService.verifyAccessToken(token);
      } catch (error) {
        let errorCode = "AUTH_TOKEN_INVALID";
        let errorMessage = "Invalid authentication token";

        if (error.message.includes("expired")) {
          errorCode = "AUTH_TOKEN_EXPIRED";
          errorMessage = "Authentication token has expired";
        } else if (error.message.includes("revoked")) {
          errorCode = "AUTH_TOKEN_REVOKED";
          errorMessage = "Authentication token has been revoked";
        }

        return res.status(401).json({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
          },
        });
      }

      // Get user data from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          "user_id, email, full_name, phone_number, city, state, user_type, is_active, is_verified, created_at"
        )
        .eq("user_id", decoded.sub)
        .single();

      if (userError || !userData) {
        return res.status(401).json({
          success: false,
          error: {
            code: "AUTH_USER_NOT_FOUND",
            message: "User not found",
          },
        });
      }

      // Check if user account is active
      if (!userData.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            code: "AUTH_ACCOUNT_INACTIVE",
            message: "Account is inactive",
          },
        });
      }

      // Attach user data to request
      req.user = userData;
      req.tokenPayload = decoded;

      next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "AUTH_INTERNAL_ERROR",
          message: "Internal authentication error",
        },
      });
    }
  };

  /**
   * Role-based authorization middleware
   * @param {string|Array} allowedRoles - Allowed user roles
   * @returns {Function} Express middleware function
   */
  authorize = (allowedRoles) => {
    // Normalize to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "AUTH_REQUIRED",
            message: "Authentication required",
          },
        });
      }

      if (!roles.includes(req.user.user_type)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "AUTH_INSUFFICIENT_PERMISSIONS",
            message: "Insufficient permissions for this resource",
          },
        });
      }

      next();
    };
  };

  /**
   * Rate limiting middleware for API endpoints
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware function
   */
  rateLimiter = (options = {}) => {
    const config = { ...this.rateLimitConfig, ...options };

    return (req, res, next) => {
      const clientId = this._getClientId(req);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Clean up old entries
      this._cleanupRateLimit(windowStart);

      // Get or create client record
      if (!this.rateLimitStore.has(clientId)) {
        this.rateLimitStore.set(clientId, []);
      }

      const requests = this.rateLimitStore.get(clientId);

      // Remove old requests outside the window
      const validRequests = requests.filter(
        (timestamp) => timestamp > windowStart
      );

      // Check if limit exceeded
      if (validRequests.length >= config.maxRequests) {
        const resetTime = Math.ceil(
          (validRequests[0] + config.windowMs) / 1000
        );

        res.set({
          "X-RateLimit-Limit": config.maxRequests,
          "X-RateLimit-Remaining": 0,
          "X-RateLimit-Reset": resetTime,
        });

        return res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later",
            retryAfter: resetTime,
          },
        });
      }

      // Add current request
      validRequests.push(now);
      this.rateLimitStore.set(clientId, validRequests);

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": config.maxRequests,
        "X-RateLimit-Remaining": config.maxRequests - validRequests.length,
        "X-RateLimit-Reset": Math.ceil((now + config.windowMs) / 1000),
      });

      next();
    };
  };

  /**
   * Login attempt tracking and account locking middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  loginAttemptTracker = (req, res, next) => {
    const clientId = this._getClientId(req);
    const now = Date.now();

    // Check if client is currently locked out
    if (this.loginAttemptStore.has(clientId)) {
      const attemptData = this.loginAttemptStore.get(clientId);

      if (attemptData.lockedUntil && attemptData.lockedUntil > now) {
        const remainingTime = Math.ceil((attemptData.lockedUntil - now) / 1000);

        return res.status(429).json({
          success: false,
          error: {
            code: "AUTH_ACCOUNT_LOCKED",
            message:
              "Too many failed login attempts. Account temporarily locked.",
            retryAfter: remainingTime,
          },
        });
      }
    }

    // Store original res.json to intercept responses
    const originalJson = res.json;
    res.json = (data) => {
      // Check if this was a failed login attempt
      if (res.statusCode === 401 && req.path.includes("/login")) {
        this._recordFailedLogin(clientId);
      } else if (res.statusCode === 200 && req.path.includes("/login")) {
        // Successful login - clear failed attempts
        this._clearFailedLogins(clientId);
      }

      // Call original json method
      return originalJson.call(res, data);
    };

    next();
  };

  /**
   * Middleware to require email verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  requireVerification = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication required",
        },
      });
    }

    if (!req.user.is_verified) {
      return res.status(403).json({
        success: false,
        error: {
          code: "AUTH_EMAIL_NOT_VERIFIED",
          message: "Email verification required",
        },
      });
    }

    next();
  };

  /**
   * Optional authentication middleware (doesn't fail if no token)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.jwtService.extractTokenFromHeader(authHeader);

      if (!token) {
        // No token provided, continue without authentication
        return next();
      }

      // Try to verify token
      try {
        const decoded = this.jwtService.verifyAccessToken(token);

        // Get user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            "user_id, email, full_name, phone_number, city, state, user_type, is_active, is_verified, created_at"
          )
          .eq("user_id", decoded.sub)
          .single();

        if (!userError && userData && userData.is_active) {
          req.user = userData;
          req.tokenPayload = decoded;
        }
      } catch (error) {
        // Token invalid, but don't fail - just continue without auth
        console.log("Optional auth token invalid:", error.message);
      }

      next();
    } catch (error) {
      console.error("Optional auth middleware error:", error);
      next(); // Continue even on error
    }
  };

  // Private helper methods

  /**
   * Get client identifier for rate limiting
   * @private
   */
  _getClientId(req) {
    // Use user ID if authenticated, otherwise use IP
    return (
      req.user?.user_id || req.ip || req.connection.remoteAddress || "unknown"
    );
  }

  /**
   * Clean up old rate limit entries
   * @private
   */
  _cleanupRateLimit(windowStart) {
    for (const [clientId, requests] of this.rateLimitStore.entries()) {
      const validRequests = requests.filter(
        (timestamp) => timestamp > windowStart
      );
      if (validRequests.length === 0) {
        this.rateLimitStore.delete(clientId);
      } else {
        this.rateLimitStore.set(clientId, validRequests);
      }
    }
  }

  /**
   * Record a failed login attempt
   * @private
   */
  _recordFailedLogin(clientId) {
    const now = Date.now();

    if (!this.loginAttemptStore.has(clientId)) {
      this.loginAttemptStore.set(clientId, {
        attempts: 0,
        firstAttempt: now,
        lockedUntil: null,
      });
    }

    const attemptData = this.loginAttemptStore.get(clientId);
    attemptData.attempts += 1;

    // Check if we should lock the account
    if (attemptData.attempts >= this.rateLimitConfig.maxLoginAttempts) {
      attemptData.lockedUntil = now + this.rateLimitConfig.lockoutDuration;
      console.log(
        `Client ${clientId} locked out after ${attemptData.attempts} failed attempts`
      );
    }

    this.loginAttemptStore.set(clientId, attemptData);
  }

  /**
   * Clear failed login attempts for successful login
   * @private
   */
  _clearFailedLogins(clientId) {
    this.loginAttemptStore.delete(clientId);
  }

  /**
   * Get rate limit status for a client
   * @param {string} clientId - Client identifier
   * @returns {Object} Rate limit status
   */
  getRateLimitStatus(clientId) {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    if (!this.rateLimitStore.has(clientId)) {
      return {
        requests: 0,
        remaining: this.rateLimitConfig.maxRequests,
        resetTime: Math.ceil((now + this.rateLimitConfig.windowMs) / 1000),
      };
    }

    const requests = this.rateLimitStore.get(clientId);
    const validRequests = requests.filter(
      (timestamp) => timestamp > windowStart
    );

    return {
      requests: validRequests.length,
      remaining: Math.max(
        0,
        this.rateLimitConfig.maxRequests - validRequests.length
      ),
      resetTime:
        validRequests.length > 0
          ? Math.ceil((validRequests[0] + this.rateLimitConfig.windowMs) / 1000)
          : Math.ceil((now + this.rateLimitConfig.windowMs) / 1000),
    };
  }

  /**
   * Get login attempt status for a client
   * @param {string} clientId - Client identifier
   * @returns {Object} Login attempt status
   */
  getLoginAttemptStatus(clientId) {
    if (!this.loginAttemptStore.has(clientId)) {
      return {
        attempts: 0,
        isLocked: false,
        lockedUntil: null,
      };
    }

    const attemptData = this.loginAttemptStore.get(clientId);
    const now = Date.now();

    return {
      attempts: attemptData.attempts,
      isLocked: attemptData.lockedUntil && attemptData.lockedUntil > now,
      lockedUntil: attemptData.lockedUntil,
    };
  }
}

module.exports = AuthMiddleware;
