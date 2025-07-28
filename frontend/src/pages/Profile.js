import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { donorService } from "../services/donorService";

const Profile = () => {
  const { profile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone_number: profile?.phone_number || "",
    city: profile?.city || "",
    state: profile?.state || "",
    is_available_for_sos: profile?.is_available_for_sos || false,
    interests: profile?.interests || [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

      await updateProfile(formData);

      // Update donor-specific data if user is a donor
      if (profile?.user_type === "Donor") {
        if (formData.is_available_for_sos !== profile?.is_available_for_sos) {
          await donorService.toggleSosAvailability(
            formData.is_available_for_sos
          );
        }

        if (formData.interests.length > 0) {
          await donorService.updateInterests(formData.interests);
        }
      }

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

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      setMessage({
        type: "error",
        text: "Geolocation is not supported by this browser",
      });
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await donorService.updateLocation(latitude, longitude);
          setMessage({
            type: "success",
            text: "Location updated successfully!",
          });
        } catch (error) {
          setMessage({ type: "error", text: "Failed to update location" });
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setMessage({ type: "error", text: "Failed to get your location" });
        setLocationLoading(false);
      }
    );
  };

  return (
    <div className="profile-page">
      <div className="card">
        <div className="profile-header">
          <h2>My Profile</h2>
          {!editing && (
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
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
              />
            </div>

            {profile?.user_type === "Donor" && (
              <>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_available_for_sos"
                      checked={formData.is_available_for_sos}
                      onChange={handleChange}
                    />
                    Available for SOS requests
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="interests">Interests (comma-separated)</label>
                  <input
                    type="text"
                    id="interests"
                    value={formData.interests.join(", ")}
                    onChange={handleInterestsChange}
                    placeholder="e.g., food, entertainment, travel"
                  />
                  <small>
                    These help us match you with relevant coupons and offers
                  </small>
                </div>
              </>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    full_name: profile?.full_name || "",
                    phone_number: profile?.phone_number || "",
                    city: profile?.city || "",
                    state: profile?.state || "",
                    is_available_for_sos:
                      profile?.is_available_for_sos || false,
                    interests: profile?.interests || [],
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
                <label>Full Name</label>
                <span>{profile?.full_name}</span>
              </div>

              <div className="info-item">
                <label>Email</label>
                <span>{profile?.email}</span>
              </div>

              <div className="info-item">
                <label>Phone Number</label>
                <span>{profile?.phone_number}</span>
              </div>

              <div className="info-item">
                <label>City</label>
                <span>{profile?.city || "Not specified"}</span>
              </div>

              <div className="info-item">
                <label>State</label>
                <span>{profile?.state || "Not specified"}</span>
              </div>

              <div className="info-item">
                <label>User Type</label>
                <span>{profile?.user_type}</span>
              </div>

              <div className="info-item">
                <label>Blood Group</label>
                <span>{profile?.blood_group}</span>
              </div>

              {profile?.user_type === "Patient" && profile?.date_of_birth && (
                <div className="info-item">
                  <label>Date of Birth</label>
                  <span>
                    {new Date(profile.date_of_birth).toLocaleDateString()}
                  </span>
                </div>
              )}

              {profile?.user_type === "Donor" && (
                <>
                  <div className="info-item">
                    <label>SOS Availability</label>
                    <span
                      className={
                        profile?.is_available_for_sos
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {profile?.is_available_for_sos
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>

                  {profile?.last_donation_date && (
                    <div className="info-item">
                      <label>Last Donation</label>
                      <span>
                        {new Date(
                          profile.last_donation_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {profile?.interests && profile.interests.length > 0 && (
                    <div className="info-item">
                      <label>Interests</label>
                      <span>{profile.interests.join(", ")}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {profile?.user_type === "Donor" && (
        <div className="card">
          <h3>Location Settings</h3>
          <p>Update your location to receive nearby donation requests.</p>
          <button
            className="btn btn-primary"
            onClick={updateLocation}
            disabled={locationLoading}
          >
            {locationLoading
              ? "Updating Location..."
              : "Update Current Location"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
