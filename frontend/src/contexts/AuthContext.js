import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase, withRetry } from "../utils/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);
          await fetchProfile(session.access_token);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        await fetchProfile(session.access_token);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (token) => {
    try {
      const response = await withRetry(async () => {
        return fetch(`${process.env.REACT_APP_API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Connection: "keep-alive",
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      } else if (response.status === 401) {
        // Token is invalid or expired, sign out
        console.log("Token invalid, signing out");
        await supabase.auth.signOut();
      } else {
        console.error(
          "Profile fetch failed:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      // Don't sign out on network errors, just log the error
      if (error.name === "AbortError") {
        console.log("Profile fetch timed out");
      }
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Check if email confirmation is required
      if (data.data?.needsConfirmation) {
        return {
          ...data,
          needsConfirmation: true,
          message:
            "Registration successful! Please check your email to confirm your account.",
        };
      }

      // If registration includes a session token, set it
      if (data.data?.session) {
        // Set the session in Supabase client
        await supabase.auth.setSession({
          access_token: data.data.access_token,
          refresh_token: data.data.session.refresh_token,
        });

        // The auth state change listener will handle setting user and profile
        return data;
      }

      // If no session but needsLogin flag, user needs to login manually
      if (data.data?.needsLogin) {
        return {
          ...data,
          needsLogin: true,
          message:
            "Registration successful! Please login with your credentials.",
        };
      }

      // Fallback: try to login automatically
      try {
        await login(userData.email, userData.password);
      } catch (loginError) {
        console.log("Auto-login failed, user may need to login manually");
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("No active session");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Profile update failed");
      }

      // Refresh profile data
      await fetchProfile(session.access_token);

      return await response.json();
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
