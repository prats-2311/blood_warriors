const PasswordService = require("../services/PasswordService");
const EmailService = require("../services/EmailService");
const JWTService = require("../services/JWTService");
const { supabase } = require("../utils/supabase");
const Joi = require("joi");

class PasswordController {
  constructor() {
    this.passwordService = new PasswordService();
    this.emailService = new EmailService();
    this.jwtService = new JWTService();

    // Validation schemas
    this.forgotPasswordSchema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
    });

    this.resetPasswordSchema = Joi.object({
      token: Joi.string().required().messages({
        "any.required": "Reset token is required",
      }),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "New password is required",
      }),
      confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Password confirmation does not match",
        "any.required": "Password confirmation is required",
      }),
    });

    this.changePasswordSchema = Joi.object({
      currentPassword: Joi.string().required().messages({
        "any.required": "Current password is required",
      }),
      newPassword: Joi.string().min(8).required().messages({
        "string.min": "New password must be at least 8 characters long",
        "any.required": "New password is required",
      }),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
        "any.only": "Password confirmation does not match",
        "any.required": "Password confirmation is required",
      }),
    });
  }

  /**
   * Initiate forgot password process
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async forgotPassword(req, res) {
    try {
      // Validate request
      const { error, value } = this.forgotPasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.details.map((detail) => ({
            field: detail.path[0],
            message: detail.message,
          })),
        });
      }

      const { email } = value;
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id, email, full_name, is_active")
        .eq("email", email.toLowerCase())
        .single();

      // Always return success to prevent email enumeration
      const successResponse = {
        status: "success",
        message: "If an account with this email exists, a password reset link has been sent.",
      };

      if (userError || !userData) {
        // Log the attempt for security monitoring
        console.log(`Password reset attempted for non-existent email: ${email} from IP: ${clientIP}`);
        return res.status(200).json(successResponse);
      }

      if (!userData.is_active) {
        // Log the attempt for security monitoring
        console.log(`Password reset attempted for inactive account: ${email} from IP: ${clientIP}`);
        return res.status(200).json(successResponse);
      }

      // Generate reset token
      const resetToken = this.passwordService.generateResetToken();

      // Delete any existing password reset tokens for this user
      await supabase
        .from("password_resets")
        .delete()
        .eq("user_id", userData.user_id);

      // Store reset token in database
      const { error: resetError } = await supabase
        .from("password_resets")
        .insert({
          user_id: userData.user_id,
          token_hash: resetToken.tokenHash,
          expires_at: resetToken.expiresAt,
          created_at: new Date().toISOString(),
          ip_address: clientIP,
        });

      if (resetError) {
        console.error("Failed to store password reset token:", resetError);
        return res.status(500).json({
          status: "error",
          message: "Failed to initiate password reset",
        });
      }

      // Send password reset email
      try {
        await this.emailService.sendPasswordResetEmail(userData, resetToken.token);
        
        // Log successful password reset request
        await this._logPasswordResetAttempt(
          userData.user_id,
          email,
          clientIP,
          req.get("User-Agent") || "unknown",
          true,
          "Password reset email sent"
        );
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        // Don't fail the request if email fails, but log it
        await this._logPasswordResetAttempt(
          userData.user_id,
          email,
          clientIP,
          req.get("User-Agent") || "unknown",
          false,
          "Email sending failed"
        );
      }

      res.status(200).json(successResponse);
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }

  /**
   * Reset password using token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetPassword(req, res) {
    try {
      // Validate request
      const { error, value } = this.resetPasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.details.map((detail) => ({
            field: detail.path[0],
            message: detail.message,
          })),
        });
      }

      const { token, password } = value;
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";

      // Validate password strength
      const passwordValidation = this.passwordService.validateStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors,
          suggestions: passwordValidation.suggestions,
        });
      }

      // Find reset token by hashing the provided token
      const crypto = require("crypto");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const { data: resetData, error: resetError } = await supabase
        .from("password_resets")
        .select("*")
        .eq("token_hash", tokenHash)
        .single();

      if (resetError || !resetData) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired reset token",
        });
      }

      // Verify token
      const isValidToken = this.passwordService.verifyResetToken(
        token,
        resetData.token_hash,
        new Date(resetData.expires_at)
      );

      if (!isValidToken) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired reset token",
        });
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id, email, full_name, is_active")
        .eq("user_id", resetData.user_id)
        .single();

      if (userError || !userData || !userData.is_active) {
        return res.status(400).json({
          status: "error",
          message: "User account not found or inactive",
        });
      }

      // Hash new password
      const hashedPassword = await this.passwordService.hashPassword(password);

      // Update password and reset security fields
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: hashedPassword,
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user_id);

      if (updateError) {
        console.error("Failed to update password:", updateError);
        return res.status(500).json({
          status: "error",
          message: "Failed to reset password",
        });
      }

      // Delete the used reset token
      await supabase
        .from("password_resets")
        .delete()
        .eq("user_id", userData.user_id);

      // Revoke all existing refresh tokens for security
      await supabase
        .from("refresh_tokens")
        .delete()
        .eq("user_id", userData.user_id);

      // Send security notification email
      try {
        await this.emailService.sendSecurityAlert(userData, "password_reset", {
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error("Failed to send security alert email:", emailError);
      }

      // Log successful password reset
      await this._logPasswordResetAttempt(
        userData.user_id,
        userData.email,
        clientIP,
        req.get("User-Agent") || "unknown",
        true,
        "Password reset successful"
      );

      res.status(200).json({
        status: "success",
        message: "Password has been reset successfully. Please log in with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }

  /**
   * Change password for authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async changePassword(req, res) {
    try {
      // Validate request
      const { error, value } = this.changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.details.map((detail) => ({
            field: detail.path[0],
            message: detail.message,
          })),
        });
      }

      const { currentPassword, newPassword } = value;
      const userId = req.user?.user_id;
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id, email, full_name, password_hash, is_active")
        .eq("user_id", userId)
        .single();

      if (userError || !userData || !userData.is_active) {
        return res.status(404).json({
          status: "error",
          message: "User account not found or inactive",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await this.passwordService.comparePassword(
        currentPassword,
        userData.password_hash
      );

      if (!isCurrentPasswordValid) {
        // Log failed password change attempt
        await this._logPasswordChangeAttempt(
          userData.user_id,
          userData.email,
          clientIP,
          req.get("User-Agent") || "unknown",
          false,
          "Invalid current password"
        );

        return res.status(400).json({
          status: "error",
          message: "Current password is incorrect",
        });
      }

      // Validate new password strength
      const passwordValidation = this.passwordService.validateStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: "New password does not meet security requirements",
          errors: passwordValidation.errors,
          suggestions: passwordValidation.suggestions,
        });
      }

      // Check if new password is different from current
      const isSamePassword = await this.passwordService.comparePassword(
        newPassword,
        userData.password_hash
      );

      if (isSamePassword) {
        return res.status(400).json({
          status: "error",
          message: "New password must be different from current password",
        });
      }

      // Hash new password
      const hashedPassword = await this.passwordService.hashPassword(newPassword);

      // Update password
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user_id);

      if (updateError) {
        console.error("Failed to update password:", updateError);
        return res.status(500).json({
          status: "error",
          message: "Failed to change password",
        });
      }

      // Revoke all existing refresh tokens for security
      await supabase
        .from("refresh_tokens")
        .delete()
        .eq("user_id", userData.user_id);

      // Send security notification email
      try {
        await this.emailService.sendSecurityAlert(userData, "password_change", {
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error("Failed to send security alert email:", emailError);
      }

      // Log successful password change
      await this._logPasswordChangeAttempt(
        userData.user_id,
        userData.email,
        clientIP,
        req.get("User-Agent") || "unknown",
        true,
        "Password changed successfully"
      );

      res.status(200).json({
        status: "success",
        message: "Password has been changed successfully. Please log in again with your new password.",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }

  /**
   * Log password reset attempt
   * @private
   */
  async _logPasswordResetAttempt(userId, email, ip, userAgent, success, details) {
    try {
      await supabase.from("login_attempts").insert({
        user_id: userId,
        email: email,
        ip_address: ip,
        user_agent: userAgent,
        success: success,
        attempt_type: "password_reset",
        details: details,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log password reset attempt:", error);
    }
  }

  /**
   * Log password change attempt
   * @private
   */
  async _logPasswordChangeAttempt(userId, email, ip, userAgent, success, details) {
    try {
      await supabase.from("login_attempts").insert({
        user_id: userId,
        email: email,
        ip_address: ip,
        user_agent: userAgent,
        success: success,
        attempt_type: "password_change",
        details: details,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log password change attempt:", error);
    }
  }
}

module.exports = PasswordController;
