import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../utils/supabase";

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data?.session) {
          // User is confirmed and logged in
          console.log("Email confirmed successfully!");
          navigate("/app/dashboard");
        } else {
          // Check for error in URL params
          const errorDescription = searchParams.get("error_description");
          if (errorDescription) {
            throw new Error(errorDescription);
          }

          // No session, redirect to login
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError(error.message);
        setTimeout(() => navigate("/login"), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>🩸 Confirming Your Account</h2>
          <p>Please wait while we confirm your email address...</p>
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <div className="loading-spinner">⏳</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>❌ Confirmation Failed</h2>
          <div className="alert alert-error">{error}</div>
          <p>Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>✅ Email Confirmed!</h2>
        <p>
          Your email has been confirmed successfully. Redirecting to
          dashboard...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
