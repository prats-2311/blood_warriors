class EmailService {
  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || "console";
    this.fromEmail = process.env.FROM_EMAIL || "noreply@bloodwarriors.com";
    this.fromName = process.env.FROM_NAME || "Blood Warriors";
    this.baseUrl = process.env.FRONTEND_URL || "http://localhost:3100";
  }

  async sendPasswordResetEmail(user, token) {
    if (!user || !user.email) {
      throw new Error("User with email is required");
    }
    if (!token) {
      throw new Error("Reset token is required");
    }

    const resetUrl = `${this.baseUrl}/auth/reset-password?token=${token}`;
    console.log(
      `[EMAIL] Password reset email sent to ${user.email} with URL: ${resetUrl}`
    );

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: "console",
    };
  }

  async sendLoginNotification(user, loginInfo) {
    if (!user || !user.email) {
      throw new Error("User with email is required");
    }
    if (!loginInfo) {
      throw new Error("Login information is required");
    }

    console.log(
      `[EMAIL] Login notification sent to ${user.email} for login from ${
        loginInfo.ip || "unknown IP"
      }`
    );

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: "console",
    };
  }

  async sendSecurityAlert(user, alertType, alertData = {}) {
    if (!user || !user.email) {
      throw new Error("User with email is required");
    }
    if (!alertType) {
      throw new Error("Alert type is required");
    }

    console.log(
      `[EMAIL] Security alert sent to ${user.email} for ${alertType}`
    );

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: "console",
    };
  }

  async sendVerificationEmail(user, token) {
    if (!user || !user.email) {
      throw new Error("User with email is required");
    }
    if (!token) {
      throw new Error("Verification token is required");
    }

    const verificationUrl = `${this.baseUrl}/auth/verify/${token}`;
    console.log(
      `[EMAIL] Verification email sent to ${user.email} with URL: ${verificationUrl}`
    );

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: "console",
    };
  }

  validateEmailFormat(email) {
    if (!email || typeof email !== "string") {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = EmailService;
