import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const QuickActions = ({ stats = {}, onActionClick = null }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleEmergencyRequest = () => {
    if (onActionClick) onActionClick("emergency-request");
    navigate("/app/requests/create", {
      state: { urgency: "SOS" },
    });
  };

  const handleFindDonors = () => {
    if (onActionClick) onActionClick("find-donors");
    navigate("/app/donors", {
      state: { bloodGroup: profile?.blood_group },
    });
  };

  const handleAction = (actionId, path, state = null) => {
    if (onActionClick) onActionClick(actionId);
    navigate(path, state ? { state } : undefined);
  };

  const patientActions = [
    {
      id: "create-request",
      title: "Create Blood Request",
      description: "Request blood donation",
      icon: "🩸",
      color: "primary",
      action: () => handleAction("create-request", "/app/requests/create"),
      priority: 1,
    },
    {
      id: "emergency-request",
      title: "Emergency SOS",
      description: "Urgent blood needed",
      icon: "🆘",
      color: "error",
      action: handleEmergencyRequest,
      priority: stats.activeRequests === 0 ? 2 : 0,
    },
    {
      id: "find-donors",
      title: "Find Donors",
      description: "Search compatible donors",
      icon: "🔍",
      color: "info",
      action: handleFindDonors,
      priority: 3,
    },
    {
      id: "blood-banks",
      title: "Blood Banks",
      description: "Locate nearby banks",
      icon: "🏥",
      color: "secondary",
      action: () => handleAction("blood-banks", "/app/blood-banks"),
      priority: 4,
    },
    {
      id: "carebot",
      title: "Ask CareBot",
      description: "AI health companion",
      icon: "🤖",
      color: "info",
      action: () => handleAction("carebot", "/app/carebot"),
      priority: 2,
    },
  ];

  const donorActions = [
    {
      id: "view-requests",
      title: "Available Requests",
      description: "Help patients in need",
      icon: "🩸",
      color: "primary",
      action: () => handleAction("view-requests", "/app/requests"),
      priority: 1,
    },
    {
      id: "sos-toggle",
      title: profile?.is_available_for_sos ? "SOS: Available" : "Enable SOS",
      description: profile?.is_available_for_sos
        ? "Ready for emergencies"
        : "Get emergency alerts",
      icon: profile?.is_available_for_sos ? "✅" : "🆘",
      color: profile?.is_available_for_sos ? "success" : "warning",
      action: () => handleAction("sos-toggle", "/app/profile"),
      priority: 2,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: `${stats.unreadNotifications || 0} unread`,
      icon: "🔔",
      color: stats.unreadNotifications > 0 ? "warning" : "secondary",
      action: () => handleAction("notifications", "/app/notifications"),
      priority: stats.unreadNotifications > 0 ? 1 : 3,
    },
    {
      id: "coupons",
      title: "My Coupons",
      description: `${stats.availableCoupons || 0} available`,
      icon: "🎫",
      color: "info",
      action: () => handleAction("coupons", "/app/coupons"),
      priority: 4,
    },
    {
      id: "carebot",
      title: "Ask CareBot",
      description: "AI health companion",
      icon: "🤖",
      color: "info",
      action: () => handleAction("carebot", "/app/carebot"),
      priority: 4,
    },
    {
      id: "donation-history",
      title: "Donation History",
      description: `${stats.totalDonations || 0} donations`,
      icon: "📊",
      color: "secondary",
      action: () => handleAction("donation-history", "/app/profile"),
      priority: 5,
    },
  ];

  const actions =
    profile?.user_type === "Patient" ? patientActions : donorActions;
  const sortedActions = actions
    .filter((action) => action.priority > 0)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4); // Show top 4 actions

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <h3>🆘 Quick Actions</h3>
        <p className="quick-actions-subtitle">
          {profile?.user_type === "Patient"
            ? "Get the help you need"
            : "Make a difference today"}
        </p>
      </div>
      <div className="quick-actions-grid">
        {sortedActions.map((action) => (
          <button
            key={action.id}
            className={`quick-action-card quick-action-${action.color}`}
            onClick={action.action}
          >
            <div className="quick-action-icon">{action.icon}</div>
            <div className="quick-action-content">
              <div className="quick-action-title">{action.title}</div>
              <div className="quick-action-description">
                {action.description}
              </div>
            </div>
            <div className="quick-action-arrow">→</div>
          </button>
        ))}
      </div>
      <div className="quick-actions-footer">
        <Link to="/app/profile" className="btn btn-secondary btn-sm w-full">
          <span>⚙️</span>
          Manage Settings
        </Link>
      </div>
    </div>
  );
};

export default QuickActions;
