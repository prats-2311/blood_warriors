import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

const AuthContext = createContext();

// Token storage utilities
const TOKEN_KEY = "blood_warriors_access_token";
const REFRESH_TOKEN_KEY = "blood_warriors_refresh_token";

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const setStoredRefreshToken = (token) =>
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
const removeStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// JWT token utilities
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

const getTokenPayload = (token) => {
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const clearAuthState = () => {
    setUser(null);
    setProfile(null);
    setAccessToken(null);
    setRefreshToken(null);
    removeStoredTokens();
  };

  const refreshAccessToken = useCallback(
    async (refreshTokenValue) => {
      try {
        const response = await fetch(`${apiUrl}/auth/token/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshTokenValue,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const { access_token, refresh_token } = data.data;

          setAccessToken(access_token);
          setStoredToken(access_token);

          // Only update refresh token if it's provided (not using cookies)
          if (refresh_token) {
            setRefreshToken(refresh_token);
            setStoredRefreshToken(refresh_token);
          }

          const payload = getTokenPayload(access_token);
          if (payload) {
            setUser({
              id: payload.sub,
              email: payload.email,
              userType: payload.userType,
              isVerified: payload.isVerified,
            });
          }

          return true;
        } else {
          clearAuthState();
          return false;
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        clearAuthState();
        return false;
      }
    },
    [apiUrl]
  );

  const fetchProfile = useCallback(
    async (token) => {
      if (!token) return;

      try {
        const response = await fetch(`${apiUrl}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data.data);
        } else if (response.status === 401) {
          // Token is invalid, don't try to refresh here to avoid loops
          // The token refresh should be handled by the auth initialization
          console.warn("Profile fetch failed: token invalid");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        // Don't clear auth state on network errors
      }
    },
    [apiUrl]
  );

  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = getStoredToken();
      const storedRefreshToken = getStoredRefreshToken();

      if (storedToken && storedRefreshToken) {
        if (isTokenExpired(storedToken)) {
          // Try to refresh the token
          const refreshed = await refreshAccessToken(storedRefreshToken);
          if (!refreshed) {
            clearAuthState();
          }
        } else {
          // Token is still valid
          setAccessToken(storedToken);
          setRefreshToken(storedRefreshToken);

          const payload = getTokenPayload(storedToken);
          if (payload) {
            // Validate token by making a test API call
            try {
              const response = await fetch(`${apiUrl}/auth/profile`, {
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                  "Content-Type": "application/json",
                },
              });

              if (response.ok) {
                // Token is valid, set user state
                setUser({
                  id: payload.sub,
                  email: payload.email,
                  userType: payload.userType,
                  isVerified: payload.isVerified,
                });

                // Set profile data
                const data = await response.json();
                setProfile(data.data);
              } else if (response.status === 401) {
                // Token is invalid, try to refresh
                const refreshed = await refreshAccessToken(storedRefreshToken);
                if (!refreshed) {
                  clearAuthState();
                }
              } else {
                // Other error, clear auth state
                clearAuthState();
              }
            } catch (error) {
              console.error("Token validation failed:", error);
              // Try to refresh token on network error
              const refreshed = await refreshAccessToken(storedRefreshToken);
              if (!refreshed) {
                clearAuthState();
              }
            }
          } else {
            // Invalid token payload
            clearAuthState();
          }
        }
      } else {
        // No tokens found, user is not authenticated
        clearAuthState();
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, refreshAccessToken]);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          remember_me: rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const { access_token, refresh_token, user: userData } = data.data;

      setAccessToken(access_token);
      setStoredToken(access_token);

      // Only set refresh token if it's provided (not using cookies)
      if (refresh_token) {
        setRefreshToken(refresh_token);
        setStoredRefreshToken(refresh_token);
      }

      setUser({
        id: userData.user_id,
        email: userData.email,
        userType: userData.user_type,
        isVerified: userData.is_verified,
      });

      setProfile(userData);

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (accessToken || refreshToken) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthState();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!accessToken) {
        throw new Error("No active session");
      }

      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();
      setProfile(data.data);
      return data;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  // Password management functions
  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      return data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  };

  const resetPassword = async (token, password, confirmPassword) => {
    try {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  const changePassword = async (
    currentPassword,
    newPassword,
    confirmPassword
  ) => {
    try {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      // Clear tokens since all sessions are revoked after password change
      clearAuthState();

      return data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    userProfile: profile, // Alias for compatibility
    loading,
    accessToken,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export AuthContext for direct access if needed
export { AuthContext };
