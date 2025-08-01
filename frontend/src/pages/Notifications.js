import React, { useState, useEffect } from "react";
import { donorService } from "../services/donorService";
import { useProfile } from "../hooks/useAuth";

const Notifications = () => {
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      const data = await donorService.getNotifications(profile.user_id, filter || null);
      setNotifications(data.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
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
    <div className="notifications-page">
      <div className="page-header">
        <h2>My Notifications</h2>
      </div>

      <div className="card">
        <h3>Filter Notifications</h3>
        <div className="form-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Notifications</option>
            <option value="Sent">Sent</option>
            <option value="Read">Read</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className="card notification-card"
            >
              <div className="notification-header">
                <span
                  className={`status status-${notification.status.toLowerCase()}`}
                >
                  {notification.status}
                </span>
                <span className="notification-time">
                  {new Date(notification.sent_at).toLocaleString()}
                </span>
              </div>

              <div className="notification-content">
                <p>{notification.message}</p>

                <div className="request-details">
                  <span className="blood-type">{notification.blood_group}</span>
                  <span className="component">{notification.component}</span>
                  <span
                    className={`urgency urgency-${notification.request_urgency.toLowerCase()}`}
                  >
                    {notification.request_urgency}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <p>No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
