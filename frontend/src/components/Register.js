import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

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
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBloodGroups();
  }, []);

  const fetchBloodGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("bloodgroups")
        .select("*")
        .order("blood_group_id");

      if (error) throw error;
      setBloodGroups(data || []);
    } catch (error) {
      console.error("Error fetching blood groups:", error);
      setError("Failed to load blood groups. Please refresh the page.");
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const registrationData = { ...formData };
      delete registrationData.confirmPassword;

      const result = await register(registrationData);

      // Check if email confirmation is required
      if (result?.needsConfirmation) {
        setError(null);
        // Show success message instead of error
        alert(
          "Registration successful! Please check your email to confirm your account, then you can login."
        );
        navigate("/login");
      } else {
        // Registration successful and logged in
        navigate("/dashboard");
      }
    } catch (error) {
      setError(error.message || "Failed to register");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>🩸 Join Blood Warriors</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full Name *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Phone Number *</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min 6 characters)"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter your city"
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter your state"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user_type">I am a *</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              required
            >
              <option value="Patient">Patient (Need Blood)</option>
              <option value="Donor">Donor (Donate Blood)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="blood_group_id">Blood Group *</label>
            <select
              id="blood_group_id"
              name="blood_group_id"
              value={formData.blood_group_id}
              onChange={handleChange}
              required
            >
              <option value="">Select your blood group</option>
              {bloodGroups.map((group) => (
                <option key={group.blood_group_id} value={group.blood_group_id}>
                  {group.group_name}
                </option>
              ))}
            </select>
            {bloodGroups.length === 0 && (
              <small style={{ color: "#e53e3e", fontSize: "12px" }}>
                Loading blood groups...
              </small>
            )}
          </div>

          {formData.user_type === "Patient" && (
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth *</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-link">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")}>Sign In</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
