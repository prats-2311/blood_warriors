const express = require("express");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

/**
 * Mark notification as read
 */
router.put("/:id/read", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Check if notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("donor_id")
      .eq("notification_id", id)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }

    if (notification.donor_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this notification",
      });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ status: "Read" })
      .eq("notification_id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to mark notification as read",
      });
    }

    res.json({
      status: "success",
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Notification update error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Respond to notification (accept/decline)
 */
router.post("/:id/respond", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body; // 'Accepted' or 'Declined'
    const userId = req.user.user_id;

    if (!response || !["Accepted", "Declined"].includes(response)) {
      return res.status(400).json({
        status: "error",
        message: "Response must be 'Accepted' or 'Declined'",
      });
    }

    // Check if notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("donor_id, request_id")
      .eq("notification_id", id)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }

    if (notification.donor_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to respond to this notification",
      });
    }

    // Update notification status
    const { error } = await supabase
      .from("notifications")
      .update({ status: response })
      .eq("notification_id", id);

    if (error) {
      console.error("Error updating notification:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update notification",
      });
    }

    // If accepted, you might want to create a donation record or update request status
    if (response === "Accepted") {
      // This could trigger additional logic like creating a donation appointment
      console.log(`Donor ${userId} accepted request ${notification.request_id}`);
    }

    res.json({
      status: "success",
      message: `Notification ${response.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Notification response error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Delete notification
 */
router.delete("/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Check if notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("donor_id")
      .eq("notification_id", id)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }

    if (notification.donor_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this notification",
      });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("notification_id", id);

    if (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete notification",
      });
    }

    res.json({
      status: "success",
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Notification deletion error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
