import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../hooks/useAuth";
import { requestService } from "../services/requestService";
import { publicDataService } from "../services/publicDataService";


const Requests = () => {
  const { profile } = useProfile();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "",
    urgency: "",
    blood_group: "",
  });
  const [message, setMessage] = useState(null);
  // Load requests on component mount
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Fetch requests from API
      const response = await requestService.getAllRequests();

      if (response.status === "success") {
        setRequests(response.data || []);
      } else {
        setMessage({ type: "error", text: "Failed to load requests" });
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      setMessage({ type: "error", text: "Failed to load requests" });

      // Fallback to mock data if API fails
      const mockRequests = [
        {
          request_id: "1",
          blood_group: "O+",
          component: "Whole Blood",
          urgency: "SOS",
          status: "Open",
          units_required: 2,
          created_at: new Date().toISOString(),
          patient_name: "John Doe",
          patient_id:
            profile?.user_type === "Patient" ? profile.user_id : "other",
          hospital_name: "City Hospital",
          notes: "Urgent surgery required",
        },
        {
          request_id: "2",
          blood_group: "A+",
          component: "Platelets",
          urgency: "Urgent",
          status: "Open",
          units_required: 1,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          patient_name: "Jane Smith",
          patient_id: "other",
          hospital_name: "General Hospital",
          notes: "Cancer treatment support",
        },
      ];
      setRequests(mockRequests);
    } finally {
      setLoading(false);
    }
  };



  const handleRespond = async (requestId, response) => {
    try {
      // Call API to respond to request
      await requestService.respondToRequest(requestId, { response });

      setMessage({
        type: "success",
        text: `Successfully ${
          response === "accept" ? "accepted" : "declined"
        } the request`,
      });

      // Refresh requests
      fetchRequests();
      fetchRequests();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to respond to request" });
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      // Mock API call
      setMessage({
        type: "success",
        text: "Request status updated successfully",
      });
      fetchRequests();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update request status" });
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="requests-page">
      <div className="page-header">
        <div className="page-title-section">
          <h2>
            {profile?.user_type === "Patient"
              ? "My Blood Requests"
              : "Available Blood Requests"}
          </h2>
          <p className="page-subtitle">
            {profile?.user_type === "Patient"
              ? "Track and manage your blood donation requests"
              : "Find requests that match your blood type and help save lives"}
          </p>
        </div>
        {profile?.user_type === "Patient" && (
          <Link to="/app/requests/create" className="btn btn-primary">
            <span>➕</span>
            Create New Request
          </Link>
        )}
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h3>🔍 Filter Requests</h3>
        </div>
        <div className="card-body">
          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                className="form-select"
                value={filter.status}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="urgency" className="form-label">
                Urgency
              </label>
              <select
                id="urgency"
                className="form-select"
                value={filter.urgency}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, urgency: e.target.value }))
                }
              >
                <option value="">All Urgencies</option>
                <option value="SOS">SOS</option>
                <option value="Urgent">Urgent</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="blood_group" className="form-label">
                Blood Group
              </label>
              <select
                id="blood_group"
                className="form-select"
                value={filter.blood_group}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    blood_group: e.target.value,
                  }))
                }
              >
                <option value="">All Blood Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-list">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request.request_id} className="card request-card">
              <div className="card-header">
                <div className="request-header">
                  <div className="request-badges">
                    <span className="blood-type">{request.blood_group}</span>
                    <span className="component">{request.component}</span>
                    <span
                      className={`urgency urgency-${request.urgency.toLowerCase()}`}
                    >
                      {request.urgency}
                    </span>
                    <span
                      className={`badge badge-${request.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="request-meta">
                    <span className="units">
                      <strong>{request.units_required}</strong> units needed
                    </span>
                    <span className="date">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="request-details">
                  <div className="detail-item">
                    <span className="detail-label">Patient:</span>
                    <span className="detail-value">{request.patient_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hospital:</span>
                    <span className="detail-value">
                      {request.hospital_name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(request.created_at).toLocaleString()}
                    </span>
                  </div>
                  {request.notes && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{request.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <div className="request-actions">
                  {profile?.user_type === "Donor" &&
                    request.status === "Open" && (
                      <div className="donor-actions">
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            handleRespond(request.request_id, "accept")
                          }
                        >
                          <span>✅</span>
                          Accept Request
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            handleRespond(request.request_id, "decline")
                          }
                        >
                          <span>❌</span>
                          Decline
                        </button>
                      </div>
                    )}

                  {profile?.user_type === "Patient" &&
                    request.patient_id === profile.user_id && (
                      <div className="patient-actions">
                        {request.status === "Open" && (
                          <button
                            className="btn btn-warning"
                            onClick={() =>
                              handleStatusUpdate(
                                request.request_id,
                                "Cancelled"
                              )
                            }
                          >
                            <span>🚫</span>
                            Cancel Request
                          </button>
                        )}
                        {request.status === "In Progress" && (
                          <button
                            className="btn btn-success"
                            onClick={() =>
                              handleStatusUpdate(
                                request.request_id,
                                "Fulfilled"
                              )
                            }
                          >
                            <span>✅</span>
                            Mark as Fulfilled
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card empty-state-card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-icon">🩸</div>
                <h3>No requests found</h3>
                <p>No requests match your current filter criteria.</p>
                {profile?.user_type === "Patient" && (
                  <Link to="/app/requests/create" className="btn btn-primary">
                    <span>➕</span>
                    Create Your First Request
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
