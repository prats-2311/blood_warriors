import api from "./api";

export const notificationService = {
  // Get notifications with proper joins and filtering
  getNotifications: async (donorId, filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.offset) params.append("offset", filters.offset);
      if (filters.unread_only) params.append("unread_only", "true");

      const response = await api.get(
        `/donors/${donorId}/notifications?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Mark all notifications as read for a donor
  markAllAsRead: async (donorId) => {
    try {
      const response = await api.put(
        `/donors/${donorId}/notifications/read-all`
      );
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },

  // Delete multiple notifications
  deleteMultipleNotifications: async (notificationIds) => {
    try {
      const response = await api.post("/notifications/delete-multiple", {
        notification_ids: notificationIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting multiple notifications:", error);
      throw error;
    }
  },

  // Create a new notification (system-generated)
  createNotification: async (notificationData) => {
    try {
      const response = await api.post("/notifications", {
        donor_id: notificationData.donor_id,
        request_id: notificationData.request_id,
        message: notificationData.message,
        fcm_token: notificationData.fcm_token,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  // Get notification count for a donor
  getNotificationCount: async (donorId, unreadOnly = false) => {
    try {
      const params = unreadOnly ? "?unread_only=true" : "";
      const response = await api.get(
        `/donors/${donorId}/notifications/count${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return { count: 0 };
    }
  },

  // Get unread notification count
  getUnreadCount: async (donorId) => {
    try {
      const response = await api.get(
        `/donors/${donorId}/notifications/unread-count`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return { count: 0 };
    }
  },

  // Update notification status (accept/decline)
  updateNotificationStatus: async (notificationId, status, message = null) => {
    try {
      const response = await api.put(
        `/notifications/${notificationId}/status`,
        {
          status,
          message,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating notification status:", error);
      throw error;
    }
  },

  // Get notification details with request information
  getNotificationDetails: async (notificationId) => {
    try {
      const response = await api.get(
        `/notifications/${notificationId}/details`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notification details:", error);
      throw error;
    }
  },

  // Search notifications
  searchNotifications: async (donorId, searchQuery, filters = {}) => {
    try {
      const params = new URLSearchParams({
        q: searchQuery,
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(
        `/donors/${donorId}/notifications/search?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching notifications:", error);
      throw error;
    }
  },

  // Get notification preferences
  getNotificationPreferences: async (donorId) => {
    try {
      const response = await api.get(
        `/donors/${donorId}/notification-preferences`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      return {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        sos_notifications: true,
        urgent_notifications: true,
        scheduled_notifications: false,
      };
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (donorId, preferences) => {
    try {
      const response = await api.put(
        `/donors/${donorId}/notification-preferences`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  },

  // Register FCM token for push notifications
  registerFCMToken: async (donorId, fcmToken) => {
    try {
      const response = await api.post(`/donors/${donorId}/fcm-token`, {
        fcm_token: fcmToken,
      });
      return response.data;
    } catch (error) {
      console.error("Error registering FCM token:", error);
      throw error;
    }
  },

  // Unregister FCM token
  unregisterFCMToken: async (donorId) => {
    try {
      const response = await api.delete(`/donors/${donorId}/fcm-token`);
      return response.data;
    } catch (error) {
      console.error("Error unregistering FCM token:", error);
      throw error;
    }
  },

  // Get notification statistics
  getNotificationStats: async (donorId, dateRange = null) => {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append("date_from", dateRange.from);
        params.append("date_to", dateRange.to);
      }

      const response = await api.get(
        `/donors/${donorId}/notification-stats?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      return {
        total: 0,
        unread: 0,
        by_status: {},
        by_urgency: {},
      };
    }
  },

  // Create SOS notifications for nearby donors
  createSOSNotifications: async (requestId, radius = 10) => {
    try {
      const response = await api.post("/notifications/sos", {
        request_id: requestId,
        radius,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating SOS notifications:", error);
      throw error;
    }
  },

  // Get notification history for a request
  getRequestNotificationHistory: async (requestId) => {
    try {
      const response = await api.get(
        `/requests/${requestId}/notification-history`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching request notification history:", error);
      return [];
    }
  },

  // Snooze notifications for a period
  snoozeNotifications: async (donorId, duration) => {
    try {
      const response = await api.post(
        `/donors/${donorId}/snooze-notifications`,
        {
          duration_minutes: duration,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error snoozing notifications:", error);
      throw error;
    }
  },

  // Check if notifications are snoozed
  getSnoozeStatus: async (donorId) => {
    try {
      const response = await api.get(`/donors/${donorId}/snooze-status`);
      return response.data;
    } catch (error) {
      console.error("Error fetching snooze status:", error);
      return { is_snoozed: false, snooze_until: null };
    }
  },

  // Clear snooze
  clearSnooze: async (donorId) => {
    try {
      const response = await api.delete(`/donors/${donorId}/snooze`);
      return response.data;
    } catch (error) {
      console.error("Error clearing snooze:", error);
      throw error;
    }
  },

  // Export notifications to CSV/JSON
  exportNotifications: async (donorId, format = "json", filters = {}) => {
    try {
      const params = new URLSearchParams({ format });

      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.status) params.append("status", filters.status);

      const response = await api.get(
        `/donors/${donorId}/notifications/export?${params}`,
        {
          responseType: "blob",
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error exporting notifications:", error);
      throw error;
    }
  },

  // Validate notification data
  validateNotificationData: (notificationData) => {
    const errors = {};

    if (!notificationData.donor_id) {
      errors.donor_id = "Donor ID is required";
    }

    if (!notificationData.request_id) {
      errors.request_id = "Request ID is required";
    }

    if (
      !notificationData.message ||
      notificationData.message.trim().length < 5
    ) {
      errors.message = "Message must be at least 5 characters long";
    }

    if (notificationData.message && notificationData.message.length > 500) {
      errors.message = "Message cannot exceed 500 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};
