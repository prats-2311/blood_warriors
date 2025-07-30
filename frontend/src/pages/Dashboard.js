import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import {
  StatCard,
  ActivityFeed,
  QuickActions,
  DashboardPreferences,
} from "../components/dashboard";
import AuthDebug from "../components/AuthDebug";

const Dashboard = () => {
  const { profile } = useAuth();
  const {
    dashboardData,
    loading,
    error,
    lastUpdated,
    refreshData,
    updateRefreshInterval,
  } = useDashboard();
  const [showPreferences, setShowPreferences] = React.useState(false);
  const [preferences, setPreferences] = React.useState({
    autoRefresh: true,
    refreshInterval: 300000,
    showHealthTips: true,
    showRecentActivity: true,
    showStatistics: true,
  });

  const { stats, recentRequests, recentNotifications, healthTips } =
    dashboardData;

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    const savedPreferences = localStorage.getItem("dashboardPreferences");
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        if (parsed.refreshInterval !== 300000) {
          updateRefreshInterval(parsed.refreshInterval);
        }
      } catch (error) {
        console.error("Error loading dashboard preferences:", error);
      }
    }
  }, [updateRefreshInterval]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="alert alert-error">
          {error}
          <button
            className="btn btn-primary"
            onClick={refreshData}
            style={{ marginTop: "1rem" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Temporary debug component - remove in production */}
      {process.env.NODE_ENV === "development" && <AuthDebug />}

      <div className="welcome-section">
        <div className="welcome-header">
          <div>
            <h2>Welcome back, {profile?.full_name}!</h2>
            <p>Here's what's happening with blood donations today.</p>
          </div>
          <div className="dashboard-controls">
            <button
              className="btn btn-secondary btn-sm"
              onClick={refreshData}
              title="Refresh dashboard data"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-sm"></div>
                  Refreshing...
                </>
              ) : (
                <>🔄 Refresh</>
              )}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPreferences(true)}
              title="Dashboard preferences"
            >
              ⚙️ Settings
            </button>
            {lastUpdated && (
              <span className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {preferences.showStatistics && (
        <div className="stats-grid">
          <StatCard
            title={
              profile?.user_type === "Patient"
                ? "My Requests"
                : "Total Requests"
            }
            value={stats.totalRequests || 0}
            icon="🩸"
            color="primary"
            linkTo="/app/requests"
            description={
              profile?.user_type === "Patient"
                ? "Blood requests made"
                : "Requests available"
            }
            loading={loading}
          />
          <StatCard
            title="Active Requests"
            value={stats.activeRequests || 0}
            icon="⚡"
            color="warning"
            linkTo="/app/requests?status=Open"
            description="Currently open requests"
            loading={loading}
          />
          {profile?.user_type === "Donor" && (
            <>
              <StatCard
                title="Total Donations"
                value={stats.totalDonations || 0}
                icon="❤️"
                color="success"
                linkTo="/app/profile"
                description="Lives you've helped save"
                loading={loading}
              />
              <StatCard
                title="Available Coupons"
                value={stats.availableCoupons || 0}
                icon="🎫"
                color="info"
                linkTo="/app/coupons"
                description="Rewards to redeem"
                loading={loading}
              />
            </>
          )}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>🩸 Blood Profile</h3>
          </div>
          <div className="card-body">
            <div className="blood-profile">
              <div className="blood-type-display">
                <span className="blood-type large">
                  {profile?.blood_group || "Not specified"}
                </span>
              </div>
              <p className="blood-description">
                {profile?.user_type === "Patient"
                  ? "Your blood type helps us match you with compatible donors."
                  : "Your blood type determines which patients you can help."}
              </p>
              {profile?.user_type === "Donor" && (
                <div className="donor-status">
                  <div className="status-item">
                    <span className="status-label">SOS Availability:</span>
                    <span
                      className={`status-badge ${
                        profile?.is_available_for_sos
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {profile?.is_available_for_sos
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>
                  {profile?.last_donation_date && (
                    <div className="status-item">
                      <span className="status-label">Last Donation:</span>
                      <span className="status-value">
                        {new Date(
                          profile.last_donation_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {preferences.showRecentActivity && (
        <div className="grid grid-2">
          <ActivityFeed
            title="🔄 Recent Requests"
            items={recentRequests}
            type="requests"
            emptyMessage="No recent requests found."
            linkTo="/app/requests"
            onItemClick={(request) => {
              window.location.href = `/app/requests?highlight=${request.request_id}`;
            }}
            loading={loading}
          />

          {profile?.user_type === "Donor" ? (
            <ActivityFeed
              title="🔔 Recent Notifications"
              items={recentNotifications}
              type="notifications"
              emptyMessage="No recent notifications."
              linkTo="/app/notifications"
              onItemClick={(notification) => {
                console.log("Notification clicked:", notification);
              }}
              loading={loading}
            />
          ) : (
            <QuickActions
              stats={{
                ...stats,
                unreadNotifications: recentNotifications.filter(
                  (n) => n.status === "Sent"
                ).length,
              }}
              onActionClick={(actionId) => {
                console.log("Quick action clicked:", actionId);
              }}
            />
          )}
        </div>
      )}

      {/* Health Tips */}
      {preferences.showHealthTips && (
        <div className="card">
          <div className="card-header">
            <h3>💡 Health Tips</h3>
          </div>
          <div className="card-body">
            <div className="health-tips">
              {healthTips && healthTips.length > 0 ? (
                <ul>
                  {healthTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              ) : (
                <ul>
                  {profile?.user_type === "Patient" ? (
                    <>
                      <li>
                        Take your prescribed medications exactly as directed by
                        your doctor
                      </li>
                      <li>
                        Maintain regular follow-ups with your hematologist
                      </li>
                      <li>
                        Monitor your iron levels regularly to prevent iron
                        overload
                      </li>
                      <li>
                        Stay up to date with vaccinations to prevent infections
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        Stay hydrated by drinking plenty of water before and
                        after donation
                      </li>
                      <li>
                        Eat iron-rich foods to maintain healthy blood levels
                      </li>
                      <li>Get adequate rest before donating blood</li>
                      <li>
                        Wait at least 8 weeks between whole blood donations
                      </li>
                    </>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Preferences Modal */}
      {showPreferences && (
        <DashboardPreferences
          preferences={preferences}
          onPreferencesChange={(newPreferences) => {
            setPreferences(newPreferences);
            if (
              newPreferences.refreshInterval !== preferences.refreshInterval
            ) {
              updateRefreshInterval(newPreferences.refreshInterval);
            }
            // Save to localStorage
            localStorage.setItem(
              "dashboardPreferences",
              JSON.stringify(newPreferences)
            );
          }}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
