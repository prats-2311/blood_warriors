import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/JWTAuthContext";

// Main authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook for role-based access control
export const useRoleAccess = (allowedRoles = []) => {
  const { user, loading } = useAuth();

  const hasAccess = () => {
    if (loading) return false;
    if (!user) return false;
    if (allowedRoles.length === 0) return true; // No role restriction
    return allowedRoles.includes(user.userType);
  };

  const checkAccess = (requiredRoles = allowedRoles) => {
    if (!user) return false;
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.userType);
  };

  return {
    hasAccess: hasAccess(),
    checkAccess,
    userRole: user?.userType,
    loading,
  };
};

// Hook for authentication requirements
export const useAuthRequired = () => {
  const { user, loading } = useAuth();

  return {
    isAuthenticated: !!user,
    loading,
    user,
  };
};

// Hook for guest-only pages (redirect authenticated users)
export const useGuestOnly = (redirectTo = "/app/dashboard") => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're definitely authenticated and not loading
    if (!loading && user && user.id) {
      console.log(
        "🔄 Guest-only page: redirecting authenticated user to",
        redirectTo
      );
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo]);

  return {
    isGuest: !user,
    loading,
  };
};

// Hook for login functionality with enhanced features
export const useLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (credentials, options = {}) => {
    const { rememberMe = false, redirectTo } = options;

    setIsLoading(true);
    setError(null);

    try {
      await login(credentials.email, credentials.password, rememberMe);

      // Determine redirect location
      const from =
        location.state?.from?.pathname || redirectTo || "/app/dashboard";
      navigate(from, { replace: true });

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    handleLogin,
    isLoading,
    error,
    clearError,
  };
};

// Hook for logout functionality
export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async (redirectTo = "/") => {
    setIsLoading(true);

    try {
      await logout();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local state
      navigate(redirectTo, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLogout,
    isLoading,
  };
};

// Hook for registration functionality
export const useRegister = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (userData, options = {}) => {
    const { redirectTo = "/login" } = options;

    setIsLoading(true);
    setError(null);

    try {
      const result = await register(userData);

      // Registration successful, redirect to login or verification page
      navigate(redirectTo, {
        replace: true,
        state: {
          message:
            "Registration successful! Please check your email to verify your account.",
          email: userData.email,
        },
      });

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    handleRegister,
    isLoading,
    error,
    clearError,
  };
};

// Hook for password management
export const usePasswordManagement = () => {
  const { forgotPassword, resetPassword, changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleForgotPassword = async (email) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await forgotPassword(email);
      setSuccess(result.message || "Password reset email sent successfully");
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "Failed to send reset email";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (token, password, confirmPassword) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await resetPassword(token, password, confirmPassword);
      setSuccess(result.message || "Password reset successfully");
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "Failed to reset password";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (
    currentPassword,
    newPassword,
    confirmPassword
  ) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      );
      setSuccess(result.message || "Password changed successfully");
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "Failed to change password";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    handleForgotPassword,
    handleResetPassword,
    handleChangePassword,
    isLoading,
    error,
    success,
    clearMessages,
  };
};

// Hook for profile management
export const useProfile = () => {
  const { profile, updateProfile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateProfile(profileData);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    profile,
    user,
    handleUpdateProfile,
    isLoading,
    error,
    clearError,
  };
};

// Hook for checking authentication status
export const useAuthStatus = () => {
  const { user, loading, accessToken } = useAuth();

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
    hasToken: !!accessToken,
    userType: user?.userType,
    isVerified: user?.isVerified,
  };
};

// Export AuthContext for backward compatibility (if needed)
export { AuthContext } from "../contexts/JWTAuthContext";
