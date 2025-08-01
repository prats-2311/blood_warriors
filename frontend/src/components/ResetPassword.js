import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { usePasswordManagement, useGuestOnly } from "../hooks/useAuth";
import Button, { HeartIcon, ShieldIcon } from "./ui/Button";
import "./Login.css"; // Reuse login styles

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useGuestOnly();
  const { handleResetPassword, isLoading, error, success, clearMessages } = usePasswordManagement();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  const token = searchParams.get('token');

  // Clear messages when form data changes
  useEffect(() => {
    if (error || success) {
      clearMessages();
    }
    setValidationErrors({});
  }, [formData, error, success, clearMessages]);

  // Redirect to login after successful reset
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successfully! Please log in with your new password.' 
          }
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const validatePasswordStrength = (password) => {
    const strength = { score: 0, feedback: [] };
    
    if (password.length >= 8) strength.score += 1;
    else strength.feedback.push("At least 8 characters");
    
    if (/[a-z]/.test(password)) strength.score += 1;
    else strength.feedback.push("One lowercase letter");
    
    if (/[A-Z]/.test(password)) strength.score += 1;
    else strength.feedback.push("One uppercase letter");
    
    if (/\d/.test(password)) strength.score += 1;
    else strength.feedback.push("One number");
    
    if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) strength.score += 1;
    else strength.feedback.push("One special character");
    
    return strength;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else {
      const strength = validatePasswordStrength(formData.password);
      if (strength.score < 4) {
        errors.password = "Password is too weak";
      }
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update password strength for password field
    if (name === 'password') {
      setPasswordStrength(validatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await handleResetPassword(token, formData.password, formData.confirmPassword);
  };

  const getStrengthColor = (score) => {
    if (score <= 1) return '#ef4444'; // red
    if (score <= 2) return '#f97316'; // orange
    if (score <= 3) return '#eab308'; // yellow
    if (score <= 4) return '#22c55e'; // green
    return '#16a34a'; // dark green
  };

  const getStrengthText = (score) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
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
            Create New<br />
            <span className="text-gradient">Password</span>
          </h1>
          <p className="auth-hero__subtitle">
            Choose a strong password to keep your account secure.
          </p>
        </div>
      </div>

      {/* Reset Password Form */}
      <div className="auth-form-container">
        <div className="auth-form">
          <div className="auth-form__header">
            <div className="auth-form__icon">
              <ShieldIcon />
            </div>
            <h2 className="auth-form__title">Reset Password</h2>
            <p className="auth-form__subtitle">
              Enter your new password below
            </p>
          </div>

          {success && (
            <div className="auth-form__alert auth-form__alert--success">
              <div className="alert-icon">✅</div>
              <div>
                <div>{success}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Redirecting to login page in 3 seconds...
                </div>
              </div>
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
              <label htmlFor="password" className="form-field__label">
                New Password
              </label>
              <div className="form-field__input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`form-field__input ${validationErrors.password ? 'form-field__input--error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  className="form-field__toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
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
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength__bar">
                    <div 
                      className="password-strength__fill"
                      style={{ 
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getStrengthColor(passwordStrength.score)
                      }}
                    />
                  </div>
                  <div className="password-strength__text">
                    <span style={{ color: getStrengthColor(passwordStrength.score) }}>
                      {getStrengthText(passwordStrength.score)}
                    </span>
                    {passwordStrength.feedback.length > 0 && (
                      <span className="password-strength__feedback">
                        Missing: {passwordStrength.feedback.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {validationErrors.password && (
                <div className="form-field__error">{validationErrors.password}</div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-field__label">
                Confirm New Password
              </label>
              <div className="form-field__input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-field__input ${validationErrors.confirmPassword ? 'form-field__input--error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  className="form-field__toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
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
              {validationErrors.confirmPassword && (
                <div className="form-field__error">{validationErrors.confirmPassword}</div>
              )}
            </div>

            <div className="form-field">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading || success}
                icon={<ShieldIcon />}
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </div>
          </form>

          <div className="auth-form__footer">
            <p className="auth-form__link-text">
              Remember your password?{" "}
              <Link to="/login" className="auth-form__link">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
