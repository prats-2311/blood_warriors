const JWTService = require("../services/JWTService");
const PasswordService = require("../services/PasswordService");
const EmailService = require("../services/EmailService");
const { supabase } = require("../utils/supabase");
const Joi = require("joi");

class LoginController {
  constructor() {
    this.jwtService = new JWTService();
    this.passwordService = new PasswordService();
    this.emailService = new EmailService();

    // Login validation schema
    this.loginSchema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
      password: Joi.string().required().messages({
        "any.required": "Password is required",
      }),
      remember_me: Joi.boolean().optional().default(false),
    });

    // Account lockout settings
    this.MAX_LOGIN_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  /**
   * Authenticate user and generate JWT tokens
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      // Validate request data
      const { error, value } = this.loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }

      const { email, password, remember_me } = value;
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      // Fix: Handle case where userData is an array instead of single object
      // This happens because Supabase sometimes returns arrays even with .single()
      let user = userData;
      if (Array.isArray(userData) && userData.length > 0) {
        user = userData[0];
      }

      if (userError || !user) {
        // Log failed login attempt
        await this._logLoginAttempt(
          null,
          email,
          clientIP,
          userAgent,
          false,
          "User not found"
        );

        return res.status(401).json({
          status: "error",
          message: "Invalid email or password",
        });
      }

      // Check if account is locked
      if (
        user.locked_until &&
        new Date(user.locked_until) > new Date()
      ) {
        const lockoutRemaining = Math.ceil(
          (new Date(user.locked_until) - new Date()) / 1000 / 60
        );

        await this._logLoginAttempt(
          user.user_id,
          email,
          clientIP,
          userAgent,
          false,
          "Account locked"
        );

        return res.status(423).json({
          status: "error",
          message: `Account is temporarily locked. Try again in ${lockoutRemaining} minutes.`,
          locked_until: user.locked_until,
        });
      }

      // MVP: Skip account activation check for testing
      // All accounts are considered active for MVP



      // Verify password
      const isPasswordValid = await this.passwordService.comparePassword(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        // Increment failed login attempts
        const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
        let updateData = {
          failed_login_attempts: newFailedAttempts,
          updated_at: new Date().toISOString(),
        };

        // Lock account if max attempts reached
        if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          updateData.locked_until = new Date(
            Date.now() + this.LOCKOUT_DURATION
          ).toISOString();
        }

        await supabase
          .from("users")
          .update(updateData)
          .eq("user_id", user.user_id);

        await this._logLoginAttempt(
          user.user_id,
          email,
          clientIP,
          userAgent,
          false,
          "Invalid password"
        );

        if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          // Send security alert email
          try {
            await this.emailService.sendSecurityAlert(
              user,
              "account-locked",
              {
                ip: clientIP,
                userAgent,
                timestamp: new Date().toLocaleString(),
              }
            );
          } catch (emailError) {
            console.warn(
              "Failed to send security alert email:",
              emailError.message
            );
          }

          return res.status(423).json({
            status: "error",
            message:
              "Account has been temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.",
            locked_until: updateData.locked_until,
          });
        }

        return res.status(401).json({
          status: "error",
          message: "Invalid email or password",
          attempts_remaining: this.MAX_LOGIN_ATTEMPTS - newFailedAttempts,
        });
      }

      // Successful login - reset failed attempts and unlock account
      await supabase
        .from("users")
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.user_id);

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.user_id,
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified,
      };

      const tokens = this.jwtService.generateTokenPair(tokenPayload);

      // Store refresh token in database
      const crypto = require("crypto");
      const tokenHash = crypto.createHash("sha256").update(tokens.refreshToken).digest("hex");

      const { error: refreshTokenError } = await supabase
        .from("refresh_tokens")
        .insert({
          user_id: user.user_id,
          token_id: tokens.refreshTokenId,
          token_hash: tokenHash,
          expires_at: tokens.refreshTokenExpiresAt,
          created_at: new Date().toISOString(),
          ip_address: clientIP,
          user_agent: userAgent,
        });

      if (refreshTokenError) {
        console.error("Failed to store refresh token:", refreshTokenError);
        return res.status(500).json({
          status: "error",
          message: "Login failed due to token storage error",
        });
      }

      // Get complete user profile
      const userProfile = await this._getUserProfile(user);

      // Log successful login
      await this._logLoginAttempt(
        user.user_id,
        email,
        clientIP,
        userAgent,
        true,
        "Login successful"
      );

      // Send login notification email (if enabled)
      try {
        await this.emailService.sendLoginNotification(user, {
          ip: clientIP,
          userAgent,
          timestamp: new Date().toLocaleString(),
          location: "Unknown", // Could be enhanced with IP geolocation
        });
      } catch (emailError) {
        console.warn(
          "Failed to send login notification email:",
          emailError.message
        );
      }

      // Set secure cookie for refresh token if remember_me is true
      if (remember_me) {
        res.cookie("refresh_token", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: tokens.refreshTokenExpiresIn * 1000,
        });
      }

      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
          access_token: tokens.accessToken,
          refresh_token: remember_me ? undefined : tokens.refreshToken, // Don't send in response if using cookie
          expires_in: tokens.accessTokenExpiresIn,
          token_type: "Bearer",
          user: userProfile,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during login",
      });
    }
  }

  /**
   * Logout user and revoke tokens
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const authHeader = req.get("Authorization");
      const refreshToken = req.body.refresh_token || req.cookies.refresh_token;

      // Extract access token
      const accessToken = this.jwtService.extractTokenFromHeader(authHeader);

      if (accessToken) {
        // Revoke access token
        this.jwtService.revokeToken(accessToken);
      }

      if (refreshToken) {
        try {
          // Verify and decode refresh token to get token ID
          const decoded = this.jwtService.verifyRefreshToken(refreshToken);

          // Remove refresh token from database
          await supabase
            .from("refresh_tokens")
            .delete()
            .eq("token_id", decoded.tokenId);

          // Revoke refresh token
          this.jwtService.revokeToken(refreshToken);
        } catch (tokenError) {
          console.warn(
            "Failed to process refresh token during logout:",
            tokenError.message
          );
        }
      }

      // Clear refresh token cookie
      res.clearCookie("refresh_token");

      res.status(200).json({
        status: "success",
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during logout",
      });
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const refreshToken = req.body.refresh_token || req.cookies.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({
          status: "error",
          message: "Refresh token is required",
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = this.jwtService.verifyRefreshToken(refreshToken);
      } catch (tokenError) {
        return res.status(401).json({
          status: "error",
          message: "Invalid or expired refresh token",
        });
      }

      // Check if refresh token exists in database
      const { data: tokenData, error: tokenError } = await supabase
        .from("refresh_tokens")
        .select("*")
        .eq("token_id", decoded.tokenId)
        .eq("user_id", decoded.sub)
        .single();

      if (tokenError || !tokenData) {
        return res.status(401).json({
          status: "error",
          message: "Refresh token not found or revoked",
        });
      }

      // Check if token has expired
      if (new Date(tokenData.expires_at) <= new Date()) {
        // Clean up expired token
        await supabase
          .from("refresh_tokens")
          .delete()
          .eq("token_id", decoded.tokenId);

        return res.status(401).json({
          status: "error",
          message: "Refresh token has expired",
        });
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", decoded.sub)
        .single();

      if (userError || !userData || !userData.is_active) {
        return res.status(401).json({
          status: "error",
          message: "User account is not active",
        });
      }

      // Generate new token pair
      const tokenPayload = {
        userId: userData.user_id,
        email: userData.email,
        userType: userData.user_type,
        isVerified: userData.is_verified,
      };

      const newTokens = this.jwtService.generateTokenPair(tokenPayload);

      // Revoke old tokens
      this.jwtService.revokeToken(refreshToken);
      await supabase
        .from("refresh_tokens")
        .delete()
        .eq("token_id", decoded.tokenId);

      // Store new refresh token
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      const { error: newTokenError } = await supabase
        .from("refresh_tokens")
        .insert({
          user_id: userData.user_id,
          token_id: newTokens.refreshTokenId,
          expires_at: newTokens.refreshTokenExpiresAt,
          created_at: new Date().toISOString(),
          ip_address: clientIP,
          user_agent: userAgent,
        });

      if (newTokenError) {
        console.error("Failed to store new refresh token:", newTokenError);
        return res.status(500).json({
          status: "error",
          message: "Token refresh failed",
        });
      }

      // Update refresh token cookie if it was set
      if (req.cookies.refresh_token) {
        res.cookie("refresh_token", newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: newTokens.refreshTokenExpiresIn * 1000,
        });
      }

      res.status(200).json({
        status: "success",
        message: "Token refreshed successfully",
        data: {
          access_token: newTokens.accessToken,
          refresh_token: req.cookies.refresh_token
            ? undefined
            : newTokens.refreshToken,
          expires_in: newTokens.accessTokenExpiresIn,
          token_type: "Bearer",
        },
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during token refresh",
      });
    }
  }

  // Private helper methods

  /**
   * Log login attempt
   * @private
   */
  async _logLoginAttempt(userId, email, ipAddress, userAgent, success, reason) {
    try {
      await supabase.from("login_attempts").insert({
        user_id: userId,
        email: email.toLowerCase(),
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        failure_reason: success ? null : reason,
        attempted_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log login attempt:", error);
    }
  }

  /**
   * Get complete user profile with type-specific data
   * @private
   */
  async _getUserProfile(userData) {
    try {
      let profileData = {
        user_id: userData.user_id,
        email: userData.email,
        phone_number: userData.phone_number,
        full_name: userData.full_name,
        city: userData.city,
        state: userData.state,
        user_type: userData.user_type,
        is_verified: userData.is_verified,
        is_active: userData.is_active,
        created_at: userData.created_at,
        last_login_at: userData.last_login_at,
      };

      // Add type-specific data
      if (userData.user_type === "Patient") {
        const { data: patientData } = await supabase
          .from("patients")
          .select(
            `
            date_of_birth,
            blood_group_id,
            bloodgroups(group_name)
          `
          )
          .eq("patient_id", userData.user_id)
          .single();

        if (patientData) {
          profileData.date_of_birth = patientData.date_of_birth;
          profileData.blood_group = patientData.bloodgroups?.group_name;
          profileData.blood_group_id = patientData.blood_group_id;
        }
      } else if (userData.user_type === "Donor") {
        const { data: donorData } = await supabase
          .from("donors")
          .select(
            `
            blood_group_id,
            donation_count,
            bloodgroups(group_name)
          `
          )
          .eq("donor_id", userData.user_id)
          .single();

        if (donorData) {
          profileData.blood_group = donorData.bloodgroups?.group_name;
          profileData.blood_group_id = donorData.blood_group_id;
          profileData.donation_count = donorData.donation_count || 0;
        }
      }

      return profileData;
    } catch (error) {
      console.error("Failed to get user profile:", error);
      // Return basic profile data if enhanced profile fails
      return {
        user_id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name,
        user_type: userData.user_type,
        is_verified: userData.is_verified,
        is_active: userData.is_active,
      };
    }
  }
}

module.exports = LoginController;
