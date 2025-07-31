const RegistrationController = require("../controllers/RegistrationController");
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
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

describe("RegistrationController", () => {
  let registrationController;
  let mockReq;
  let mockRes;
  let mockSupabase;

  beforeEach(() => {
    registrationController = new RegistrationController();

    mockReq = {
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
    };

    // Get the mocked supabase instance
    mockSupabase = require("../utils/supabase").supabase;

    // Mock console methods
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with required services", () => {
      expect(registrationController.jwtService).toBeInstanceOf(JWTService);
      expect(registrationController.passwordService).toBeInstanceOf(
        PasswordService
      );
      expect(registrationController.emailService).toBeInstanceOf(EmailService);
      expect(registrationController.registrationSchema).toBeDefined();
    });
  });

  describe("register", () => {
    const validRegistrationData = {
      email: "test@example.com",
      password: "StrongPassword123!",
      phone_number: "1234567890",
      full_name: "Test User",
      city: "Test City",
      state: "Test State",
      user_type: "Donor",
      blood_group_id: 1,
    };

    it("should register a new user successfully", async () => {
      mockReq.body = validRegistrationData;

      // Mock database responses
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null, // No existing user
        error: null,
      });

      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce({
          data: {
            user_id: 1,
            email: "test@example.com",
            full_name: "Test User",
            user_type: "Donor",
            is_verified: false,
            created_at: new Date().toISOString(),
          },
          error: null,
        });

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message:
          "Registration successful. Please check your email to verify your account.",
        data: expect.objectContaining({
          user_id: 1,
          email: "test@example.com",
          full_name: "Test User",
          user_type: "Donor",
          is_verified: false,
        }),
      });
    });

    it("should validate required fields", async () => {
      mockReq.body = {
        email: "test@example.com",
        // Missing required fields
      };

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it("should validate email format", async () => {
      mockReq.body = {
        ...validRegistrationData,
        email: "invalid-email",
      };

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "email",
            message: "Please provide a valid email address",
          }),
        ]),
      });
    });

    it("should validate password strength", async () => {
      mockReq.body = {
        ...validRegistrationData,
        password: "weak",
      };

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Password does not meet security requirements",
        errors: expect.any(Array),
        suggestions: expect.any(Array),
      });
    });

    it("should check for existing user", async () => {
      mockReq.body = validRegistrationData;

      // Mock existing user
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: { email: "test@example.com" },
          error: null,
        });

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "An account with this email already exists",
      });
    });

    it("should require date_of_birth for patients", async () => {
      mockReq.body = {
        ...validRegistrationData,
        user_type: "Patient",
        // Missing date_of_birth
      };

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "date_of_birth",
            message: "Date of birth is required for patients",
          }),
        ]),
      });
    });

    it("should handle database errors gracefully", async () => {
      mockReq.body = validRegistrationData;

      // Mock no existing user
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock database error during user creation
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce({
          data: null,
          error: { message: "Database error" },
        });

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Failed to create user account",
      });
    });

    it("should rollback user creation if type-specific record creation fails", async () => {
      mockReq.body = validRegistrationData;

      // Mock no existing user
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock successful user creation
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce({
          data: {
            user_id: 1,
            email: "test@example.com",
            full_name: "Test User",
            user_type: "Donor",
            is_verified: false,
            created_at: new Date().toISOString(),
          },
          error: null,
        });

      // Mock error in donor record creation
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: { message: "Donor creation failed" },
      });

      // Mock successful rollback
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Registration failed during account setup",
      });
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully", async () => {
      mockReq.params = { token: "valid-token" };

      // Mock verification data
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            user_id: 1,
            token_hash: "hashed-token",
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          },
          error: null,
        });

      // Mock user update
      mockSupabase
        .from()
        .update()
        .eq()
        .select()
        .single.mockResolvedValueOnce({
          data: {
            user_id: 1,
            email: "test@example.com",
            is_verified: true,
            is_active: true,
          },
          error: null,
        });

      // Mock token deletion
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await registrationController.verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Email verified successfully. Your account is now active.",
        data: expect.objectContaining({
          user_id: 1,
          email: "test@example.com",
          is_verified: true,
          is_active: true,
        }),
      });
    });

    it("should require verification token", async () => {
      mockReq.params = {};

      await registrationController.verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Verification token is required",
      });
    });

    it("should handle invalid token", async () => {
      mockReq.params = { token: "invalid-token" };

      // Mock no verification data found
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: null,
          error: { message: "Not found" },
        });

      await registrationController.verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Invalid or expired verification token",
      });
    });
  });

  describe("resendVerification", () => {
    it("should resend verification email successfully", async () => {
      mockReq.body = { email: "test@example.com" };

      // Mock user found
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            user_id: 1,
            email: "test@example.com",
            is_verified: false,
          },
          error: null,
        });

      // Mock token deletion
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock token creation
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await registrationController.resendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Verification email sent successfully",
      });
    });

    it("should require email", async () => {
      mockReq.body = {};

      await registrationController.resendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Email is required",
      });
    });

    it("should handle user not found", async () => {
      mockReq.body = { email: "nonexistent@example.com" };

      // Mock user not found
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: null,
          error: { message: "Not found" },
        });

      await registrationController.resendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "User not found",
      });
    });

    it("should handle already verified account", async () => {
      mockReq.body = { email: "test@example.com" };

      // Mock verified user
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            user_id: 1,
            email: "test@example.com",
            is_verified: true,
          },
          error: null,
        });

      await registrationController.resendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Account is already verified",
      });
    });
  });

  describe("checkEmailAvailability", () => {
    it("should return email availability", async () => {
      mockReq.query = { email: "test@example.com" };

      // Mock no existing user
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await registrationController.checkEmailAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: {
          email: "test@example.com",
          available: true,
        },
      });
    });

    it("should return email unavailable", async () => {
      mockReq.query = { email: "existing@example.com" };

      // Mock existing user
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: { email: "existing@example.com" },
          error: null,
        });

      await registrationController.checkEmailAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: {
          email: "existing@example.com",
          available: false,
        },
      });
    });

    it("should require email parameter", async () => {
      mockReq.query = {};

      await registrationController.checkEmailAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Email parameter is required",
      });
    });

    it("should validate email format", async () => {
      mockReq.query = { email: "invalid-email" };

      await registrationController.checkEmailAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Invalid email format",
      });
    });
  });

  describe("error handling", () => {
    it("should handle unexpected errors gracefully", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "StrongPassword123!",
        phone_number: "1234567890",
        full_name: "Test User",
        user_type: "Donor",
        blood_group_id: 1,
      };

      // Mock unexpected error
      mockSupabase.from.mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      await registrationController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Internal server error during registration",
      });
    });
  });
});
