import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRegister, useGuestOnly } from "../hooks/useAuth";
import { publicDataService } from "../services/publicDataService";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    full_name: "",
    city: "",
    state: "",
    user_type: "Patient",
    blood_group_id: "",
    date_of_birth: "",
  });
  const [bloodGroups, setBloodGroups] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const { isGuest, loading: authLoading } = useGuestOnly();
  const { handleRegister, isLoading, error, clearError } = useRegister();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBloodGroups();
  }, []);

  // Clear validation errors when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
    setValidationErrors({});
  }, [formData.email, formData.password, formData.confirmPassword, formData.full_name, formData.phone_number]);

  const fetchBloodGroups = async () => {
    try {
      const response = await publicDataService.getBloodGroups();
      setBloodGroups(response.data || []);
    } catch (error) {
      console.error("Error fetching blood groups:", error);
      // Fallback blood groups if API fails
      setBloodGroups([
        { blood_group_id: 1, group_name: "A+" },
        { blood_group_id: 2, group_name: "A-" },
        { blood_group_id: 3, group_name: "B+" },
        { blood_group_id: 4, group_name: "B-" },
        { blood_group_id: 5, group_name: "AB+" },
        { blood_group_id: 6, group_name: "AB-" },
        { blood_group_id: 7, group_name: "O+" },
        { blood_group_id: 8, group_name: "O-" },
      ]);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Full name validation
    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone_number) {
      errors.phone_number = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone_number)) {
      errors.phone_number = "Please enter a valid phone number";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Blood group validation
    if (!formData.blood_group_id) {
      errors.blood_group_id = "Please select your blood group";
    }

    // Date of birth validation for patients
    if (formData.user_type === "Patient" && !formData.date_of_birth) {
      errors.date_of_birth = "Date of birth is required for patients";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous errors
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    const registrationData = { ...formData };
    delete registrationData.confirmPassword;

    // Convert blood_group_id to number
    if (registrationData.blood_group_id) {
      registrationData.blood_group_id = parseInt(registrationData.blood_group_id, 10);
    }

    // Remove date_of_birth if user is not a patient
    if (registrationData.user_type !== "Patient") {
      delete registrationData.date_of_birth;
    }

    await handleRegister(registrationData, {
      redirectTo: "/login"
    });
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="register-page">
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      {/* Hero Background */}
      <div className="register-hero">
        <div className="register-hero__content">
          <div className="register-hero__badge">
            <span>🩸</span>
            <span>Blood Warriors</span>
          </div>
          <h1 className="register-hero__title">
            Join the Fight<br />
            <span className="text-gradient">Save Lives Together</span>
          </h1>
          <p className="register-hero__subtitle">
            Become part of India's largest blood donation network. 
            Connect with patients, donors, and make a real difference.
          </p>
          <div className="register-hero__features">
            <div className="feature-item">
              <div className="feature-icon">🚨</div>
              <div className="feature-text">Emergency SOS Network</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div className="feature-text">AI-Powered CareBot Support</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎁</div>
              <div className="feature-text">Donor Rewards & Perks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="register-form-container">
        <div className="register-form">
          <div className="register-form__header">
            <div className="register-form__icon">
              🩸
            </div>
            <h2 className="register-form__title">Create Account</h2>
            <p className="register-form__subtitle">
              Join thousands of blood warriors making a difference
            </p>
          </div>

          {error && (
            <div className="register-form__alert register-form__alert--error">
              <div className="alert-icon">⚠️</div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form__form">
            {/* Personal Information */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="full_name" className="form-field__label form-field__label--required">
                  Full Name
                </label>
                <div className="form-field__input-wrapper">
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    className={`form-field__input ${validationErrors.full_name ? 'form-field__input--error' : ''}`}
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="form-field__icon">👤</div>
                </div>
                {validationErrors.full_name && (
                  <div className="form-field__error">{validationErrors.full_name}</div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="phone_number" className="form-field__label form-field__label--required">
                  Phone Number
                </label>
                <div className="form-field__input-wrapper">
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    className={`form-field__input ${validationErrors.phone_number ? 'form-field__input--error' : ''}`}
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                  <div className="form-field__icon">📱</div>
                </div>
                {validationErrors.phone_number && (
                  <div className="form-field__error">{validationErrors.phone_number}</div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="form-field">
              <label htmlFor="email" className="form-field__label form-field__label--required">
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
                <div className="form-field__icon">📧</div>
              </div>
              {validationErrors.email && (
                <div className="form-field__error">{validationErrors.email}</div>
              )}
            </div>

            {/* Location */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="city" className="form-field__label">
                  City
                </label>
                <div className="form-field__input-wrapper">
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="form-field__input"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city"
                  />
                  <div className="form-field__icon">🏙️</div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="state" className="form-field__label">
                  State
                </label>
                <div className="form-field__input-wrapper">
                  <input
                    type="text"
                    id="state"
                    name="state"
                    className="form-field__input"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter your state"
                  />
                  <div className="form-field__icon">📍</div>
                </div>
              </div>
            </div>

            {/* User Type Selection */}
            <div className="form-field form-field--full">
              <label className="form-field__label form-field__label--required">
                I am a
              </label>
              <div className="user-type-selector">
                <div className="user-type-option">
                  <input
                    type="radio"
                    id="user_type_patient"
                    name="user_type"
                    value="Patient"
                    checked={formData.user_type === "Patient"}
                    onChange={handleChange}
                  />
                  <label htmlFor="user_type_patient" className="user-type-card">
                    <div className="user-type-icon">🩺</div>
                    <div>
                      <div className="user-type-title">Patient</div>
                      <div className="user-type-description">I need blood donations</div>
                    </div>
                  </label>
                </div>
                <div className="user-type-option">
                  <input
                    type="radio"
                    id="user_type_donor"
                    name="user_type"
                    value="Donor"
                    checked={formData.user_type === "Donor"}
                    onChange={handleChange}
                  />
                  <label htmlFor="user_type_donor" className="user-type-card">
                    <div className="user-type-icon">❤️</div>
                    <div>
                      <div className="user-type-title">Donor</div>
                      <div className="user-type-description">I want to donate blood</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Blood Group and Date of Birth */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="blood_group_id" className="form-field__label form-field__label--required">
                  Blood Group
                </label>
                <div className="form-field__input-wrapper">
                  <select
                    id="blood_group_id"
                    name="blood_group_id"
                    className={`form-field__select ${validationErrors.blood_group_id ? 'form-field__input--error' : ''}`}
                    value={formData.blood_group_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select blood group</option>
                    {bloodGroups.map((group) => (
                      <option key={group.blood_group_id} value={group.blood_group_id}>
                        {group.group_name}
                      </option>
                    ))}
                  </select>
                  <div className="form-field__icon">🩸</div>
                </div>
                {validationErrors.blood_group_id && (
                  <div className="form-field__error">{validationErrors.blood_group_id}</div>
                )}
                {bloodGroups.length === 0 && (
                  <div className="form-field__help">Loading blood groups...</div>
                )}
              </div>

              {formData.user_type === "Patient" && (
                <div className="form-field">
                  <label htmlFor="date_of_birth" className="form-field__label form-field__label--required">
                    Date of Birth
                  </label>
                  <div className="form-field__input-wrapper">
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      className={`form-field__input ${validationErrors.date_of_birth ? 'form-field__input--error' : ''}`}
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required
                    />
                    <div className="form-field__icon">📅</div>
                  </div>
                  {validationErrors.date_of_birth && (
                    <div className="form-field__error">{validationErrors.date_of_birth}</div>
                  )}
                </div>
              )}
            </div>

            {/* Password Fields */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="password" className="form-field__label form-field__label--required">
                  Password
                </label>
                <div className="form-field__input-wrapper">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`form-field__input ${validationErrors.password ? 'form-field__input--error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    minLength="6"
                  />
                  <div className="form-field__icon">🔒</div>
                </div>
                {validationErrors.password && (
                  <div className="form-field__error">{validationErrors.password}</div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword" className="form-field__label form-field__label--required">
                  Confirm Password
                </label>
                <div className="form-field__input-wrapper">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-field__input ${validationErrors.confirmPassword ? 'form-field__input--error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    minLength="6"
                  />
                  <div className="form-field__icon">🔐</div>
                </div>
                {validationErrors.confirmPassword && (
                  <div className="form-field__error">{validationErrors.confirmPassword}</div>
                )}
              </div>
            </div>

            <button type="submit" className="register-form__submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="submit-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  🩸 Create Account
                </>
              )}
            </button>
          </form>

          <div className="register-form__footer">
            <div className="register-form__link-text">
              Already have an account?{" "}
              <button 
                type="button"
                className="register-form__link" 
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
