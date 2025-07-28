const admin = require("firebase-admin");
const { supabase } = require("../utils/supabase");

class NotificationService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
  }

  async sendPushNotification(fcmToken, title, body, data = {}) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent message:", response);
      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async sendSOSNotifications(requestId) {
    try {
      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from("DonationRequests")
        .select(
          `
          *,
          BloodGroups!inner(group_name),
          BloodComponents!inner(component_name),
          Patients!inner(
            Users!inner(full_name)
          )
        `
        )
        .eq("request_id", requestId)
        .single();

      if (requestError) throw requestError;

      // Create notifications for eligible donors
      const notificationCount = await supabase.rpc("create_sos_notifications", {
        p_request_id: requestId,
        p_max_distance_km: 15,
      });

      // Get all notifications for this request to send push notifications
      const { data: notifications, error: notError } = await supabase
        .from("Notifications")
        .select(
          `
          *,
          Donors!inner(
            Users!inner(full_name)
          )
        `
        )
        .eq("request_id", requestId)
        .eq("status", "Sent");

      if (notError) throw notError;

      // Send push notifications (if FCM tokens are available)
      const pushPromises = notifications.map(async (notification) => {
        if (notification.fcm_token) {
          return this.sendPushNotification(
            notification.fcm_token,
            "Blood Donation Request",
            notification.message,
            {
              request_id: requestId.toString(),
              type: "donation_request",
            }
          );
        }
      });

      await Promise.allSettled(pushPromises);

      return {
        notificationCount: notificationCount.data || 0,
        pushNotificationsSent: pushPromises.length,
      };
    } catch (error) {
      console.error("Error sending SOS notifications:", error);
      throw error;
    }
  }

  async updateNotificationStatus(notificationId, status) {
    const { data, error } = await supabase
      .from("Notifications")
      .update({ status })
      .eq("notification_id", notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDonorNotifications(donorId, limit = 20) {
    const { data, error } = await supabase
      .from("Notifications")
      .select(
        `
        *,
        DonationRequests!inner(
          *,
          BloodGroups!inner(group_name),
          BloodComponents!inner(component_name)
        )
      `
      )
      .eq("donor_id", donorId)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

module.exports = new NotificationService();
