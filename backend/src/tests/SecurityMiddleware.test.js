const SecurityMiddleware = require("../middleware/SecurityMiddleware");

describe("SecurityMiddleware", () => {
  let securityMiddleware;
  let req, res, next;

  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware();

    // Mock request, response, and next
    req = {
      method: "GET",
      path: "/api/test",
      url: "/api/test",
      headers: {},
      query: {},
      body: {},
      ip: "192.168.1.1",
      sessionID: "test-session-123",
    };

    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      header: jest.fn(() => res),
      end: jest.fn(() => res),
      statusCode: 200,
    };

    next = jest.fn();

    // Mock console methods
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("CORS middleware", () => {
    beforeEach(() => {
      process.env.FRONTEND_URL = "http://localhost:3100";
    });

    it("should allow requests from allowed origins", () => {
      req.headers.origin = "http://localhost:3100";

      securityMiddleware.cors(req, res, next);

      expect(res.header).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "http://localhost:3100"
      );
      expect(res.header).toHaveBeenCalledWith(
        "Access-Control-Allow-Credentials",
        "true"
      );
      expect(next).toHaveBeenCalled();
    });

    it("should reject requests from disallowed origins", () => {
      req.headers.origin = "http://malicious-site.com";

      securityMiddleware.cors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CORS_ORIGIN_NOT_ALLOWED",
          message: "Origin not allowed by CORS policy",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle preflight OPTIONS requests", () => {
      req.method = "OPTIONS";
      req.headers.origin = "http://localhost:3100";

      securityMiddleware.cors(req, res, next);

      expect(res.header).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "http://localhost:3100"
      );
      expect(res.header).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        expect.stringContaining("GET")
      );
      expect(res.header).toHaveBeenCalledWith(
        "Access-Control-Allow-Headers",
        expect.stringContaining("Authorization")
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it("should allow requests without origin header", () => {
      // No origin header (same-origin requests)
      securityMiddleware.cors(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("CSRF protection", () => {
    it("should allow safe HTTP methods without CSRF token", () => {
      req.method = "GET";

      securityMiddleware.csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow API requests with authorization header", () => {
      req.method = "POST";
      req.path = "/api/users";
      req.headers.authorization = "Bearer token123";

      securityMiddleware.csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject state-changing requests without CSRF token", () => {
      req.method = "POST";
      req.path = "/form-submit";

      securityMiddleware.csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CSRF_TOKEN_MISSING",
          message: "CSRF token is required for this operation",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject requests with invalid CSRF token", () => {
      req.method = "POST";
      req.path = "/form-submit";
      req.headers["x-csrf-token"] = "invalid-token";

      securityMiddleware.csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CSRF_TOKEN_INVALID",
          message: "Invalid CSRF token",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should accept requests with valid CSRF token", () => {
      const sessionId = "test-session-123";
      const token = securityMiddleware.generateCSRFToken(sessionId);

      req.method = "POST";
      req.path = "/form-submit";
      req.headers["x-csrf-token"] = token;
      req.sessionID = sessionId;

      securityMiddleware.csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should generate and validate CSRF tokens", () => {
      const sessionId = "test-session-123";
      const token = securityMiddleware.generateCSRFToken(sessionId);

      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars

      // Token should be valid immediately after generation
      expect(securityMiddleware._validateCSRFToken(token, sessionId)).toBe(
        true
      );

      // Invalid token should fail
      expect(securityMiddleware._validateCSRFToken("invalid", sessionId)).toBe(
        false
      );
    });
  });

  describe("Input validation and sanitization", () => {
    it("should sanitize malicious script tags from request body", () => {
      const middleware = securityMiddleware.inputValidation();
      req.method = "POST";
      req.headers["content-type"] = "application/json";
      req.body = {
        name: 'John<script>alert("xss")</script>',
        description: "Safe content",
      };

      middleware(req, res, next);

      expect(req.body.name).toBe("John");
      expect(req.body.description).toBe("Safe content");
      expect(next).toHaveBeenCalled();
    });

    it("should sanitize query parameters", () => {
      const middleware = securityMiddleware.inputValidation();
      req.query = {
        search: '<script>alert("xss")</script>test',
        filter: "safe",
      };

      middleware(req, res, next);

      expect(req.query.search).toBe("test");
      expect(req.query.filter).toBe("safe");
      expect(next).toHaveBeenCalled();
    });

    it("should reject unsupported content types", () => {
      const middleware = securityMiddleware.inputValidation();
      req.method = "POST";
      req.headers["content-type"] = "text/xml";

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Unsupported content type",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should allow supported content types", () => {
      const middleware = securityMiddleware.inputValidation();
      req.method = "POST";
      req.headers["content-type"] = "application/json";

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should handle nested object sanitization", () => {
      const middleware = securityMiddleware.inputValidation();
      req.method = "POST";
      req.headers["content-type"] = "application/json";
      req.body = {
        user: {
          name: 'John<script>alert("xss")</script>',
          profile: {
            bio: 'javascript:alert("xss")',
          },
        },
        tags: ['<script>alert("xss")</script>', "safe-tag"],
      };

      middleware(req, res, next);

      expect(req.body.user.name).toBe("John");
      expect(req.body.user.profile.bio).toBe('alert("xss")');
      expect(req.body.tags[0]).toBe("");
      expect(req.body.tags[1]).toBe("safe-tag");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Security headers", () => {
    it("should set all required security headers", () => {
      securityMiddleware.securityHeaders(req, res, next);

      expect(res.header).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff"
      );
      expect(res.header).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(res.header).toHaveBeenCalledWith(
        "X-XSS-Protection",
        "1; mode=block"
      );
      expect(res.header).toHaveBeenCalledWith(
        "Referrer-Policy",
        "strict-origin-when-cross-origin"
      );
      expect(res.header).toHaveBeenCalledWith(
        "Content-Security-Policy",
        expect.stringContaining("default-src 'self'")
      );
      expect(next).toHaveBeenCalled();
    });

    it("should set Content Security Policy with appropriate directives", () => {
      securityMiddleware.securityHeaders(req, res, next);

      const cspCall = res.header.mock.calls.find(
        (call) => call[0] === "Content-Security-Policy"
      );
      expect(cspCall).toBeDefined();

      const csp = cspCall[1];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe("Security logging", () => {
    it("should log security-relevant requests", () => {
      req.path = "/auth/login";
      res.statusCode = 401;

      securityMiddleware.securityLogger(req, res, next);

      // Simulate response end
      res.end();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[SECURITY]")
      );
      expect(next).toHaveBeenCalled();
    });

    it("should detect suspicious patterns in requests", () => {
      req.url = "/api/users?id=1 UNION SELECT * FROM users";

      securityMiddleware.securityLogger(req, res, next);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[SECURITY ALERT] Suspicious pattern detected")
      );
      expect(next).toHaveBeenCalled();
    });

    it("should detect suspicious user agents", () => {
      req.headers["user-agent"] = "bot";

      securityMiddleware.securityLogger(req, res, next);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[SECURITY ALERT] Suspicious user agent")
      );
      expect(next).toHaveBeenCalled();
    });

    it("should detect XSS attempts", () => {
      req.body = { comment: '<script>alert("xss")</script>' };

      securityMiddleware.securityLogger(req, res, next);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[SECURITY ALERT] Suspicious pattern detected")
      );
      expect(next).toHaveBeenCalled();
    });

    it("should detect directory traversal attempts", () => {
      req.url = "/api/files?path=../../../etc/passwd";

      securityMiddleware.securityLogger(req, res, next);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[SECURITY ALERT] Suspicious pattern detected")
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Helper methods", () => {
    it("should parse size strings correctly", () => {
      expect(securityMiddleware._parseSize("1mb")).toBe(1024 * 1024);
      expect(securityMiddleware._parseSize("500kb")).toBe(500 * 1024);
      expect(securityMiddleware._parseSize("1024")).toBe(1024);
      expect(securityMiddleware._parseSize(2048)).toBe(2048);
    });

    it("should sanitize strings correctly", () => {
      expect(
        securityMiddleware._sanitizeString('<script>alert("xss")</script>')
      ).toBe("");
      expect(
        securityMiddleware._sanitizeString('javascript:alert("xss")')
      ).toBe('alert("xss")');
      expect(securityMiddleware._sanitizeString('onclick="alert()"')).toBe(
        '"alert()"'
      );
      expect(securityMiddleware._sanitizeString("Safe content")).toBe(
        "Safe content"
      );
    });

    it("should clean up expired CSRF tokens", () => {
      const sessionId = "test-session";

      // Generate token and manually expire it
      securityMiddleware.generateCSRFToken(sessionId);
      const tokenData = securityMiddleware.csrfTokens.get(sessionId);
      tokenData.expiry = Date.now() - 1000; // Expired 1 second ago

      expect(securityMiddleware.csrfTokens.size).toBe(1);

      securityMiddleware.cleanupExpiredTokens();

      expect(securityMiddleware.csrfTokens.size).toBe(0);
    });

    it("should return security configuration", () => {
      const config = securityMiddleware.getSecurityConfig();

      expect(config).toHaveProperty("corsConfig");
      expect(config).toHaveProperty("securityHeaders");
      expect(config).toHaveProperty("csrfTokenCount");
      expect(typeof config.csrfTokenCount).toBe("number");
    });
  });

  describe("Integration tests", () => {
    it("should handle complete security pipeline", () => {
      // Setup request with potential security issues
      req.method = "POST";
      req.path = "/api/users";
      req.headers.origin = "http://localhost:3100";
      req.headers["content-type"] = "application/json";
      req.headers.authorization = "Bearer token123";
      req.body = {
        name: 'John<script>alert("xss")</script>',
        email: "john@example.com",
      };

      // Apply all security middleware
      securityMiddleware.cors(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      securityMiddleware.csrfProtection(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);

      const inputValidation = securityMiddleware.inputValidation();
      inputValidation(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);

      securityMiddleware.securityHeaders(req, res, next);
      expect(next).toHaveBeenCalledTimes(4);

      securityMiddleware.securityLogger(req, res, next);
      expect(next).toHaveBeenCalledTimes(5);

      // Verify sanitization occurred
      expect(req.body.name).toBe("John");
      expect(req.body.email).toBe("john@example.com");

      // Verify headers were set
      expect(res.header).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "http://localhost:3100"
      );
      expect(res.header).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff"
      );
    });

    it("should block malicious requests at multiple levels", () => {
      // Setup malicious request
      req.method = "POST";
      req.path = "/form-submit";
      req.headers.origin = "http://malicious-site.com";
      req.headers["content-type"] = "text/xml";
      req.body = {
        payload: '<script>alert("xss")</script>',
      };

      // CORS should block first
      securityMiddleware.cors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CORS_ORIGIN_NOT_ALLOWED",
          message: "Origin not allowed by CORS policy",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
