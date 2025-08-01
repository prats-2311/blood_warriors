import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const CreateRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    blood_group_id: "",
    component_id: "",
    units_required: 1,
    urgency: "Urgent",
    hospital_name: "",
    hospital_address: "",
    notes: "",
    latitude: "",
    longitude: "",
  });
  const [bloodGroups, setBloodGroups] = useState([]);
  const [bloodComponents, setBloodComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      // Mock data for now - replace with actual API calls
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

      setBloodComponents([
        { component_id: 1, component_name: "Whole Blood" },
        { component_id: 2, component_name: "Packed Red Blood Cells" },
        { component_id: 3, component_name: "Platelets" },
        { component_id: 4, component_name: "Plasma" },
        { component_id: 5, component_name: "Cryoprecipitate" },
      ]);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load form data" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage({
        type: "error",
        text: "Geolocation is not supported by this browser",
      });
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocationLoading(false);
        setMessage({
          type: "success",
          text: "Location captured successfully!",
        });
      },
      (error) => {
        setMessage({ type: "error", text: "Failed to get your location" });
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage(null);

      const requestData = {
        ...formData,
        blood_group_id: parseInt(formData.blood_group_id),
        component_id: parseInt(formData.component_id),
        units_required: parseInt(formData.units_required),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      // Mock API call
      console.log("Creating request:", requestData);

      setMessage({
        type: "success",
        text: "Blood request created successfully!",
      });

      // Redirect to requests page after a short delay
      setTimeout(() => {
        navigate("/app/requests");
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create request",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-request-page">
      <div className="page-header">
        <div className="page-title-section">
          <h2>Create Blood Request</h2>
          <p className="page-subtitle">
            Fill out the form below to create a new blood donation request
          </p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="form-container">
        <div className="card">
          <div className="card-header">
            <h3>🩸 Request Details</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="blood_group_id" className="form-label">
                    Blood Group *
                  </label>
                  <select
                    id="blood_group_id"
                    name="blood_group_id"
                    className="form-select"
                    value={formData.blood_group_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((group) => (
                      <option
                        key={group.blood_group_id}
                        value={group.blood_group_id}
                      >
                        {group.group_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="component_id" className="form-label">
                    Blood Component *
                  </label>
                  <select
                    id="component_id"
                    name="component_id"
                    className="form-select"
                    value={formData.component_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Blood Component</option>
                    {bloodComponents.map((component) => (
                      <option
                        key={component.component_id}
                        value={component.component_id}
                      >
                        {component.component_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="units_required" className="form-label">
                    Units Required *
                  </label>
                  <input
                    type="number"
                    id="units_required"
                    name="units_required"
                    className="form-input"
                    value={formData.units_required}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    required
                  />
                  <small className="form-help">
                    Number of units needed (1-10)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="urgency" className="form-label">
                    Urgency Level *
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    className="form-select"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Urgent">Urgent</option>
                    <option value="SOS">SOS (Emergency)</option>
                  </select>
                  <small className="form-help">
                    SOS requests will immediately notify nearby donors
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h4>🏥 Hospital Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="hospital_name" className="form-label">
                      Hospital Name
                    </label>
                    <input
                      type="text"
                      id="hospital_name"
                      name="hospital_name"
                      className="form-input"
                      value={formData.hospital_name}
                      onChange={handleChange}
                      placeholder="Enter hospital name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hospital_address" className="form-label">
                      Hospital Address
                    </label>
                    <input
                      type="text"
                      id="hospital_address"
                      name="hospital_address"
                      className="form-input"
                      value={formData.hospital_address}
                      onChange={handleChange}
                      placeholder="Enter hospital address"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>📍 Location (Optional but Recommended)</h4>
                <div className="location-input">
                  <div className="location-fields">
                    <div className="form-group">
                      <label htmlFor="latitude" className="form-label">
                        Latitude
                      </label>
                      <input
                        type="number"
                        id="latitude"
                        name="latitude"
                        className="form-input"
                        placeholder="Latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        step="any"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="longitude" className="form-label">
                        Longitude
                      </label>
                      <input
                        type="number"
                        id="longitude"
                        name="longitude"
                        className="form-input"
                        placeholder="Longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        step="any"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary location-btn"
                    onClick={getCurrentLocation}
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
                        Use Current Location
                      </>
                    )}
                  </button>
                </div>
                <small className="form-help">
                  Providing your location helps us find nearby donors faster
                </small>
              </div>

              <div className="form-section">
                <h4>📝 Additional Notes</h4>
                <div className="form-group">
                  <label htmlFor="notes" className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-textarea"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional information about the request..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Creating Request...
                    </>
                  ) : (
                    <>
                      <span>🩸</span>
                      Create Request
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/app/requests")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card info-card">
          <div className="card-header">
            <h3>ℹ️ Important Information</h3>
          </div>
          <div className="card-body">
            <div className="info-list">
              <div className="info-item-card">
                <div className="info-icon sos">🆘</div>
                <div className="info-content">
                  <h4>SOS Requests</h4>
                  <p>Will immediately notify all nearby compatible donors</p>
                </div>
              </div>
              <div className="info-item-card">
                <div className="info-icon urgent">⚡</div>
                <div className="info-content">
                  <h4>Urgent Requests</h4>
                  <p>Will be prioritized in donor notifications</p>
                </div>
              </div>
              <div className="info-item-card">
                <div className="info-icon scheduled">📅</div>
                <div className="info-content">
                  <h4>Scheduled Requests</h4>
                  <p>For planned procedures and regular transfusions</p>
                </div>
              </div>
              <div className="info-item-card">
                <div className="info-icon location">📍</div>
                <div className="info-content">
                  <h4>Location</h4>
                  <p>Helps us find the closest available donors</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequest;
