import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Handle authentication callback
    const handleAuthCallback = async () => {
      try {
        // If user is authenticated, redirect to dashboard
        if (user) {
          navigate("/app/dashboard", { replace: true });
        } else {
          // If not authenticated, redirect to login
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/login", { replace: true });
      }
    };

    handleAuthCallback();
  }, [user, navigate]);

  return (
    <div className="auth-callback">
      <div className="loading">
        <div className="spinner"></div>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
