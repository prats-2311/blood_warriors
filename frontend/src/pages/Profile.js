import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { profileService } from "../services/profileService";
import { locationService } from "../services/locationService";
import ProfileCompletion from "../components/ProfileCompletion";

const Profile = () => {
  const { profile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    city: "",
    state: "",
    is_available_for_sos: false,
    interests: [],
    // Patient specific fields
    date_of_birth: "",
    medical_conditions: "",
    emergency_contact: "",
    // Donor specific fields
    last_donation_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState({
    isComplete: false,
    completionPercentage: 0,
    missingFields: [],
  });
  const [validationErrors, setValidationErrors] = useState({});

  const loadProfileCompletion = React.useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      const completion = await profileService.getProfileCompletionStatus(
        profile.user_id
      );
      setProfileCompletion(completion);
    } catch (error) {
      console.error("Error loading profile completion:", error);
    }
  }, [profile?.user_id]);

  // Load profile data on component mount
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
        city: profile.city || "",
        state: profile.state || "",
        is_available_for_sos: profile.is_available_for_sos || false,
        interests: profile.interests || [],
        date_of_birth: profile.date_of_birth || "",
        medical_conditions: profile.medical_conditions || "",
        emergency_contact: profile.emergency_contact || "",
        last_donation_date: profile.last_donation_date || "",
      });
      // Load profile completion status
      loadProfileCompletion();
    }
  }, [profile, loadProfileCompletion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Real-time validation
    if (value.trim() !== "") {
      validateField(name, newValue);
    }
  };

  const validateField = (fieldName, value) => {
    const fieldValidation = profileService.validateProfileData(
      { [fieldName]: value },
      profile?.user_type
    );
    if (!fieldValidation.isValid && fieldValidation.errors[fieldName]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: fieldValidation.errors[fieldName],
      }));
    }
  };

  const handleInterestsChange = (e) => {
    const interests = e.target.value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    setFormData((prev) => ({
      ...prev,
      interests,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage(null);
      setValidationErrors({});

      // Validate all form data
      const validation = profileService.validateProfileData(
        formData,
        profile?.user_type
      );
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setMessage({
          type: "error",
          text: "Please fix the validation errors below.",
        });
        return;
      }

      // Update user profile
      await profileService.updateUserProfile(profile.user_id, {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        city: formData.city,
        state: formData.state,
      });

      // Update type-specific data
      if (profile?.user_type === "Donor") {
        await profileService.updateDonorSettings(profile.user_id, {
          is_available_for_sos: formData.is_available_for_sos,
          qloo_taste_keywords: formData.interests,
          last_donation_date: formData.last_donation_date || null,
        });
      } else if (profile?.user_type === "Patient") {
        await profileService.updatePatientInfo(profile.user_id, {
          date_of_birth: formData.date_of_birth,
          medical_conditions: formData.medical_conditions,
          emergency_contact: formData.emergency_contact,
        });
      }

      // Update auth context
      await updateProfile(formData);

      // Reload profile completion
      await loadProfileCompletion();

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setEditing(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const [locationPermission, setLocationPermission] = useState("prompt");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);

  // Check location permission status on mount
  useEffect(() => {
    if (profile?.user_type === "Donor") {
      checkLocationPermission();
    }
  }, [profile?.user_type]);

  const checkLocationPermission = async () => {
    try {
      const permission = await locationService.checkPermissionStatus();
      setLocationPermission(permission);
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };

  const updateLocation = async (options = {}) => {
    const { showConfirmation = true, highAccuracy = true } = options;

    if (showConfirmation) {
      const confirmed = window.confirm(
        "This will update your location to help match you with nearby blood requests. Continue?"
      );
      if (!confirmed) return;
    }

    setLocationLoading(true);
    setMessage(null);

    try {
      // Get current position using location service
      const locationData = await locationService.getCurrentPosition({
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: highAccuracy ? 60000 : 300000, // 1 min for high accuracy, 5 min for quick
      });

      // Update location in database
      await locationService.updateDonorLocation(profile.user_id, locationData);

      // Get address from coordinates
      const address = await locationService.getAddressFromCoordinates(
        locationData.latitude,
        locationData.longitude
      );

      setCurrentLocation(locationData);
      setLocationAddress(address);

      setMessage({
        type: "success",
        text: `Location updated successfully! ${
          address.formatted
        } (±${Math.round(locationData.accuracy)}m)`,
      });

      // Update permission status
      await checkLocationPermission();
    } catch (error) {
      console.error("Location update error:", error);

      if (error.message.includes("denied")) {
        setLocationPermission("denied");
      }

      setMessage({
        type: "error",
        text: error.message || "Failed to update location",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      await updateLocation({ showConfirmation: false });
    } catch (error) {
      console.error("Permission request error:", error);
    }
  };

  return (
    <div className="profile-page">
      {/* Profile Completion Card */}
      {!profileCompletion.isComplete && (
        <ProfileCompletion
          completion={profileCompletion}
          onEditClick={() => setEditing(true)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="user-avatar large">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div className="profile-info-header">
                <h2>{profile?.full_name}</h2>
                <p className="profile-subtitle">{profile?.user_type}</p>
                <span className="blood-type">{profile?.blood_group}</span>

                {/* Profile Completion Indicator */}
                <div className="profile-completion">
                  <div className="completion-bar">
                    <div
                      className="completion-fill"
                      style={{
                        width: `${profileCompletion.completionPercentage}%`,
                      }}
                    ></div>
                  </div>
                  <span className="completion-text">
                    {profileCompletion.completionPercentage}% Complete
                  </span>
                  {profileCompletion.missingFields.length > 0 && (
                    <div className="missing-fields">
                      <small>
                        Missing: {profileCompletion.missingFields.join(", ")}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!editing && (
              <button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                <span>✏️</span>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {message && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="full_name" className="form-label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      className={`form-input ${
                        validationErrors.full_name ? "error" : ""
                      }`}
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />
                    {validationErrors.full_name && (
                      <span className="error-message">
                        {validationErrors.full_name}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone_number" className="form-label">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      className={`form-input ${
                        validationErrors.phone_number ? "error" : ""
                      }`}
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                    {validationErrors.phone_number && (
                      <span className="error-message">
                        {validationErrors.phone_number}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      className={`form-input ${
                        validationErrors.city ? "error" : ""
                      }`}
                      value={formData.city}
                      onChange={handleChange}
                    />
                    {validationErrors.city && (
                      <span className="error-message">
                        {validationErrors.city}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="state" className="form-label">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      className={`form-input ${
                        validationErrors.state ? "error" : ""
                      }`}
                      value={formData.state}
                      onChange={handleChange}
                    />
                    {validationErrors.state && (
                      <span className="error-message">
                        {validationErrors.state}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient-specific fields */}
              {profile?.user_type === "Patient" && (
                <div className="form-section">
                  <h4>Patient Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="date_of_birth" className="form-label">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        className={`form-input ${
                          validationErrors.date_of_birth ? "error" : ""
                        }`}
                        value={formData.date_of_birth}
                        onChange={handleChange}
                      />
                      {validationErrors.date_of_birth && (
                        <span className="error-message">
                          {validationErrors.date_of_birth}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="emergency_contact" className="form-label">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        id="emergency_contact"
                        name="emergency_contact"
                        className={`form-input ${
                          validationErrors.emergency_contact ? "error" : ""
                        }`}
                        value={formData.emergency_contact}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                      />
                      {validationErrors.emergency_contact && (
                        <span className="error-message">
                          {validationErrors.emergency_contact}
                        </span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label
                        htmlFor="medical_conditions"
                        className="form-label"
                      >
                        Medical Conditions
                      </label>
                      <textarea
                        id="medical_conditions"
                        name="medical_conditions"
                        className={`form-input ${
                          validationErrors.medical_conditions ? "error" : ""
                        }`}
                        value={formData.medical_conditions}
                        onChange={handleChange}
                        rows="3"
                        placeholder="List any relevant medical conditions..."
                      />
                      {validationErrors.medical_conditions && (
                        <span className="error-message">
                          {validationErrors.medical_conditions}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Donor-specific fields */}
              {profile?.user_type === "Donor" && (
                <div className="form-section">
                  <h4>Donor Settings</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label
                        htmlFor="last_donation_date"
                        className="form-label"
                      >
                        Last Donation Date
                      </label>
                      <input
                        type="date"
                        id="last_donation_date"
                        name="last_donation_date"
                        className={`form-input ${
                          validationErrors.last_donation_date ? "error" : ""
                        }`}
                        value={formData.last_donation_date}
                        onChange={handleChange}
                      />
                      {validationErrors.last_donation_date && (
                        <span className="error-message">
                          {validationErrors.last_donation_date}
                        </span>
                      )}
                      <small className="form-help">
                        Help us track your donation eligibility
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="is_available_for_sos"
                          checked={formData.is_available_for_sos}
                          onChange={handleChange}
                        />
                        <span className="checkmark"></span>
                        Available for SOS requests
                      </label>
                      <small className="form-help">
                        Enable to receive emergency donation notifications
                      </small>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="interests" className="form-label">
                        Interests
                      </label>
                      <input
                        type="text"
                        id="interests"
                        className={`form-input ${
                          validationErrors.interests ? "error" : ""
                        }`}
                        value={formData.interests.join(", ")}
                        onChange={handleInterestsChange}
                        placeholder="e.g., food, entertainment, travel"
                      />
                      {validationErrors.interests && (
                        <span className="error-message">
                          {validationErrors.interests}
                        </span>
                      )}
                      <small className="form-help">
                        Comma-separated interests help us match you with
                        relevant coupons
                      </small>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(false);
                    setValidationErrors({});
                    setFormData({
                      full_name: profile?.full_name || "",
                      phone_number: profile?.phone_number || "",
                      city: profile?.city || "",
                      state: profile?.state || "",
                      is_available_for_sos:
                        profile?.is_available_for_sos || false,
                      interests: profile?.interests || [],
                      date_of_birth: profile?.date_of_birth || "",
                      medical_conditions: profile?.medical_conditions || "",
                      emergency_contact: profile?.emergency_contact || "",
                      last_donation_date: profile?.last_donation_date || "",
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Email</label>
                  <span className="info-value">{profile?.email}</span>
                </div>

                <div className="info-item">
                  <label className="info-label">Phone Number</label>
                  <span className="info-value">{profile?.phone_number}</span>
                </div>

                <div className="info-item">
                  <label className="info-label">City</label>
                  <span className="info-value">
                    {profile?.city || "Not specified"}
                  </span>
                </div>

                <div className="info-item">
                  <label className="info-label">State</label>
                  <span className="info-value">
                    {profile?.state || "Not specified"}
                  </span>
                </div>

                {profile?.user_type === "Patient" && (
                  <>
                    {profile?.date_of_birth && (
                      <div className="info-item">
                        <label className="info-label">Date of Birth</label>
                        <span className="info-value">
                          {new Date(profile.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {profile?.emergency_contact && (
                      <div className="info-item">
                        <label className="info-label">Emergency Contact</label>
                        <span className="info-value">
                          {profile.emergency_contact}
                        </span>
                      </div>
                    )}

                    {profile?.medical_conditions && (
                      <div className="info-item full-width">
                        <label className="info-label">Medical Conditions</label>
                        <span className="info-value">
                          {profile.medical_conditions}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {profile?.user_type === "Donor" && (
                  <>
                    <div className="info-item">
                      <label className="info-label">SOS Availability</label>
                      <span
                        className={`status-badge ${
                          profile?.is_available_for_sos
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {profile?.is_available_for_sos
                          ? "Available"
                          : "Not Available"}
                      </span>
                    </div>

                    {profile?.last_donation_date && (
                      <div className="info-item">
                        <label className="info-label">Last Donation</label>
                        <span className="info-value">
                          {new Date(
                            profile.last_donation_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {profile?.interests && profile.interests.length > 0 && (
                      <div className="info-item full-width">
                        <label className="info-label">Interests</label>
                        <div className="interests-tags">
                          {profile.interests.map((interest, index) => (
                            <span key={index} className="interest-tag">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {profile?.user_type === "Donor" && (
        <div className="card">
          <div className="card-header">
            <h3>📍 Location Settings</h3>
          </div>
          <div className="card-body">
            <div className="location-settings">
              <div className="location-info">
                <p className="location-description">
                  Update your location to receive nearby donation requests and
                  help save lives faster.
                </p>

                {/* Location Permission Status */}
                <div className="permission-status">
                  <div className="status-item">
                    <span className="status-label">Location Permission:</span>
                    <span
                      className={`permission-badge permission-${locationPermission}`}
                    >
                      {locationPermission === "granted" && "✅ Granted"}
                      {locationPermission === "denied" && "❌ Denied"}
                      {locationPermission === "prompt" && "⏳ Not Set"}
                    </span>
                  </div>

                  {currentLocation && (
                    <div className="status-item">
                      <span className="status-label">Last Updated:</span>
                      <span className="status-value">
                        {currentLocation.timestamp.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {locationAddress && (
                    <div className="status-item">
                      <span className="status-label">Location:</span>
                      <span className="status-value">
                        {locationAddress.formatted}
                      </span>
                    </div>
                  )}

                  {currentLocation && (
                    <div className="status-item">
                      <span className="status-label">Accuracy:</span>
                      <span className="status-value">
                        ±{Math.round(currentLocation.accuracy)}m
                      </span>
                    </div>
                  )}

                  {currentLocation && (
                    <div className="status-item">
                      <span className="status-label">Coordinates:</span>
                      <span className="status-value coordinates">
                        {currentLocation.latitude.toFixed(6)},{" "}
                        {currentLocation.longitude.toFixed(6)}
                        <a
                          href={`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="maps-link"
                          title="View on Google Maps"
                        >
                          🗺️
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Actions */}
              <div className="location-actions">
                {locationPermission === "denied" ? (
                  <div className="permission-help">
                    <p className="help-text">
                      Location access is currently denied. To enable location
                      services:
                    </p>
                    <ol className="help-steps">
                      <li>
                        Click the location icon in your browser's address bar
                      </li>
                      <li>Select "Allow" for location access</li>
                      <li>Refresh the page and try again</li>
                    </ol>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => window.location.reload()}
                    >
                      🔄 Refresh Page
                    </button>
                  </div>
                ) : (
                  <div className="location-buttons">
                    <button
                      className="btn btn-primary"
                      onClick={() => updateLocation({ highAccuracy: true })}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <div className="spinner"></div>
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <span>🎯</span>
                          Update Precise Location
                        </>
                      )}
                    </button>

                    <button
                      className="btn btn-secondary"
                      onClick={() => updateLocation({ highAccuracy: false })}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <div className="spinner"></div>
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <span>📍</span>
                          Quick Location Update
                        </>
                      )}
                    </button>
                  </div>
                )}

                {locationPermission === "prompt" && (
                  <div className="permission-request">
                    <p className="help-text">
                      Grant location permission to receive nearby donation
                      requests.
                    </p>
                    <button
                      className="btn btn-success"
                      onClick={requestLocationPermission}
                      disabled={locationLoading}
                    >
                      <span>🔓</span>
                      Enable Location Services
                    </button>
                  </div>
                )}
              </div>

              {/* Location Privacy Notice */}
              <div className="privacy-notice">
                <h5>🔒 Privacy & Security</h5>
                <ul>
                  <li>Your exact location is never shared with other users</li>
                  <li>
                    We only use your location to match you with nearby requests
                  </li>
                  <li>Location data is encrypted and stored securely</li>
                  <li>You can disable location services at any time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
