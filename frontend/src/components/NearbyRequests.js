import React, { useState, useEffect } from "react";
import { locationService } from "../services/locationService";
import { Link } from "react-router-dom";

const NearbyRequests = ({ userLocation, bloodGroup, maxDistance = 50 }) => {
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(maxDistance);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyRequests();
    }
  }, [userLocation, selectedRadius]);

  const fetchNearbyRequests = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const requests = await locationService.getNearbyRequests(
        userLocation.latitude,
        userLocation.longitude,
        selectedRadius
      );

      // Calculate distances and sort by proximity
      const requestsWithDistance = requests
        .map((request) => ({
          ...request,
          distance: locationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            request.latitude,
            request.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance);

      setNearbyRequests(requestsWithDistance);
    } catch (err) {
      console.error("Error fetching nearby requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const radiusOptions = [10, 25, 50, 100, 200];

  if (!userLocation) {
    return (
      <div className="nearby-requests">
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <p>Enable location services to see nearby blood requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-requests">
      <div className="nearby-header">
        <h3>🩸 Nearby Blood Requests</h3>
        <div className="radius-selector">
          <label htmlFor="radius">Within:</label>
          <select
            id="radius"
            value={selectedRadius}
            onChange={(e) => setSelectedRadius(parseInt(e.target.value))}
            className="form-control form-control-sm"
          >
            {radiusOptions.map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Finding nearby requests...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchNearbyRequests}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {nearbyRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No blood requests found within {selectedRadius} km</p>
              <p className="empty-subtitle">
                Try increasing the search radius or check back later
              </p>
            </div>
          ) : (
            <div className="requests-list">
              <div className="requests-summary">
                <p>
                  Found {nearbyRequests.length} request
                  {nearbyRequests.length !== 1 ? "s" : ""}
                  within {selectedRadius} km of your location
                </p>
              </div>

              {nearbyRequests.map((request) => (
                <div key={request.request_id} className="nearby-request-card">
                  <div className="request-header">
                    <div className="blood-info">
                      <span className="blood-type">{request.blood_group}</span>
                      <span className="component">{request.component}</span>
                      <span
                        className={`urgency urgency-${request.urgency.toLowerCase()}`}
                      >
                        {request.urgency}
                      </span>
                    </div>
                    <div className="distance-info">
                      <span className="distance">
                        {request.distance} km away
                      </span>
                    </div>
                  </div>

                  <div className="request-details">
                    <div className="detail-item">
                      <span className="detail-label">Hospital:</span>
                      <span className="detail-value">
                        {request.hospital_name}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Units needed:</span>
                      <span className="detail-value">
                        {request.units_required}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Requested:</span>
                      <span className="detail-value">
                        {new Date(
                          request.request_datetime
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="request-actions">
                    <Link
                      to={`/app/requests/${request.request_id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => {
                        // Handle respond to request
                        console.log(
                          "Responding to request:",
                          request.request_id
                        );
                      }}
                    >
                      🩸 Respond
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${request.latitude},${request.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      📍 Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyRequests;
