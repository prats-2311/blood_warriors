import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLogin, useGuestOnly } from "../hooks/useAuth";
import Button, { HeartIcon, ShieldIcon } from "./ui/Button";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuest, loading: authLoading } = useGuestOnly();
  const { handleLogin, isLoading, error, clearError } = useLogin();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Clear error when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
    setValidationErrors({});
  }, [formData.email, formData.password]);

  // Show success message if redirected from registration
  const successMessage = location.state?.message;

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await handleLogin(
      { email: formData.email, password: formData.password },
      { rememberMe: formData.rememberMe }
    );

    if (result.success) {
      // Navigation is handled by useLogin hook
      console.log("Login successful");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            Saving Lives,<br />
            <span className="text-gradient">One Drop at a Time</span>
          </h1>
          <p className="auth-hero__subtitle">
            Join the fight against Thalassemia. Connect with donors, 
            access emergency support, and be part of a community that cares.
          </p>
          <div className="auth-hero__stats">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Lives Saved</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Donors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Emergency Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="auth-form-container">
        <div className="auth-form">
          <div className="auth-form__header">
            <div className="auth-form__icon">
              <ShieldIcon />
            </div>
            <h2 className="auth-form__title">Welcome Back</h2>
            <p className="auth-form__subtitle">
              Sign in to access your Blood Warriors account
            </p>
          </div>

          {successMessage && (
            <div className="auth-form__alert auth-form__alert--success">
              <div className="alert-icon">✅</div>
              <span>{successMessage}</span>
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
                  value={formData.email}
                  onChange={handleChange}
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
              <label htmlFor="password" className="form-field__label">
                Password
              </label>
              <div className="form-field__input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`form-field__input ${validationErrors.password ? 'form-field__input--error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="form-field__toggle-password"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <div className="form-field__error">{validationErrors.password}</div>
              )}
            </div>

            <div className="form-field form-field--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Remember me for 7 days</span>
              </label>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
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
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </div>
          </form>

          <div className="auth-form__divider">
            <span>or</span>
          </div>

          <div className="auth-form__footer">
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

export default Login;
