const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || "fallback-secret-key";
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-key";
    this.issuer = "blood-warriors-api";

    // In-memory blacklist for revoked tokens (in production, use Redis)
    this.blacklistedTokens = new Set();
  }

  /**
   * Generate access token with 15-minute expiry
   * @param {Object} payload - Token payload containing user data
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    if (!payload || !payload.userId) {
      throw new Error("Invalid payload: userId is required");
    }

    const tokenPayload = {
      sub: payload.userId.toString(),
      email: payload.email,
      userType: payload.userType,
      isVerified: payload.isVerified || false,
      iat: Math.floor(Date.now() / 1000),
      iss: this.issuer,
      type: "access",
    };

    return jwt.sign(tokenPayload, this.accessTokenSecret, {
      expiresIn: "15m",
      algorithm: "HS256",
    });
  }

  /**
   * Generate refresh token with 7-day expiry
   * @param {Object} payload - Token payload containing user data
   * @returns {Object} Refresh token data with token and tokenId
   */
  generateRefreshToken(payload) {
    if (!payload || !payload.userId) {
      throw new Error("Invalid payload: userId is required");
    }

    // Generate unique token ID for tracking and revocation
    const tokenId = crypto.randomUUID();

    const tokenPayload = {
      sub: payload.userId.toString(),
      tokenId: tokenId,
      iat: Math.floor(Date.now() / 1000),
      iss: this.issuer,
      type: "refresh",
    };

    const token = jwt.sign(tokenPayload, this.refreshTokenSecret, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    return {
      token,
      tokenId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };
  }

  /**
   * Verify and decode access token
   * @param {string} token - JWT access token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    if (!token) {
      throw new Error("Token is required");
    }

    // Check if token is blacklisted
    if (this.blacklistedTokens.has(token)) {
      throw new Error("Token has been revoked");
    }

    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        algorithms: ["HS256"],
      });

      // Verify token type
      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Access token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid access token");
      } else if (error.name === "NotBeforeError") {
        throw new Error("Access token not active yet");
      }
      throw error;
    }
  }

  /**
   * Verify and decode refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    if (!token) {
      throw new Error("Refresh token is required");
    }

    // Check if token is blacklisted
    if (this.blacklistedTokens.has(token)) {
      throw new Error("Refresh token has been revoked");
    }

    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        algorithms: ["HS256"],
      });

      // Verify token type
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid refresh token");
      } else if (error.name === "NotBeforeError") {
        throw new Error("Refresh token not active yet");
      }
      throw error;
    }
  }

  /**
   * Revoke a token by adding it to blacklist
   * @param {string} token - Token to revoke
   * @returns {boolean} Success status
   */
  revokeToken(token) {
    if (!token) {
      throw new Error("Token is required for revocation");
    }

    this.blacklistedTokens.add(token);
    return true;
  }

  /**
   * Revoke token by token ID (for refresh tokens)
   * @param {string} tokenId - Token ID to revoke
   * @returns {boolean} Success status
   */
  revokeTokenById(tokenId) {
    if (!tokenId) {
      throw new Error("Token ID is required for revocation");
    }

    // In a real implementation, this would mark the token as revoked in the database
    // For now, we'll store the tokenId in our blacklist
    this.blacklistedTokens.add(tokenId);
    return true;
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - Token to check
   * @returns {boolean} True if token is blacklisted
   */
  isTokenBlacklisted(token) {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Extracted token or null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} payload - User payload
   * @returns {Object} Object containing both tokens
   */
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshTokenData = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      refreshTokenId: refreshTokenData.tokenId,
      refreshTokenExpiresAt: refreshTokenData.expiresAt,
      accessTokenExpiresIn: 15 * 60, // 15 minutes in seconds
      refreshTokenExpiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - Token to decode
   * @returns {Object} Decoded token payload
   */
  decodeToken(token) {
    if (!token) {
      throw new Error("Token is required");
    }

    return jwt.decode(token);
  }

  /**
   * Clear all blacklisted tokens (for testing purposes)
   */
  clearBlacklist() {
    this.blacklistedTokens.clear();
  }

  /**
   * Get blacklist size (for monitoring)
   * @returns {number} Number of blacklisted tokens
   */
  getBlacklistSize() {
    return this.blacklistedTokens.size;
  }
}

module.exports = JWTService;
