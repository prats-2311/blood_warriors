const crypto = require("crypto");

class SecurityMiddleware {
  constructor() {
    // CORS configuration
    this.corsConfig = {
      allowedOrigins: this._getAllowedOrigins(),
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "X-CSRF-Token",
      ],
      exposedHeaders: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
    };

    // CSRF token storage (in production, use Redis or database)
    this.csrfTokens = new Map();

    // Security headers configuration
    this.defaultSecurityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
    };
  }

  /**
   * CORS middleware with proper origin validation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  cors = (req, res, next) => {
    const origin = req.headers.origin;
    const method = req.method;

    // Handle preflight requests
    if (method === "OPTIONS") {
      this._handlePreflightRequest(req, res, origin);
      return;
    }

    // Validate origin
    if (origin && !this._isOriginAllowed(origin)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "CORS_ORIGIN_NOT_ALLOWED",
          message: "Origin not allowed by CORS policy",
        },
      });
    }

    // Set CORS headers for actual requests
    if (origin && this._isOriginAllowed(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }

    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Expose-Headers",
      this.corsConfig.exposedHeaders.join(", ")
    );

    next();
  };

  /**
   * CSRF protection middleware for state-changing operations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  csrfProtection = (req, res, next) => {
    const method = req.method.toLowerCase();

    // Skip CSRF check for safe methods
    if (["get", "head", "options"].includes(method)) {
      return next();
    }

    // Skip CSRF check for API endpoints with proper authentication
    if (req.path.startsWith("/api/") && req.headers.authorization) {
      return next();
    }

    const token = req.headers["x-csrf-token"] || req.body._csrf;

    if (!token) {
      return res.status(403).json({
        success: false,
        error: {
          code: "CSRF_TOKEN_MISSING",
          message: "CSRF token is required for this operation",
        },
      });
    }

    if (!this._validateCSRFToken(token, req.sessionID || req.ip)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "CSRF_TOKEN_INVALID",
          message: "Invalid CSRF token",
        },
      });
    }

    next();
  };

  /**
   * Generate CSRF token for a session
   * @param {string} sessionId - Session identifier
   * @returns {string} CSRF token
   */
  generateCSRFToken = (sessionId) => {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    this.csrfTokens.set(sessionId, {
      token,
      expiry,
    });

    return token;
  };

  /**
   * Input validation and sanitization middleware
   * @param {Object} options - Validation options
   * @returns {Function} Express middleware function
   */
  inputValidation = (options = {}) => {
    const config = {
      maxBodySize: options.maxBodySize || "10mb",
      allowedContentTypes: options.allowedContentTypes || [
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data",
      ],
      sanitizeStrings: options.sanitizeStrings !== false,
      ...options,
    };

    return (req, res, next) => {
      // Validate content type
      if (req.method !== "GET" && req.headers["content-type"]) {
        const contentType = req.headers["content-type"].split(";")[0];
        if (!config.allowedContentTypes.includes(contentType)) {
          return res.status(415).json({
            success: false,
            error: {
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: "Unsupported content type",
            },
          });
        }
      }

      // Sanitize request body
      if (req.body && config.sanitizeStrings) {
        req.body = this._sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && config.sanitizeStrings) {
        req.query = this._sanitizeObject(req.query);
      }

      // Validate request size (this should be handled by body parser, but double-check)
      const contentLength = req.headers["content-length"];
      if (
        contentLength &&
        parseInt(contentLength) > this._parseSize(config.maxBodySize)
      ) {
        return res.status(413).json({
          success: false,
          error: {
            code: "REQUEST_TOO_LARGE",
            message: "Request body too large",
          },
        });
      }

      next();
    };
  };

  /**
   * Security headers middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  securityHeaders = (req, res, next) => {
    // Set security headers
    Object.entries(this.defaultSecurityHeaders).forEach(([header, value]) => {
      res.header(header, value);
    });

    // Set Content Security Policy
    const csp = this._buildCSP(req);
    res.header("Content-Security-Policy", csp);

    next();
  };

  /**
   * Request logging middleware for security monitoring
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  securityLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log suspicious patterns
    this._detectSuspiciousPatterns(req);

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      const duration = Date.now() - startTime;

      // Log security-relevant requests
      if (
        res.statusCode >= 400 ||
        req.path.includes("auth") ||
        req.path.includes("admin")
      ) {
        console.log(
          `[SECURITY] ${req.method} ${req.path} - ${
            res.statusCode
          } - ${duration}ms - IP: ${req.ip} - UA: ${req.headers[
            "user-agent"
          ]?.substring(0, 100)}`
        );
      }

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };

  // Private helper methods

  /**
   * Get allowed origins from environment
   * @private
   */
  _getAllowedOrigins() {
    const origins =
      process.env.ALLOWED_ORIGINS ||
      process.env.FRONTEND_URL ||
      "http://localhost:3100";
    return origins.split(",").map((origin) => origin.trim());
  }

  /**
   * Check if origin is allowed
   * @private
   */
  _isOriginAllowed(origin) {
    return (
      this.corsConfig.allowedOrigins.includes(origin) ||
      this.corsConfig.allowedOrigins.includes("*")
    );
  }

  /**
   * Handle preflight CORS requests
   * @private
   */
  _handlePreflightRequest(req, res, origin) {
    if (origin && this._isOriginAllowed(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }

    res.header(
      "Access-Control-Allow-Methods",
      this.corsConfig.allowedMethods.join(", ")
    );
    res.header(
      "Access-Control-Allow-Headers",
      this.corsConfig.allowedHeaders.join(", ")
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", this.corsConfig.maxAge.toString());

    res.status(204).end();
  }

  /**
   * Validate CSRF token
   * @private
   */
  _validateCSRFToken(token, sessionId) {
    const storedData = this.csrfTokens.get(sessionId);

    if (!storedData) {
      return false;
    }

    if (Date.now() > storedData.expiry) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    return storedData.token === token;
  }

  /**
   * Sanitize object recursively
   * @private
   */
  _sanitizeObject(obj) {
    if (typeof obj === "string") {
      return this._sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this._sanitizeObject(item));
    }

    if (obj && typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this._sanitizeString(key)] = this._sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize string input
   * @private
   */
  _sanitizeString(str) {
    if (typeof str !== "string") {
      return str;
    }

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .replace(/[<>]/g, "") // Remove angle brackets
      .trim();
  }

  /**
   * Parse size string to bytes
   * @private
   */
  _parseSize(size) {
    if (typeof size === "number") {
      return size;
    }

    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);

    if (!match) {
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || "b";

    return Math.floor(value * units[unit]);
  }

  /**
   * Build Content Security Policy
   * @private
   */
  _buildCSP(req) {
    const isProduction = process.env.NODE_ENV === "production";

    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for development
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'none'",
      "worker-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ];

    if (isProduction) {
      directives.push("upgrade-insecure-requests");
    }

    return directives.join("; ");
  }

  /**
   * Detect suspicious request patterns
   * @private
   */
  _detectSuspiciousPatterns(req) {
    const suspiciousPatterns = [
      /\.\.\//g, // Directory traversal
      /<script/gi, // XSS attempts
      /union\s+select/gi, // SQL injection
      /exec\s*\(/gi, // Code execution attempts
      /eval\s*\(/gi, // Code evaluation attempts
    ];

    const checkString = `${req.url} ${JSON.stringify(
      req.query
    )} ${JSON.stringify(req.body)}`;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        console.warn(
          `[SECURITY ALERT] Suspicious pattern detected from IP ${
            req.ip
          }: ${pattern.toString()}`
        );
        break;
      }
    }

    // Check for unusual request patterns
    if (req.headers["user-agent"] && req.headers["user-agent"].length < 10) {
      console.warn(
        `[SECURITY ALERT] Suspicious user agent from IP ${req.ip}: ${req.headers["user-agent"]}`
      );
    }
  }

  /**
   * Clean up expired CSRF tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [sessionId, data] of this.csrfTokens.entries()) {
      if (now > data.expiry) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }

  /**
   * Get security middleware configuration
   * @returns {Object} Current security configuration
   */
  getSecurityConfig() {
    return {
      corsConfig: this.corsConfig,
      securityHeaders: this.defaultSecurityHeaders,
      csrfTokenCount: this.csrfTokens.size,
    };
  }
}

module.exports = SecurityMiddleware;
