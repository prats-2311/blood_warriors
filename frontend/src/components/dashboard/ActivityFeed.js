import React, { useState } from "react";
import { Link } from "react-router-dom";

const ActivityFeed = ({
  title,
  items = [],
  type = "requests",
  emptyMessage = "No recent activity",
  linkTo = null,
  onItemClick = null,
  loading = false,
  maxItems = 3,
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? items : items.slice(0, maxItems);

  const renderRequestItem = (request) => (
    <div
      key={request.request_id}
      className={`activity-item ${onItemClick ? "clickable" : ""}`}
      onClick={() => onItemClick && onItemClick(request)}
    >
      <div className="activity-icon">
        <span className="blood-type">
          {request.blood_group_name || request.blood_group}
        </span>
      </div>
      <div className="activity-content">
        <div className="activity-main">
          <span className="activity-title">
            {request.component_name || request.component} -{" "}
            {request.units_required} units
          </span>
          <span className={`urgency urgency-${request.urgency.toLowerCase()}`}>
            {request.urgency}
          </span>
        </div>
        <div className="activity-meta">
          <span className="activity-location">{request.hospital_name}</span>
          <span className="activity-time">
            {new Date(
              request.request_datetime || request.created_at
            ).toLocaleDateString()}
          </span>
          {request.status && (
            <span
              className={`badge badge-${request.status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {request.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationItem = (notification) => (
    <div
      key={notification.notification_id}
      className={`activity-item ${
        notification.status === "Sent" ? "unread" : ""
      } ${onItemClick ? "clickable" : ""}`}
      onClick={() => onItemClick && onItemClick(notification)}
    >
      <div className="activity-icon">
        <span
          className={`notification-status ${notification.status.toLowerCase()}`}
        >
          {notification.status === "Sent" ? "🔔" : "📖"}
        </span>
      </div>
      <div className="activity-content">
        <div className="activity-main">
          <span className="activity-title">{notification.message}</span>
        </div>
        <div className="activity-meta">
          <span className="activity-time">
            {new Date(notification.sent_at).toLocaleString()}
          </span>
          <span className={`badge badge-${notification.status.toLowerCase()}`}>
            {notification.status}
          </span>
        </div>
      </div>
    </div>
  );

  const renderDonationItem = (donation) => (
    <div
      key={donation.donation_id}
      className={`activity-item ${onItemClick ? "clickable" : ""}`}
      onClick={() => onItemClick && onItemClick(donation)}
    >
      <div className="activity-icon">
        <span className="donation-icon">🩸</span>
      </div>
      <div className="activity-content">
        <div className="activity-main">
          <span className="activity-title">
            Donated {donation.units_donated} unit
            {donation.units_donated > 1 ? "s" : ""}
          </span>
        </div>
        <div className="activity-meta">
          <span className="activity-location">{donation.bank_name}</span>
          <span className="activity-time">
            {new Date(donation.donation_date).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  const renderItem = (item) => {
    switch (type) {
      case "requests":
        return renderRequestItem(item);
      case "notifications":
        return renderNotificationItem(item);
      case "donations":
        return renderDonationItem(item);
      default:
        return null;
    }
  };

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <h3>{title}</h3>
        {linkTo && (
          <Link to={linkTo} className="view-all-link">
            View All →
          </Link>
        )}
      </div>
      <div className="activity-feed-body">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading activity...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {type === "requests"
                ? "🩸"
                : type === "notifications"
                ? "🔔"
                : "📊"}
            </div>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="activity-list">{displayItems.map(renderItem)}</div>
            {items.length > maxItems && (
              <div className="activity-feed-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show Less" : `Show All (${items.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
