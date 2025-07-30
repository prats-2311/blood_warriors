import React, { useState } from "react";

const DashboardPreferences = ({
  preferences = {},
  onPreferencesChange,
  onClose,
}) => {
  const [localPreferences, setLocalPreferences] = useState({
    autoRefresh: preferences.autoRefresh ?? true,
    refreshInterval: preferences.refreshInterval ?? 300000, // 5 minutes
    showHealthTips: preferences.showHealthTips ?? true,
    showRecentActivity: preferences.showRecentActivity ?? true,
    showStatistics: preferences.showStatistics ?? true,
    ...preferences,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onPreferencesChange(localPreferences);
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const refreshIntervalOptions = [
    { value: 60000, label: "1 minute" },
    { value: 300000, label: "5 minutes" },
    { value: 600000, label: "10 minutes" },
    { value: 1800000, label: "30 minutes" },
    { value: 0, label: "Manual only" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Dashboard Preferences</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="preference-section">
            <h4>Auto Refresh</h4>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPreferences.autoRefresh}
                  onChange={(e) =>
                    handleChange("autoRefresh", e.target.checked)
                  }
                />
                Enable automatic refresh
              </label>
            </div>

            {localPreferences.autoRefresh && (
              <div className="form-group">
                <label>Refresh Interval</label>
                <select
                  value={localPreferences.refreshInterval}
                  onChange={(e) =>
                    handleChange("refreshInterval", parseInt(e.target.value))
                  }
                  className="form-control"
                >
                  {refreshIntervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="preference-section">
            <h4>Dashboard Sections</h4>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPreferences.showStatistics}
                  onChange={(e) =>
                    handleChange("showStatistics", e.target.checked)
                  }
                />
                Show statistics cards
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPreferences.showRecentActivity}
                  onChange={(e) =>
                    handleChange("showRecentActivity", e.target.checked)
                  }
                />
                Show recent activity
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPreferences.showHealthTips}
                  onChange={(e) =>
                    handleChange("showHealthTips", e.target.checked)
                  }
                />
                Show health tips
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreferences;
