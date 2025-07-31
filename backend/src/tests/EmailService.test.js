const EmailService = require("../services/EmailService");

describe("EmailService", () => {
  let emailService;
  const mockUser = {
    email: "test@example.com",
    full_name: "Test User",
  };

  beforeEach(() => {
    emailService = new EmailService();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default values", () => {
      expect(emailService.emailProvider).toBe("console");
      expect(emailService.fromEmail).toBe("noreply@bloodwarriors.com");
      expect(emailService.fromName).toBe("Blood Warriors");
      expect(emailService.baseUrl).toBe("http://localhost:3100");
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email successfully", async () => {
      const token = "reset-token-123";
      const result = await emailService.sendPasswordResetEmail(mockUser, token);

      expect(result.success).toBe(true);
      expect(result.provider).toBe("console");
      expect(result.messageId).toMatch(/^console-\d+$/);
    });

    it("should throw error for missing user", async () => {
      await expect(
        emailService.sendPasswordResetEmail(null, "token")
      ).rejects.toThrow("User with email is required");
    });

    it("should throw error for missing token", async () => {
      await expect(
        emailService.sendPasswordResetEmail(mockUser, null)
      ).rejects.toThrow("Reset token is required");
    });
  });

  describe("sendLoginNotification", () => {
    it("should send login notification successfully", async () => {
      const loginInfo = { ip: "192.168.1.1", userAgent: "Chrome" };
      const result = await emailService.sendLoginNotification(
        mockUser,
        loginInfo
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("console");
    });

    it("should throw error for missing user", async () => {
      await expect(
        emailService.sendLoginNotification(null, {})
      ).rejects.toThrow("User with email is required");
    });

    it("should throw error for missing login info", async () => {
      await expect(
        emailService.sendLoginNotification(mockUser, null)
      ).rejects.toThrow("Login information is required");
    });
  });

  describe("sendSecurityAlert", () => {
    it("should send security alert successfully", async () => {
      const result = await emailService.sendSecurityAlert(
        mockUser,
        "password-changed"
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("console");
    });

    it("should throw error for missing user", async () => {
      await expect(
        emailService.sendSecurityAlert(null, "alert")
      ).rejects.toThrow("User with email is required");
    });

    it("should throw error for missing alert type", async () => {
      await expect(
        emailService.sendSecurityAlert(mockUser, null)
      ).rejects.toThrow("Alert type is required");
    });
  });

  describe("validateEmailFormat", () => {
    it("should validate correct email formats", () => {
      expect(emailService.validateEmailFormat("test@example.com")).toBe(true);
      expect(emailService.validateEmailFormat("user.name@domain.co.uk")).toBe(
        true
      );
    });

    it("should reject invalid email formats", () => {
      expect(emailService.validateEmailFormat("invalid-email")).toBe(false);
      expect(emailService.validateEmailFormat("")).toBe(false);
      expect(emailService.validateEmailFormat(null)).toBe(false);
    });
  });
});
