const JWTService = require("../services/JWTService");
const { supabase } = require("../utils/supabase");
const Joi = require("joi");

class TokenController {
  constructor() {
    this.jwtService = new JWTService();

    // Validation schemas
    this.refreshTokenSchema = Joi.object({
      refresh_token: Joi.string().required().messages({
        "any.required": "Refresh token is required",
      }),
    });

    this.revokeTokenSchema = Joi.object({
      token_id: Joi.string().optional(),
      revoke_all: Joi.boolean().optional().default(false),
    });
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      // Validate request
      const { error, value } = this.refreshTokenSchema.validate(req.body);
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

      const { refresh_token } = value;
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      // Verify refresh token
      let decoded;
      try {
        decoded = this.jwtService.verifyRefreshToken(refresh_token);
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
        .select("user_id, email, full_name, user_type, is_active, is_verified")
        .eq("user_id", decoded.sub)
        .single();

      if (userError || !userData) {
        // Clean up the invalid refresh token
        await supabase
          .from("refresh_tokens")
          .delete()
          .eq("token_id", decoded.tokenId);
          
        return res.status(401).json({
          status: "error",
          message: "User account not found",
        });
      }

      // Validate user data before creating token payload
      if (!userData.user_id) {
        // Clean up the invalid refresh token
        await supabase
          .from("refresh_tokens")
          .delete()
          .eq("token_id", decoded.tokenId);
          
        return res.status(401).json({
          status: "error",
          message: "Invalid user data",
        });
      }

      // Generate new token pair
      const tokenPayload = {
        userId: userData.user_id,
        email: userData.email,
        userType: userData.user_type,
        isVerified: userData.is_verified,
      };

      let newTokens;
      try {
        newTokens = this.jwtService.generateTokenPair(tokenPayload);
      } catch (tokenError) {
        // Clean up the invalid refresh token
        await supabase
          .from("refresh_tokens")
          .delete()
          .eq("token_id", decoded.tokenId);
          
        return res.status(500).json({
          status: "error",
          message: "Failed to generate new tokens",
        });
      }

      // Revoke old tokens
      this.jwtService.revokeToken(refresh_token);
      await supabase
        .from("refresh_tokens")
        .delete()
        .eq("token_id", decoded.tokenId);

      // Store new refresh token
      const crypto = require("crypto");
      const tokenHash = crypto.createHash("sha256").update(newTokens.refreshToken).digest("hex");

      const { error: newTokenError } = await supabase
        .from("refresh_tokens")
        .insert({
          user_id: userData.user_id,
          token_id: newTokens.refreshTokenId,
          token_hash: tokenHash,
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

      res.status(200).json({
        status: "success",
        message: "Token refreshed successfully",
        data: {
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
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

  /**
   * Revoke tokens for security incidents
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async revokeTokens(req, res) {
    try {
      // Validate request
      const { error, value } = this.revokeTokenSchema.validate(req.body);
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

      const { token_id, revoke_all } = value;
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      let revokedCount = 0;

      if (revoke_all) {
        // Revoke all refresh tokens for the user
        const { data: tokens, error: fetchError } = await supabase
          .from("refresh_tokens")
          .select("token_id")
          .eq("user_id", userId);

        if (!fetchError && tokens) {
          // Revoke tokens from JWT service blacklist
          tokens.forEach(token => {
            this.jwtService.revokeTokenById(token.token_id);
          });

          // Delete all refresh tokens from database
          const { error: deleteError } = await supabase
            .from("refresh_tokens")
            .delete()
            .eq("user_id", userId);

          if (!deleteError) {
            revokedCount = tokens.length;
          }
        }
      } else if (token_id) {
        // Revoke specific token
        const { data: tokenData, error: tokenError } = await supabase
          .from("refresh_tokens")
          .select("*")
          .eq("token_id", token_id)
          .eq("user_id", userId)
          .single();

        if (!tokenError && tokenData) {
          // Revoke from JWT service
          this.jwtService.revokeTokenById(token_id);

          // Delete from database
          const { error: deleteError } = await supabase
            .from("refresh_tokens")
            .delete()
            .eq("token_id", token_id);

          if (!deleteError) {
            revokedCount = 1;
          }
        }
      } else {
        return res.status(400).json({
          status: "error",
          message: "Either token_id or revoke_all must be specified",
        });
      }

      res.status(200).json({
        status: "success",
        message: `Successfully revoked ${revokedCount} token(s)`,
        data: {
          revoked_count: revokedCount,
        },
      });
    } catch (error) {
      console.error("Token revocation error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during token revocation",
      });
    }
  }

  /**
   * Get active sessions for the user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSessions(req, res) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Get all active refresh tokens (sessions)
      const { data: sessions, error: sessionError } = await supabase
        .from("refresh_tokens")
        .select("token_id, created_at, expires_at, ip_address, user_agent")
        .eq("user_id", userId)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (sessionError) {
        console.error("Failed to fetch sessions:", sessionError);
        return res.status(500).json({
          status: "error",
          message: "Failed to fetch sessions",
        });
      }

      // Format sessions for response
      const formattedSessions = sessions.map(session => ({
        token_id: session.token_id,
        created_at: session.created_at,
        expires_at: session.expires_at,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        is_current: req.tokenPayload?.tokenId === session.token_id,
      }));

      res.status(200).json({
        status: "success",
        message: "Sessions retrieved successfully",
        data: {
          sessions: formattedSessions,
          total_count: formattedSessions.length,
        },
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
}

module.exports = TokenController;
