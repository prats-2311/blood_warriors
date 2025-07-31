const bcrypt = require("bcryptjs");
const crypto = require("crypto");

class PasswordService {
  constructor() {
    this.saltRounds = 12; // Minimum 12 rounds as per requirements

    // Password strength requirements
    this.passwordRequirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    };
  }

  /**
   * Hash password using bcrypt with minimum 12 rounds
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    if (typeof password !== "string") {
      throw new Error("Password is required and must be a string");
    }

    if (!password || password.length === 0) {
      throw new Error("Password cannot be empty");
    }

    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Failed to hash password: ${error.message}`);
    }
  }

  /**
   * Compare plain text password with hashed password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if passwords match
   */
  async comparePassword(password, hashedPassword) {
    if (!password || typeof password !== "string") {
      throw new Error("Password is required and must be a string");
    }

    if (!hashedPassword || typeof hashedPassword !== "string") {
      throw new Error("Hashed password is required and must be a string");
    }

    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error(`Failed to compare password: ${error.message}`);
    }
  }

  /**
   * Validate password strength according to industry standards
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateStrength(password) {
    const result = {
      isValid: true,
      errors: [],
      score: 0,
      suggestions: [],
    };

    if (!password || typeof password !== "string") {
      result.isValid = false;
      result.errors.push("Password is required and must be a string");
      return result;
    }

    // Check minimum length
    if (password.length < this.passwordRequirements.minLength) {
      result.isValid = false;
      result.errors.push(
        `Password must be at least ${this.passwordRequirements.minLength} characters long`
      );
    } else {
      result.score += 1;
    }

    // Check maximum length
    if (password.length > this.passwordRequirements.maxLength) {
      result.isValid = false;
      result.errors.push(
        `Password must not exceed ${this.passwordRequirements.maxLength} characters`
      );
    }

    // Check for uppercase letters
    if (this.passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push("Password must contain at least one uppercase letter");
      result.suggestions.push("Add uppercase letters (A-Z)");
    } else if (/[A-Z]/.test(password)) {
      result.score += 1;
    }

    // Check for lowercase letters
    if (this.passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push("Password must contain at least one lowercase letter");
      result.suggestions.push("Add lowercase letters (a-z)");
    } else if (/[a-z]/.test(password)) {
      result.score += 1;
    }

    // Check for numbers
    if (this.passwordRequirements.requireNumbers && !/\d/.test(password)) {
      result.isValid = false;
      result.errors.push("Password must contain at least one number");
      result.suggestions.push("Add numbers (0-9)");
    } else if (/\d/.test(password)) {
      result.score += 1;
    }

    // Check for special characters - using a simpler approach
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    if (this.passwordRequirements.requireSpecialChars && !hasSpecialChar) {
      result.isValid = false;
      result.errors.push(
        "Password must contain at least one special character"
      );
      result.suggestions.push(
        `Add special characters (${this.passwordRequirements.specialChars})`
      );
    } else if (hasSpecialChar) {
      result.score += 1;
    }

    // Additional strength checks
    this._checkCommonPatterns(password, result);
    this._checkRepetitivePatterns(password, result);

    // Calculate strength level
    result.strength = this._calculateStrengthLevel(
      result.score,
      password.length
    );

    return result;
  }

  /**
   * Generate secure password reset token
   * @returns {Object} Token data with token and expiry
   */
  generateResetToken() {
    try {
      // Generate cryptographically secure random token
      const token = crypto.randomBytes(32).toString("hex");

      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Create hash of token for database storage
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      return {
        token, // Send this to user via email
        tokenHash, // Store this in database
        expiresAt,
      };
    } catch (error) {
      throw new Error(`Failed to generate reset token: ${error.message}`);
    }
  }

  /**
   * Verify password reset token
   * @param {string} token - Token from user
   * @param {string} storedTokenHash - Hashed token from database
   * @param {Date} expiresAt - Token expiry date
   * @returns {boolean} True if token is valid
   */
  verifyResetToken(token, storedTokenHash, expiresAt) {
    if (!token || typeof token !== "string") {
      throw new Error("Token is required and must be a string");
    }

    if (!storedTokenHash || typeof storedTokenHash !== "string") {
      throw new Error("Stored token hash is required and must be a string");
    }

    if (!expiresAt || !(expiresAt instanceof Date)) {
      throw new Error("Expiry date is required and must be a Date object");
    }

    // Check if token has expired
    if (new Date() > expiresAt) {
      return false;
    }

    try {
      // Hash the provided token and compare with stored hash
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      return tokenHash === storedTokenHash;
    } catch (error) {
      throw new Error(`Failed to verify reset token: ${error.message}`);
    }
  }

  /**
   * Generate secure random password
   * @param {number} length - Password length (default: 16)
   * @returns {string} Generated password
   */
  generateSecurePassword(length = 16) {
    if (length < this.passwordRequirements.minLength) {
      length = this.passwordRequirements.minLength;
    }

    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialChars = this.passwordRequirements.specialChars;

    let password = "";

    // Ensure at least one character from each required category
    password += this._getRandomChar(uppercase);
    password += this._getRandomChar(lowercase);
    password += this._getRandomChar(numbers);
    password += this._getRandomChar(specialChars);

    // Fill the rest with random characters from all categories
    const allChars = uppercase + lowercase + numbers + specialChars;
    for (let i = password.length; i < length; i++) {
      password += this._getRandomChar(allChars);
    }

    // Shuffle the password to avoid predictable patterns
    return this._shuffleString(password);
  }

  /**
   * Check if password has been compromised (basic implementation)
   * In production, this could integrate with HaveIBeenPwned API
   * @param {string} password - Password to check
   * @returns {Object} Result with isCompromised flag
   */
  checkPasswordCompromise(password) {
    // Basic implementation - check against common passwords
    const commonPasswords = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
      "dragon",
      "master",
      "shadow",
      "superman",
      "michael",
    ];

    const isCompromised = commonPasswords.includes(password.toLowerCase());

    return {
      isCompromised,
      message: isCompromised
        ? "This password is commonly used and may be compromised"
        : "Password appears to be unique",
    };
  }

  /**
   * Get password requirements for frontend validation
   * @returns {Object} Password requirements
   */
  getPasswordRequirements() {
    return { ...this.passwordRequirements };
  }

  // Private helper methods

  /**
   * Check for common password patterns
   * @private
   */
  _checkCommonPatterns(password, result) {
    // Check for common sequences
    const sequences = ["123", "abc", "qwe", "asd", "zxc"];
    for (const seq of sequences) {
      if (password.toLowerCase().includes(seq)) {
        result.suggestions.push('Avoid common sequences like "123" or "abc"');
        break;
      }
    }

    // Check for keyboard patterns
    const keyboardPatterns = ["qwerty", "asdf", "zxcv"];
    for (const pattern of keyboardPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        result.suggestions.push('Avoid keyboard patterns like "qwerty"');
        break;
      }
    }
  }

  /**
   * Check for repetitive patterns
   * @private
   */
  _checkRepetitivePatterns(password, result) {
    // Check for repeated characters (more than 2 in a row)
    if (/(.)\1{2,}/.test(password)) {
      result.suggestions.push(
        "Avoid repeating the same character multiple times"
      );
    }

    // Check for repeated patterns
    const repeatedPattern = /(.{2,})\1+/;
    if (repeatedPattern.test(password)) {
      result.suggestions.push("Avoid repeating patterns in your password");
    }
  }

  /**
   * Calculate password strength level
   * @private
   */
  _calculateStrengthLevel(score, length) {
    let strength = "weak";

    if (score >= 4 && length >= 12) {
      strength = "very-strong";
    } else if (score >= 4 && length >= 10) {
      strength = "strong";
    } else if (score >= 3 && length >= 8) {
      strength = "medium";
    }

    return strength;
  }

  /**
   * Get random character from string
   * @private
   */
  _getRandomChar(str) {
    const randomIndex = crypto.randomInt(0, str.length);
    return str[randomIndex];
  }

  /**
   * Shuffle string characters
   * @private
   */
  _shuffleString(str) {
    const arr = str.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }
}

module.exports = PasswordService;
