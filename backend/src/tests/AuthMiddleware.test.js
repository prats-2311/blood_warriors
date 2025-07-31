const AuthMiddleware = require("../middleware/AuthMiddleware");
const JWTService = require("../services/JWTService");

// Mock the supabase module
const mockSupabaseQuery = {
  single: jest.fn(),
};

jest.mock("../utils/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => mockSupabaseQuery),
      })),
    })),
  },
}));

describe("AuthMiddleware", () => {
  let authMiddleware;
  let jwtService;
  let req, res, next;

  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
    jwtService = new JWTService();

    // Mock request, response, and next
    req = {
      headers: {},
      ip: "192.168.1.1",
      path: "/api/test",
      user: null,
    };

    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      set: jest.fn(() => res),
      statusCode: 200,
    };

    next = jest.fn();

    // Clear stores
    authMiddleware.rateLimitStore.clear();
    authMiddleware.loginAttemptStore.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockSupabaseQuery.single.mockClear();
  });

  describe("authenticate", () => {
    it("should authenticate valid JWT token successfully", async () => {
      const mockUser = {
        user_id: 123,
        email: "test@example.com",
        full_name: "Test User",
        user_type: "donor",
        is_active: true,
        is_verified: true,
      };

      // Generate valid token
      const token = jwtService.generateAccessToken({
        userId: 123,
        email: "test@example.com",
        userType: "donor",
        isVerified: true,
      });

      req.headers.authorization = `Bearer ${token}`;

      // Mock database response
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      await authMiddleware.authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject request without authorization header", async () => {
      await authMiddleware.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTH_TOKEN_MISSING",
          message: "Authentication token is required",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject invalid token format", async () => {
      req.headers.authorization = "Invalid token";

      await authMiddleware.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTH_TOKEN_MISSING",
          message: "Authentication token is required",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject when user not found in database", async () => {
      const token = jwtService.generateAccessToken({
        userId: 123,
        email: "test@example.com",
        userType: "donor",
      });

      req.headers.authorization = `Bearer ${token}`;

      // Mock database to return no user
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: "User not found" },
      });

      await authMiddleware.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTH_USER_NOT_FOUND",
          message: "User not found",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject inactive user account", async () => {
      const mockUser = {
        user_id: 123,
        email: "test@example.com",
        is_active: false,
      };

      const token = jwtService.generateAccessToken({
        userId: 123,
        email: "test@example.com",
        userType: "donor",
      });

      req.headers.authorization = `Bearer ${token}`;

      mockSupabaseQuery.single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      await authMiddleware.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTH_ACCOUNT_INACTIVE",
          message: "Account is inactive",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("authorize", () => {
    beforeEach(() => {
      req.user = {
        user_id: 123,
        user_type: "donor",
      };
    });

    it("should allow access for authorized role", () => {
      const middleware = authMiddleware.authorize("donor");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow access for multiple authorized roles", () => {
      const middleware = authMiddleware.authorize(["donor", "patient"]);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deny access for unauthorized role", () => {
      const middleware = authMiddleware.authorize("admin");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTH_INSUFFICIENT_PERMISSIONS",
          message: "Insufficient permissions for this resource",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny access when user not authenticated", () => {
      req.user = null;
      const middleware = authMiddleware.authorize("donor");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication required",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("rateLimiter", () => {
    it("should allow requests within rate limit", () => {
      const middleware = authMiddleware.rateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        middleware(req, res, next);
      }

      expect(next).toHaveBeenCalledTimes(3);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          "X-RateLimit-Limit": 5,
          "X-RateLimit-Remaining": expect.any(Number),
        })
      );
    });

    it("should block requests exceeding rate limit", () => {
      const middleware = authMiddleware.rateLimiter({
        maxRequests: 2,
        windowMs: 60000,
      });

      // Make 3 requests (exceeds limit of 2)
      middleware(req, res, next);
      middleware(req, res, next);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later",
          retryAfter: expect.any(Number),
        },
      });
    });
  });

  describe("requireVerification", () => {
    it("should allow verified users", () => {
      req.user = {
        user_id: 123,
        is_verified: true,
      };

      authMiddleware.requireVerification(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should block unverified users", () => {
      req.user = {
        user_id: 123,
        is_verified: false,
      };

      authMiddleware.requireVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTH_EMAIL_NOT_VERIFIED",
          message: "Email verification required",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("helper methods", () => {
    it("should get rate limit status", () => {
      const clientId = "test-client";
      const status = authMiddleware.getRateLimitStatus(clientId);

      expect(status).toEqual({
        requests: 0,
        remaining: 100,
        resetTime: expect.any(Number),
      });
    });

    it("should get login attempt status", () => {
      const clientId = "test-client";
      const status = authMiddleware.getLoginAttemptStatus(clientId);

      expect(status).toEqual({
        attempts: 0,
        isLocked: false,
        lockedUntil: null,
      });
    });
  });
});
