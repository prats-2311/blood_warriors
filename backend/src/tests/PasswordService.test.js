const PasswordService = require("../services/PasswordService");
const bcrypt = require("bcryptjs");

describe("PasswordService", () => {
  let passwordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe("constructor", () => {
    it("should initialize with correct salt rounds and requirements", () => {
      expect(passwordService.saltRounds).toBe(12);
      expect(passwordService.passwordRequirements).toEqual({
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
      });
    });
  });

  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await passwordService.hashPassword(password);

      expect(typeof hashedPassword).toBe("string");
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should throw error for invalid password input", async () => {
      await expect(passwordService.hashPassword()).rejects.toThrow(
        "Password is required and must be a string"
      );
      await expect(passwordService.hashPassword(null)).rejects.toThrow(
        "Password is required and must be a string"
      );
      await expect(passwordService.hashPassword(123)).rejects.toThrow(
        "Password is required and must be a string"
      );
      await expect(passwordService.hashPassword("")).rejects.toThrow(
        "Password cannot be empty"
      );
    });

    it("should use minimum 12 salt rounds", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await passwordService.hashPassword(password);

      // bcrypt hash format: $2a$rounds$salt+hash
      const rounds = parseInt(hashedPassword.split("$")[2]);
      expect(rounds).toBeGreaterThanOrEqual(12);
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching passwords", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await passwordService.hashPassword(password);

      const isMatch = await passwordService.comparePassword(
        password,
        hashedPassword
      );
      expect(isMatch).toBe(true);
    });

    it("should return false for non-matching passwords", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hashedPassword = await passwordService.hashPassword(password);

      const isMatch = await passwordService.comparePassword(
        wrongPassword,
        hashedPassword
      );
      expect(isMatch).toBe(false);
    });

    it("should throw error for invalid inputs", async () => {
      const hashedPassword = await passwordService.hashPassword(
        "TestPassword123!"
      );

      await expect(passwordService.comparePassword()).rejects.toThrow(
        "Password is required and must be a string"
      );
      await expect(
        passwordService.comparePassword(null, hashedPassword)
      ).rejects.toThrow("Password is required and must be a string");
      await expect(
        passwordService.comparePassword(123, hashedPassword)
      ).rejects.toThrow("Password is required and must be a string");

      await expect(passwordService.comparePassword("password")).rejects.toThrow(
        "Hashed password is required and must be a string"
      );
      await expect(
        passwordService.comparePassword("password", null)
      ).rejects.toThrow("Hashed password is required and must be a string");
      await expect(
        passwordService.comparePassword("password", 123)
      ).rejects.toThrow("Hashed password is required and must be a string");
    });
  });

  describe("validateStrength", () => {
    it("should validate strong password correctly", () => {
      const strongPassword = "StrongPass123!";
      const result = passwordService.validateStrength(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(3);
      expect(["strong", "very-strong"]).toContain(result.strength);
    });

    it("should reject password that is too short", () => {
      const shortPassword = "Abc1!";
      const result = passwordService.validateStrength(shortPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
    });

    it("should reject password without uppercase letters", () => {
      const password = "lowercase123!";
      const result = passwordService.validateStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter"
      );
      expect(result.suggestions).toContain("Add uppercase letters (A-Z)");
    });

    it("should reject password without lowercase letters", () => {
      const password = "UPPERCASE123!";
      const result = passwordService.validateStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter"
      );
      expect(result.suggestions).toContain("Add lowercase letters (a-z)");
    });

    it("should reject password without numbers", () => {
      const password = "NoNumbers!";
      const result = passwordService.validateStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number"
      );
      expect(result.suggestions).toContain("Add numbers (0-9)");
    });

    it("should reject password without special characters", () => {
      const password = "NoSpecialChars123";
      const result = passwordService.validateStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one special character"
      );
    });

    it("should reject password that is too long", () => {
      const longPassword = "A".repeat(129) + "b1!";
      const result = passwordService.validateStrength(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must not exceed 128 characters"
      );
    });

    it("should handle invalid input", () => {
      const result1 = passwordService.validateStrength();
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain(
        "Password is required and must be a string"
      );

      const result2 = passwordService.validateStrength(null);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain(
        "Password is required and must be a string"
      );

      const result3 = passwordService.validateStrength(123);
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain(
        "Password is required and must be a string"
      );
    });

    it("should detect common sequences", () => {
      const password = "Password123!";
      const result = passwordService.validateStrength(password);

      expect(result.suggestions).toContain(
        'Avoid common sequences like "123" or "abc"'
      );
    });

    it("should detect keyboard patterns", () => {
      const password = "Qwerty123!";
      const result = passwordService.validateStrength(password);

      expect(result.suggestions).toContain(
        'Avoid keyboard patterns like "qwerty"'
      );
    });

    it("should detect repeated characters", () => {
      const password = "Passsword123!";
      const result = passwordService.validateStrength(password);

      expect(result.suggestions).toContain(
        "Avoid repeating the same character multiple times"
      );
    });

    it("should calculate different strength levels", () => {
      const weakPassword = "weak";
      const mediumPassword = "Medium1!";
      const strongPassword = "StrongPass1!";
      const veryStrongPassword = "VeryStrongPassword1!";

      expect(passwordService.validateStrength(weakPassword).strength).toBe(
        "weak"
      );
      expect(passwordService.validateStrength(mediumPassword).strength).toBe(
        "medium"
      );
      expect(["strong", "very-strong"]).toContain(
        passwordService.validateStrength(strongPassword).strength
      );
      expect(
        passwordService.validateStrength(veryStrongPassword).strength
      ).toBe("very-strong");
    });
  });

  describe("generateResetToken", () => {
    it("should generate reset token with all required properties", () => {
      const result = passwordService.generateResetToken();

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("tokenHash");
      expect(result).toHaveProperty("expiresAt");

      expect(typeof result.token).toBe("string");
      expect(typeof result.tokenHash).toBe("string");
      expect(result.expiresAt).toBeInstanceOf(Date);

      expect(result.token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(result.tokenHash).toHaveLength(64); // SHA256 = 64 hex chars
    });

    it("should generate unique tokens", () => {
      const result1 = passwordService.generateResetToken();
      const result2 = passwordService.generateResetToken();

      expect(result1.token).not.toBe(result2.token);
      expect(result1.tokenHash).not.toBe(result2.tokenHash);
    });

    it("should set expiry to 1 hour from now", () => {
      const before = new Date();
      const result = passwordService.generateResetToken();
      const after = new Date();

      const expectedExpiry = new Date(before.getTime() + 60 * 60 * 1000);
      const maxExpectedExpiry = new Date(after.getTime() + 60 * 60 * 1000);

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedExpiry.getTime()
      );
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
        maxExpectedExpiry.getTime()
      );
    });
  });

  describe("verifyResetToken", () => {
    it("should verify valid token successfully", () => {
      const tokenData = passwordService.generateResetToken();
      const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const isValid = passwordService.verifyResetToken(
        tokenData.token,
        tokenData.tokenHash,
        futureDate
      );

      expect(isValid).toBe(true);
    });

    it("should reject expired token", () => {
      const tokenData = passwordService.generateResetToken();
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago

      const isValid = passwordService.verifyResetToken(
        tokenData.token,
        tokenData.tokenHash,
        pastDate
      );

      expect(isValid).toBe(false);
    });

    it("should reject invalid token", () => {
      const tokenData = passwordService.generateResetToken();
      const futureDate = new Date(Date.now() + 30 * 60 * 1000);

      const isValid = passwordService.verifyResetToken(
        "invalid-token",
        tokenData.tokenHash,
        futureDate
      );

      expect(isValid).toBe(false);
    });

    it("should throw error for invalid inputs", () => {
      const tokenData = passwordService.generateResetToken();
      const futureDate = new Date(Date.now() + 30 * 60 * 1000);

      expect(() => passwordService.verifyResetToken()).toThrow(
        "Token is required and must be a string"
      );
      expect(() =>
        passwordService.verifyResetToken(null, tokenData.tokenHash, futureDate)
      ).toThrow("Token is required and must be a string");
      expect(() =>
        passwordService.verifyResetToken(123, tokenData.tokenHash, futureDate)
      ).toThrow("Token is required and must be a string");

      expect(() => passwordService.verifyResetToken(tokenData.token)).toThrow(
        "Stored token hash is required and must be a string"
      );
      expect(() =>
        passwordService.verifyResetToken(tokenData.token, null, futureDate)
      ).toThrow("Stored token hash is required and must be a string");
      expect(() =>
        passwordService.verifyResetToken(tokenData.token, 123, futureDate)
      ).toThrow("Stored token hash is required and must be a string");

      expect(() =>
        passwordService.verifyResetToken(tokenData.token, tokenData.tokenHash)
      ).toThrow("Expiry date is required and must be a Date object");
      expect(() =>
        passwordService.verifyResetToken(
          tokenData.token,
          tokenData.tokenHash,
          null
        )
      ).toThrow("Expiry date is required and must be a Date object");
      expect(() =>
        passwordService.verifyResetToken(
          tokenData.token,
          tokenData.tokenHash,
          "invalid-date"
        )
      ).toThrow("Expiry date is required and must be a Date object");
    });
  });

  describe("generateSecurePassword", () => {
    it("should generate password with default length", () => {
      const password = passwordService.generateSecurePassword();

      expect(password).toHaveLength(16);
      expect(typeof password).toBe("string");
    });

    it("should generate password with custom length", () => {
      const password = passwordService.generateSecurePassword(20);

      expect(password).toHaveLength(20);
    });

    it("should enforce minimum length", () => {
      const password = passwordService.generateSecurePassword(4); // Less than minimum 8

      expect(password.length).toBeGreaterThanOrEqual(8);
    });

    it("should generate password that meets all requirements", () => {
      const password = passwordService.generateSecurePassword();
      const validation = passwordService.validateStrength(password);

      expect(validation.isValid).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true); // Has uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Has lowercase
      expect(/\d/.test(password)).toBe(true); // Has numbers
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true); // Has special chars
    });

    it("should generate unique passwords", () => {
      const password1 = passwordService.generateSecurePassword();
      const password2 = passwordService.generateSecurePassword();

      expect(password1).not.toBe(password2);
    });
  });

  describe("checkPasswordCompromise", () => {
    it("should detect common passwords", () => {
      const result = passwordService.checkPasswordCompromise("password");

      expect(result.isCompromised).toBe(true);
      expect(result.message).toBe(
        "This password is commonly used and may be compromised"
      );
    });

    it("should accept unique passwords", () => {
      const result =
        passwordService.checkPasswordCompromise("UniquePassword123!");

      expect(result.isCompromised).toBe(false);
      expect(result.message).toBe("Password appears to be unique");
    });

    it("should be case insensitive for common passwords", () => {
      const result = passwordService.checkPasswordCompromise("PASSWORD");

      expect(result.isCompromised).toBe(true);
    });
  });

  describe("getPasswordRequirements", () => {
    it("should return password requirements object", () => {
      const requirements = passwordService.getPasswordRequirements();

      expect(requirements).toEqual({
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
      });
    });

    it("should return a copy of requirements (not reference)", () => {
      const requirements = passwordService.getPasswordRequirements();
      requirements.minLength = 10;

      expect(passwordService.passwordRequirements.minLength).toBe(8);
    });
  });

  describe("integration tests", () => {
    it("should work with real bcrypt operations", async () => {
      const password = "IntegrationTest123!";

      // Hash password
      const hashedPassword = await passwordService.hashPassword(password);

      // Verify it's a valid bcrypt hash
      expect(hashedPassword.startsWith("$2")).toBe(true);

      // Compare passwords
      const isMatch = await passwordService.comparePassword(
        password,
        hashedPassword
      );
      expect(isMatch).toBe(true);

      // Validate strength
      const validation = passwordService.validateStrength(password);
      expect(validation.isValid).toBe(true);
    });

    it("should handle complete password reset flow", () => {
      // Generate reset token
      const tokenData = passwordService.generateResetToken();

      // Verify token is valid
      const isValid = passwordService.verifyResetToken(
        tokenData.token,
        tokenData.tokenHash,
        tokenData.expiresAt
      );
      expect(isValid).toBe(true);

      // Generate new secure password
      const newPassword = passwordService.generateSecurePassword();
      const validation = passwordService.validateStrength(newPassword);
      expect(validation.isValid).toBe(true);
    });
  });
});
