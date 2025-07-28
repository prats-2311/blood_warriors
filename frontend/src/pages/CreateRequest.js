import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestService } from "../services/requestService";
import { publicDataService } from "../services/publicDataService";

const CreateRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    blood_group_id: "",
    component_id: "",
    units_required: 1,
    urgency: "Urgent",
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
      const [groupsData, componentsData] = await Promise.all([
        publicDataService.getBloodGroups(),
        publicDataService.getBloodComponents(),
      ]);

      setBloodGroups(groupsData.data);
      setBloodComponents(componentsData.data);
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

      await requestService.createRequest(requestData);

      setMessage({
        type: "success",
        text: "Blood request created successfully!",
      });

      // Redirect to requests page after a short delay
      setTimeout(() => {
        navigate("/requests");
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
      <div className="card">
        <h2>Create Blood Request</h2>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="blood_group_id">Blood Group *</label>
            <select
              id="blood_group_id"
              name="blood_group_id"
              value={formData.blood_group_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map((group) => (
                <option key={group.blood_group_id} value={group.blood_group_id}>
                  {group.group_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="component_id">Blood Component *</label>
            <select
              id="component_id"
              name="component_id"
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
            <label htmlFor="units_required">Units Required *</label>
            <input
              type="number"
              id="units_required"
              name="units_required"
              value={formData.units_required}
              onChange={handleChange}
              min="1"
              max="10"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="urgency">Urgency Level *</label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              required
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Urgent">Urgent</option>
              <option value="SOS">SOS (Emergency)</option>
            </select>
            <small>SOS requests will immediately notify nearby donors</small>
          </div>

          <div className="form-group">
            <label>Location (Optional but Recommended)</label>
            <div className="location-input">
              <div className="location-fields">
                <input
                  type="number"
                  name="latitude"
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                />
                <input
                  type="number"
                  name="longitude"
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading
                  ? "Getting Location..."
                  : "Use Current Location"}
              </button>
            </div>
            <small>
              Providing your location helps us find nearby donors faster
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating Request..." : "Create Request"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/requests")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Important Information</h3>
        <ul>
          <li>
            <strong>SOS Requests:</strong> Will immediately notify all nearby
            compatible donors
          </li>
          <li>
            <strong>Urgent Requests:</strong> Will be prioritized in donor
            notifications
          </li>
          <li>
            <strong>Scheduled Requests:</strong> For planned procedures and
            regular transfusions
          </li>
          <li>
            <strong>Location:</strong> Helps us find the closest available
            donors
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CreateRequest;
