import { useState, useEffect, useCallback, useRef } from "react";
import { dashboardService } from "../services/dashboardService";
import { useAuth } from "../contexts/AuthContext";

export const useDashboard = (refreshInterval = 300000) => {
  // 5 minutes default
  const { profile, user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentRequests: [],
    recentNotifications: [],
    recentDonations: [],
    healthTips: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchDashboardData = useCallback(
    async (showLoading = true) => {
      if (!profile || !user) return;

      try {
        if (showLoading) setLoading(true);
        setError(null);

        const data = await dashboardService.getDashboardData(
          profile.user_id,
          profile.user_type
        );

        const tips = await dashboardService.getHealthTips(profile.user_type);

        if (mountedRef.current) {
          setDashboardData({
            stats: data.stats,
            recentRequests: data.recentRequests,
            recentNotifications: data.recentNotifications,
            recentDonations: data.recentDonations,
            healthTips: tips,
          });
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (mountedRef.current) {
          setError("Failed to load dashboard data");
        }
      } finally {
        if (mountedRef.current && showLoading) {
          setLoading(false);
        }
      }
    },
    [profile, user]
  );

  // Initial data fetch
  useEffect(() => {
    if (profile && user) {
      fetchDashboardData();
    }
  }, [profile, user, fetchDashboardData]);

  // Set up automatic refresh
  useEffect(() => {
    if (refreshInterval > 0 && profile && user) {
      intervalRef.current = setInterval(() => {
        fetchDashboardData(false); // Don't show loading for background updates
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, profile, user, fetchDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refreshData = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const updateRefreshInterval = useCallback(
    (newInterval) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (newInterval > 0 && profile && user) {
        intervalRef.current = setInterval(() => {
          fetchDashboardData(false);
        }, newInterval);
      }
    },
    [profile, user, fetchDashboardData]
  );

  return {
    dashboardData,
    loading,
    error,
    lastUpdated,
    refreshData,
    updateRefreshInterval,
  };
};

export default useDashboard;
