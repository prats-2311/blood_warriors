import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { requestService } from "../services/requestService";
import { donorService } from "../services/donorService";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    totalDonations: 0,
    availableCoupons: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent requests
      const requestsData = await requestService.getRequests();
      setRecentRequests(requestsData.data.slice(0, 5));

      if (profile?.user_type === "Patient") {
        // Patient-specific stats
        const myRequests = requestsData.data.filter(
          (req) => req.patient_id === profile.user_id
        );
        setStats((prev) => ({
          ...prev,
          totalRequests: myRequests.length,
          activeRequests: myRequests.filter((req) => req.status === "Open")
            .length,
        }));
      } else if (profile?.user_type === "Donor") {
        // Donor-specific stats
        const notifications = await donorService.getNotifications();
        setRecentNotifications(notifications.data.slice(0, 5));

        const coupons = await donorService.getCoupons("Issued");

        setStats((prev) => ({
          ...prev,
          totalRequests: requestsData.data.length,
          activeRequests: requestsData.data.filter(
            (req) => req.status === "Open"
          ).length,
          availableCoupons: coupons.data.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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
    <div className="dashboard">
      <div className="welcome-section">
        <h2>Welcome back, {profile?.full_name}!</h2>
        <p>Here's what's happening with blood donations today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-2">
        <div className="card">
          <h3>📊 Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{stats.totalRequests}</span>
              <span className="stat-label">
                {profile?.user_type === "Patient"
                  ? "My Requests"
                  : "Total Requests"}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.activeRequests}</span>
              <span className="stat-label">Active Requests</span>
            </div>
            {profile?.user_type === "Donor" && (
              <div className="stat-item">
                <span className="stat-number">{stats.availableCoupons}</span>
                <span className="stat-label">Available Coupons</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>🩸 Blood Type: {profile?.blood_group || "Not specified"}</h3>
          <p>
            {profile?.user_type === "Patient"
              ? "Your blood type helps us match you with compatible donors."
              : "Your blood type determines which patients you can help."}
          </p>
          {profile?.user_type === "Donor" && (
            <div className="donor-status">
              <p>
                <strong>SOS Availability:</strong>{" "}
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
              </p>
              {profile?.last_donation_date && (
                <p>
                  <strong>Last Donation:</strong>{" "}
                  {new Date(profile.last_donation_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-2">
        <div className="card">
          <h3>🔄 Recent Requests</h3>
          {recentRequests.length > 0 ? (
            <div className="request-list">
              {recentRequests.map((request) => (
                <div key={request.request_id} className="request-item">
                  <div className="request-info">
                    <span className="blood-type">{request.blood_group}</span>
                    <span className="component">{request.component}</span>
                    <span
                      className={`urgency urgency-${request.urgency.toLowerCase()}`}
                    >
                      {request.urgency}
                    </span>
                  </div>
                  <div className="request-meta">
                    <span className="units">
                      {request.units_required} units
                    </span>
                    <span className="date">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent requests found.</p>
          )}
          <Link to="/requests" className="btn btn-primary">
            View All Requests
          </Link>
        </div>

        {profile?.user_type === "Donor" && (
          <div className="card">
            <h3>🔔 Recent Notifications</h3>
            {recentNotifications.length > 0 ? (
              <div className="notification-list">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className="notification-item"
                  >
                    <div className="notification-content">
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.sent_at).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`status status-${notification.status.toLowerCase()}`}
                    >
                      {notification.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent notifications.</p>
            )}
            <Link to="/notifications" className="btn btn-primary">
              View All Notifications
            </Link>
          </div>
        )}

        {profile?.user_type === "Patient" && (
          <div className="card">
            <h3>🆘 Quick Actions</h3>
            <div className="quick-actions">
              <Link to="/requests/create" className="btn btn-success">
                Create New Request
              </Link>
              <Link to="/blood-banks" className="btn btn-primary">
                Find Blood Banks
              </Link>
              <Link to="/carebot" className="btn btn-warning">
                Chat with CareBot
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Health Tips */}
      <div className="card">
        <h3>💡 Health Tips</h3>
        <div className="health-tips">
          {profile?.user_type === "Patient" ? (
            <ul>
              <li>
                Take your prescribed medications exactly as directed by your
                doctor
              </li>
              <li>Maintain regular follow-ups with your hematologist</li>
              <li>
                Monitor your iron levels regularly to prevent iron overload
              </li>
              <li>Stay up to date with vaccinations to prevent infections</li>
            </ul>
          ) : (
            <ul>
              <li>
                Stay hydrated by drinking plenty of water before and after
                donation
              </li>
              <li>Eat iron-rich foods to maintain healthy blood levels</li>
              <li>Get adequate rest before donating blood</li>
              <li>Wait at least 8 weeks between whole blood donations</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
