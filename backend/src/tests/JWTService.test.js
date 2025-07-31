const JWTService = require("../services/JWTService");
const jwt = require("jsonwebtoken");

describe("JWTService", () => {
  let jwtService;
  const mockPayload = {
    userId: 123,
    email: "test@example.com",
    userType: "donor",
    isVerified: true,
  };

  beforeEach(() => {
    // Set test environment variables
    process.env.JWT_SECRET = "test-secret-key";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key";

    jwtService = new JWTService();
    jwtService.clearBlacklist(); // Clear blacklist before each test
  });

  afterEach(() => {
    jwtService.clearBlacklist();
  });

  describe("constructor", () => {
    it("should initialize with environment variables", () => {
      expect(jwtService.accessTokenSecret).toBe("test-secret-key");
      expect(jwtService.refreshTokenSecret).toBe("test-refresh-secret-key");
      expect(jwtService.issuer).toBe("blood-warriors-api");
    });

    it("should use fallback secrets when env vars are not set", () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      const service = new JWTService();
      expect(service.accessTokenSecret).toBe("fallback-secret-key");
      expect(service.refreshTokenSecret).toBe("fallback-refresh-secret-key");
    });
  });

  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const token = jwtService.generateAccessToken(mockPayload);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts

      const decoded = jwt.decode(token);
      expect(decoded.sub).toBe("123");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.userType).toBe("donor");
      expect(decoded.isVerified).toBe(true);
      expect(decoded.type).toBe("access");
      expect(decoded.iss).toBe("blood-warriors-api");
    });

    it("should throw error for invalid payload", () => {
      expect(() => jwtService.generateAccessToken({})).toThrow(
        "Invalid payload: userId is required"
      );
      expect(() => jwtService.generateAccessToken(null)).toThrow(
        "Invalid payload: userId is required"
      );
      expect(() => jwtService.generateAccessToken()).toThrow(
        "Invalid payload: userId is required"
      );
    });

    it("should set default isVerified to false when not provided", () => {
      const payload = {
        userId: 123,
        email: "test@example.com",
        userType: "donor",
      };
      const token = jwtService.generateAccessToken(payload);

      const decoded = jwt.decode(token);
      expect(decoded.isVerified).toBe(false);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid refresh token with metadata", () => {
      const result = jwtService.generateRefreshToken(mockPayload);

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("tokenId");
      expect(result).toHaveProperty("expiresAt");
      expect(typeof result.token).toBe("string");
      expect(typeof result.tokenId).toBe("string");
      expect(result.expiresAt).toBeInstanceOf(Date);

      const decoded = jwt.decode(result.token);
      expect(decoded.sub).toBe("123");
      expect(decoded.tokenId).toBe(result.tokenId);
      expect(decoded.type).toBe("refresh");
      expect(decoded.iss).toBe("blood-warriors-api");
    });

    it("should throw error for invalid payload", () => {
      expect(() => jwtService.generateRefreshToken({})).toThrow(
        "Invalid payload: userId is required"
      );
      expect(() => jwtService.generateRefreshToken(null)).toThrow(
        "Invalid payload: userId is required"
      );
      expect(() => jwtService.generateRefreshToken()).toThrow(
        "Invalid payload: userId is required"
      );
    });

    it("should generate unique token IDs", () => {
      const result1 = jwtService.generateRefreshToken(mockPayload);
      const result2 = jwtService.generateRefreshToken(mockPayload);

      expect(result1.tokenId).not.toBe(result2.tokenId);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid access token", () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded.sub).toBe("123");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.userType).toBe("donor");
      expect(decoded.type).toBe("access");
    });

    it("should throw error for missing token", () => {
      expect(() => jwtService.verifyAccessToken()).toThrow("Token is required");
      expect(() => jwtService.verifyAccessToken("")).toThrow(
        "Token is required"
      );
      expect(() => jwtService.verifyAccessToken(null)).toThrow(
        "Token is required"
      );
    });

    it("should throw error for invalid token", () => {
      expect(() => jwtService.verifyAccessToken("invalid-token")).toThrow(
        "Invalid access token"
      );
    });

    it("should throw error for expired token", () => {
      // Create token with past expiry
      const expiredToken = jwt.sign(
        { sub: "123", type: "access", iss: "blood-warriors-api" },
        "test-secret-key",
        { expiresIn: "-1s" }
      );

      expect(() => jwtService.verifyAccessToken(expiredToken)).toThrow(
        "Access token has expired"
      );
    });

    it("should throw error for wrong token type", () => {
      const refreshToken = jwt.sign(
        { sub: "123", type: "refresh", iss: "blood-warriors-api" },
        "test-secret-key",
        { expiresIn: "15m" }
      );

      expect(() => jwtService.verifyAccessToken(refreshToken)).toThrow(
        "Invalid token type"
      );
    });

    it("should throw error for blacklisted token", () => {
      const token = jwtService.generateAccessToken(mockPayload);
      jwtService.revokeToken(token);

      expect(() => jwtService.verifyAccessToken(token)).toThrow(
        "Token has been revoked"
      );
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token", () => {
      const result = jwtService.generateRefreshToken(mockPayload);
      const decoded = jwtService.verifyRefreshToken(result.token);

      expect(decoded.sub).toBe("123");
      expect(decoded.tokenId).toBe(result.tokenId);
      expect(decoded.type).toBe("refresh");
    });

    it("should throw error for missing token", () => {
      expect(() => jwtService.verifyRefreshToken()).toThrow(
        "Refresh token is required"
      );
      expect(() => jwtService.verifyRefreshToken("")).toThrow(
        "Refresh token is required"
      );
      expect(() => jwtService.verifyRefreshToken(null)).toThrow(
        "Refresh token is required"
      );
    });

    it("should throw error for invalid token", () => {
      expect(() => jwtService.verifyRefreshToken("invalid-token")).toThrow(
        "Invalid refresh token"
      );
    });

    it("should throw error for expired token", () => {
      // Create token with past expiry
      const expiredToken = jwt.sign(
        { sub: "123", type: "refresh", iss: "blood-warriors-api" },
        "test-refresh-secret-key",
        { expiresIn: "-1s" }
      );

      expect(() => jwtService.verifyRefreshToken(expiredToken)).toThrow(
        "Refresh token has expired"
      );
    });

    it("should throw error for wrong token type", () => {
      const accessToken = jwt.sign(
        { sub: "123", type: "access", iss: "blood-warriors-api" },
        "test-refresh-secret-key",
        { expiresIn: "7d" }
      );

      expect(() => jwtService.verifyRefreshToken(accessToken)).toThrow(
        "Invalid token type"
      );
    });

    it("should throw error for blacklisted token", () => {
      const result = jwtService.generateRefreshToken(mockPayload);
      jwtService.revokeToken(result.token);

      expect(() => jwtService.verifyRefreshToken(result.token)).toThrow(
        "Refresh token has been revoked"
      );
    });
  });

  describe("revokeToken", () => {
    it("should revoke a token successfully", () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const result = jwtService.revokeToken(token);

      expect(result).toBe(true);
      expect(jwtService.isTokenBlacklisted(token)).toBe(true);
    });

    it("should throw error for missing token", () => {
      expect(() => jwtService.revokeToken()).toThrow(
        "Token is required for revocation"
      );
      expect(() => jwtService.revokeToken("")).toThrow(
        "Token is required for revocation"
      );
      expect(() => jwtService.revokeToken(null)).toThrow(
        "Token is required for revocation"
      );
    });
  });

  describe("revokeTokenById", () => {
    it("should revoke a token by ID successfully", () => {
      const tokenId = "test-token-id";
      const result = jwtService.revokeTokenById(tokenId);

      expect(result).toBe(true);
      expect(jwtService.isTokenBlacklisted(tokenId)).toBe(true);
    });

    it("should throw error for missing token ID", () => {
      expect(() => jwtService.revokeTokenById()).toThrow(
        "Token ID is required for revocation"
      );
      expect(() => jwtService.revokeTokenById("")).toThrow(
        "Token ID is required for revocation"
      );
      expect(() => jwtService.revokeTokenById(null)).toThrow(
        "Token ID is required for revocation"
      );
    });
  });

  describe("isTokenBlacklisted", () => {
    it("should return true for blacklisted token", () => {
      const token = jwtService.generateAccessToken(mockPayload);
      jwtService.revokeToken(token);

      expect(jwtService.isTokenBlacklisted(token)).toBe(true);
    });

    it("should return false for non-blacklisted token", () => {
      const token = jwtService.generateAccessToken(mockPayload);

      expect(jwtService.isTokenBlacklisted(token)).toBe(false);
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from valid Bearer header", () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const header = `Bearer ${token}`;

      expect(jwtService.extractTokenFromHeader(header)).toBe(token);
    });

    it("should return null for invalid header format", () => {
      expect(jwtService.extractTokenFromHeader("InvalidHeader")).toBeNull();
      expect(jwtService.extractTokenFromHeader("Basic token")).toBeNull();
      expect(jwtService.extractTokenFromHeader("Bearer")).toBeNull();
      expect(
        jwtService.extractTokenFromHeader("Bearer token extra")
      ).toBeNull();
    });

    it("should return null for missing header", () => {
      expect(jwtService.extractTokenFromHeader()).toBeNull();
      expect(jwtService.extractTokenFromHeader("")).toBeNull();
      expect(jwtService.extractTokenFromHeader(null)).toBeNull();
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", () => {
      const result = jwtService.generateTokenPair(mockPayload);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("refreshTokenId");
      expect(result).toHaveProperty("refreshTokenExpiresAt");
      expect(result).toHaveProperty("accessTokenExpiresIn");
      expect(result).toHaveProperty("refreshTokenExpiresIn");

      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
      expect(typeof result.refreshTokenId).toBe("string");
      expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
      expect(result.accessTokenExpiresIn).toBe(15 * 60); // 15 minutes
      expect(result.refreshTokenExpiresIn).toBe(7 * 24 * 60 * 60); // 7 days
    });

    it("should generate valid tokens that can be verified", () => {
      const result = jwtService.generateTokenPair(mockPayload);

      const accessDecoded = jwtService.verifyAccessToken(result.accessToken);
      const refreshDecoded = jwtService.verifyRefreshToken(result.refreshToken);

      expect(accessDecoded.sub).toBe("123");
      expect(refreshDecoded.sub).toBe("123");
      expect(refreshDecoded.tokenId).toBe(result.refreshTokenId);
    });
  });

  describe("decodeToken", () => {
    it("should decode token without verification", () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const decoded = jwtService.decodeToken(token);

      expect(decoded.sub).toBe("123");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.type).toBe("access");
    });

    it("should throw error for missing token", () => {
      expect(() => jwtService.decodeToken()).toThrow("Token is required");
      expect(() => jwtService.decodeToken("")).toThrow("Token is required");
      expect(() => jwtService.decodeToken(null)).toThrow("Token is required");
    });
  });

  describe("blacklist management", () => {
    it("should clear blacklist", () => {
      const token = jwtService.generateAccessToken(mockPayload);
      jwtService.revokeToken(token);

      expect(jwtService.getBlacklistSize()).toBe(1);

      jwtService.clearBlacklist();

      expect(jwtService.getBlacklistSize()).toBe(0);
      expect(jwtService.isTokenBlacklisted(token)).toBe(false);
    });

    it("should return correct blacklist size", () => {
      expect(jwtService.getBlacklistSize()).toBe(0);

      const token1 = jwtService.generateAccessToken(mockPayload);
      const token2 = jwtService.generateAccessToken({
        ...mockPayload,
        userId: 456,
      });

      jwtService.revokeToken(token1);
      expect(jwtService.getBlacklistSize()).toBe(1);

      jwtService.revokeToken(token2);
      expect(jwtService.getBlacklistSize()).toBe(2);
    });
  });

  describe("token expiry times", () => {
    it("should set correct expiry for access token (15 minutes)", () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const decoded = jwt.decode(token);

      const expectedExpiry = decoded.iat + 15 * 60; // 15 minutes in seconds
      expect(decoded.exp).toBe(expectedExpiry);
    });

    it("should set correct expiry for refresh token (7 days)", () => {
      const result = jwtService.generateRefreshToken(mockPayload);
      const decoded = jwt.decode(result.token);

      const expectedExpiry = decoded.iat + 7 * 24 * 60 * 60; // 7 days in seconds
      expect(decoded.exp).toBe(expectedExpiry);
    });
  });
});
