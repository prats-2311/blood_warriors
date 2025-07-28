import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { requestService } from "../services/requestService";

const Requests = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", urgency: "" });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequests(filter);
      setRequests(data.data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch requests" });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, response) => {
    try {
      await requestService.respondToRequest(requestId, response);
      setMessage({
        type: "success",
        text: `Successfully ${
          response === "accept" ? "accepted" : "declined"
        } the request`,
      });
      fetchRequests();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to respond to request" });
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await requestService.updateRequestStatus(requestId, status);
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
        <h2>
          {profile?.user_type === "Patient"
            ? "My Blood Requests"
            : "Available Blood Requests"}
        </h2>
        {profile?.user_type === "Patient" && (
          <Link to="/requests/create" className="btn btn-primary">
            Create New Request
          </Link>
        )}
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Filters */}
      <div className="card">
        <h3>Filters</h3>
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
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
            <label htmlFor="urgency">Urgency</label>
            <select
              id="urgency"
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
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-list">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request.request_id} className="card request-card">
              <div className="request-header">
                <div className="request-info">
                  <span className="blood-type">{request.blood_group}</span>
                  <span className="component">{request.component}</span>
                  <span
                    className={`urgency urgency-${request.urgency.toLowerCase()}`}
                  >
                    {request.urgency}
                  </span>
                  <span
                    className={`status status-${request.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="request-meta">
                  <span className="units">
                    {request.units_required} units needed
                  </span>
                  <span className="date">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="request-details">
                <p>
                  <strong>Patient:</strong> {request.patient_name}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>

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
                        Accept
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          handleRespond(request.request_id, "decline")
                        }
                      >
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
                            handleStatusUpdate(request.request_id, "Cancelled")
                          }
                        >
                          Cancel Request
                        </button>
                      )}
                      {request.status === "In Progress" && (
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            handleStatusUpdate(request.request_id, "Fulfilled")
                          }
                        >
                          Mark as Fulfilled
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <p>No requests found matching your criteria.</p>
            {profile?.user_type === "Patient" && (
              <Link to="/requests/create" className="btn btn-primary">
                Create Your First Request
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
