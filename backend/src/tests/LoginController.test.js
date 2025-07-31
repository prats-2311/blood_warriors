const LoginController = require("../controllers/LoginController");
const JWTService = require("../services/JWTService");
const PasswordService = require("../services/PasswordService");
const EmailService = require("../services/EmailService");

// Mock Supabase
jest.mock("../utils/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

describe("LoginController", () => {
  let loginController;
  let mockReq;
  let mockRes;
  let mockSupabase;

  beforeEach(() => {
    loginController = new LoginController();

    mockReq = {
      body: {},
      params: {},
      query: {},
      cookies: {},
      ip: "192.168.1.1",
      get: jest.fn(),
      connection: { remoteAddress: "192.168.1.1" },
    };

    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
      cookie: jest.fn(() => mockRes),
      clearCookie: jest.fn(() => mockRes),
    };

    // Get the mocked supabase instance
    mockSupabase = require("../utils/supabase").supabase;

    // Mock console methods
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});

    // Mock request headers
    mockReq.get.mockImplementation((header) => {
      if (header === "User-Agent") return "Mozilla/5.0 Test Browser";
      if (header === "Authorization") return "Bearer test-token";
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with required services and settings", () => {
      expect(loginController.jwtService).toBeInstanceOf(JWTService);
      expect(loginController.passwordService).toBeInstanceOf(PasswordService);
      expect(loginController.emailService).toBeInstanceOf(EmailService);
      expect(loginController.loginSchema).toBeDefined();
      expect(loginController.MAX_LOGIN_ATTEMPTS).toBe(5);
      expect(loginController.LOCKOUT_DURATION).toBe(30 * 60 * 1000);
    });
  });

  describe("login", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "TestPassword123!",
      remember_me: false,
    };

    const mockUserData = {
      user_id: 1,
      email: "test@example.com",
      password_hash: "$2b$12$hashedpassword",
      full_name: "Test User",
      user_type: "Donor",
      is_active: true,
      is_verified: true,
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: null,
    };

    it("should login user successfully", async () => {
      mockReq.body = validLoginData;

      // Mock user found
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      // Mock password comparison
      jest
        .spyOn(loginController.passwordService, "comparePassword")
        .mockResolvedValueOnce(true);

      // Mock user update
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock token generation
      jest
        .spyOn(loginController.jwtService, "generateTokenPair")
        .mockReturnValueOnce({
          accessToken: "access-token",
          refreshToken: "refresh-token",
          refreshTokenId: "token-id",
          refreshTokenExpiresAt: new Date(),
          accessTokenExpiresIn: 900,
          refreshTokenExpiresIn: 604800,
        });

      // Mock refresh token storage
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock profile data
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            blood_group_id: 1,
            donation_count: 5,
            bloodgroups: { group_name: "O+" },
          },
          error: null,
        });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Login successful",
        data: expect.objectContaining({
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 900,
          token_type: "Bearer",
          user: expect.objectContaining({
            user_id: 1,
            email: "test@example.com",
            user_type: "Donor",
          }),
        }),
      });
    });

    it("should validate required fields", async () => {
      mockReq.body = {
        email: "test@example.com",
        // Missing password
      };

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: "Password is required",
          }),
        ]),
      });
    });

    it("should handle user not found", async () => {
      mockReq.body = validLoginData;

      // Mock user not found
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: null,
          error: { message: "Not found" },
        });

      // Mock login attempt logging
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Invalid email or password",
      });
    });

    it("should handle locked account", async () => {
      mockReq.body = validLoginData;

      const lockedUser = {
        ...mockUserData,
        locked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      };

      // Mock locked user
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: lockedUser,
        error: null,
      });

      // Mock login attempt logging
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(423);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: expect.stringContaining("Account is temporarily locked"),
        locked_until: lockedUser.locked_until,
      });
    });

    it("should handle inactive account", async () => {
      mockReq.body = validLoginData;

      const inactiveUser = {
        ...mockUserData,
        is_active: false,
      };

      // Mock inactive user
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: inactiveUser,
        error: null,
      });

      // Mock login attempt logging
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Account is not active. Please verify your email address.",
        requires_verification: true,
      });
    });

    it("should handle invalid password and increment failed attempts", async () => {
      mockReq.body = validLoginData;

      // Mock user found
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      // Mock password comparison failure
      jest
        .spyOn(loginController.passwordService, "comparePassword")
        .mockResolvedValueOnce(false);

      // Mock user update
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock login attempt logging
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Invalid email or password",
        attempts_remaining: 4,
      });
    });

    it("should lock account after max failed attempts", async () => {
      mockReq.body = validLoginData;

      const userWithFailedAttempts = {
        ...mockUserData,
        failed_login_attempts: 4, // One more will trigger lockout
      };

      // Mock user found
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: userWithFailedAttempts,
        error: null,
      });

      // Mock password comparison failure
      jest
        .spyOn(loginController.passwordService, "comparePassword")
        .mockResolvedValueOnce(false);

      // Mock user update
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock login attempt logging
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(423);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: expect.stringContaining("Account has been temporarily locked"),
        locked_until: expect.any(String),
      });
    });

    it("should set cookie when remember_me is true", async () => {
      mockReq.body = { ...validLoginData, remember_me: true };

      // Mock successful login flow
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      jest
        .spyOn(loginController.passwordService, "comparePassword")
        .mockResolvedValueOnce(true);

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      jest
        .spyOn(loginController.jwtService, "generateTokenPair")
        .mockReturnValueOnce({
          accessToken: "access-token",
          refreshToken: "refresh-token",
          refreshTokenId: "token-id",
          refreshTokenExpiresAt: new Date(),
          accessTokenExpiresIn: 900,
          refreshTokenExpiresIn: 604800,
        });

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "refresh_token",
        "refresh-token",
        {
          httpOnly: true,
          secure: false, // NODE_ENV is not production in tests
          sameSite: "strict",
          maxAge: 604800000,
        }
      );
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      mockReq.body = { refresh_token: "refresh-token" };

      // Mock token verification
      jest
        .spyOn(loginController.jwtService, "extractTokenFromHeader")
        .mockReturnValueOnce("access-token");

      jest
        .spyOn(loginController.jwtService, "verifyRefreshToken")
        .mockReturnValueOnce({ tokenId: "token-id", sub: "1" });

      // Mock token deletion
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock token revocation
      jest
        .spyOn(loginController.jwtService, "revokeToken")
        .mockImplementation(() => {});

      await loginController.logout(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Logout successful",
      });
      expect(mockRes.clearCookie).toHaveBeenCalledWith("refresh_token");
    });

    it("should handle logout without tokens", async () => {
      mockReq.body = {};
      mockReq.cookies = {};

      jest
        .spyOn(loginController.jwtService, "extractTokenFromHeader")
        .mockReturnValueOnce(null);

      await loginController.logout(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Logout successful",
      });
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      mockReq.body = { refresh_token: "refresh-token" };

      // Mock token verification
      jest
        .spyOn(loginController.jwtService, "verifyRefreshToken")
        .mockReturnValueOnce({ tokenId: "token-id", sub: "1" });

      // Mock token data from database
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            token_id: "token-id",
            user_id: 1,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          },
          error: null,
        });

      // Mock user data
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            user_id: 1,
            email: "test@example.com",
            user_type: "Donor",
            is_verified: true,
            is_active: true,
          },
          error: null,
        });

      // Mock new token generation
      jest
        .spyOn(loginController.jwtService, "generateTokenPair")
        .mockReturnValueOnce({
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          refreshTokenId: "new-token-id",
          refreshTokenExpiresAt: new Date(),
          accessTokenExpiresIn: 900,
          refreshTokenExpiresIn: 604800,
        });

      // Mock token revocation and storage
      jest
        .spyOn(loginController.jwtService, "revokeToken")
        .mockImplementation(() => {});

      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Token refreshed successfully",
        data: {
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_in: 900,
          token_type: "Bearer",
        },
      });
    });

    it("should require refresh token", async () => {
      mockReq.body = {};
      mockReq.cookies = {};

      await loginController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Refresh token is required",
      });
    });

    it("should handle invalid refresh token", async () => {
      mockReq.body = { refresh_token: "invalid-token" };

      // Mock token verification failure
      jest
        .spyOn(loginController.jwtService, "verifyRefreshToken")
        .mockImplementation(() => {
          throw new Error("Invalid token");
        });

      await loginController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Invalid or expired refresh token",
      });
    });

    it("should handle expired refresh token", async () => {
      mockReq.body = { refresh_token: "expired-token" };

      jest
        .spyOn(loginController.jwtService, "verifyRefreshToken")
        .mockReturnValueOnce({ tokenId: "token-id", sub: "1" });

      // Mock expired token data
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            token_id: "token-id",
            user_id: 1,
            expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Expired
          },
          error: null,
        });

      // Mock token cleanup
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await loginController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Refresh token has expired",
      });
    });
  });

  describe("error handling", () => {
    it("should handle unexpected errors gracefully", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password",
      };

      // Mock unexpected error
      mockSupabase.from.mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      await loginController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Internal server error during login",
      });
    });
  });
});
