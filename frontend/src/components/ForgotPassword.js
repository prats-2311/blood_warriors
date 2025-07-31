import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePasswordManagement, useGuestOnly } from "../hooks/useAuth";
import Button, { HeartIcon, ShieldIcon } from "./ui/Button";
import "./Login.css"; // Reuse login styles

const ForgotPassword = () => {
  const { isGuest, loading: authLoading } = useGuestOnly();
  const { handleForgotPassword, isLoading, error, success, clearMessages } = usePasswordManagement();
  
  const [email, setEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Clear messages when email changes
  useEffect(() => {
    if (error || success) {
      clearMessages();
    }
    setValidationErrors({});
  }, [email, error, success, clearMessages]);

  const validateForm = () => {
    const errors = {};
    
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await handleForgotPassword(email);
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Hero Background */}
      <div className="auth-hero">
        <div className="auth-hero__content">
          <div className="auth-hero__badge">
            <HeartIcon />
            <span>Blood Warriors</span>
          </div>
          <h1 className="auth-hero__title">
            Reset Your<br />
            <span className="text-gradient">Password</span>
          </h1>
          <p className="auth-hero__subtitle">
            Don't worry, it happens to the best of us. Enter your email address 
            and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Forgot Password Form */}
      <div className="auth-form-container">
        <div className="auth-form">
          <div className="auth-form__header">
            <div className="auth-form__icon">
              <ShieldIcon />
            </div>
            <h2 className="auth-form__title">Forgot Password</h2>
            <p className="auth-form__subtitle">
              Enter your email address to receive a password reset link
            </p>
          </div>

          {success && (
            <div className="auth-form__alert auth-form__alert--success">
              <div className="alert-icon">✅</div>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="auth-form__alert auth-form__alert--error">
              <div className="alert-icon">⚠️</div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form__form">
            <div className="form-field">
              <label htmlFor="email" className="form-field__label">
                Email Address
              </label>
              <div className="form-field__input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-field__input ${validationErrors.email ? 'form-field__input--error' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
                <div className="form-field__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
              </div>
              {validationErrors.email && (
                <div className="form-field__error">{validationErrors.email}</div>
              )}
            </div>

            <div className="form-field">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
                icon={<ShieldIcon />}
              >
                {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>
            </div>
          </form>

          <div className="auth-form__divider">
            <span>or</span>
          </div>

          <div className="auth-form__footer">
            <p className="auth-form__link-text">
              Remember your password?{" "}
              <Link to="/login" className="auth-form__link">
                Back to Sign In
              </Link>
            </p>
            <p className="auth-form__link-text">
              Don't have an account?{" "}
              <Link to="/register" className="auth-form__link">
                Create your account
              </Link>
            </p>
            <p className="auth-form__help">
              Need help? <a href="#" className="auth-form__link">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
