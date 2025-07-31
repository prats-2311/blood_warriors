import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button, { HeartIcon, ShieldIcon } from "./ui/Button";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage(null);

      await login(formData.email, formData.password);
      navigate("/app/dashboard");
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to login",
      });
    } finally {
      setLoading(false);
    }
  };

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

          {message && (
            <div className={`auth-form__alert auth-form__alert--${message.type}`}>
              <div className="alert-icon">
                {message.type === 'error' ? '⚠️' : '✅'}
              </div>
              <span>{message.text}</span>
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
                  className="form-field__input"
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
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-field__label">
                Password
              </label>
              <div className="form-field__input-wrapper">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-field__input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <div className="form-field__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="form-field">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={<ShieldIcon />}
              >
                {loading ? "Signing In..." : "Sign In"}
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
