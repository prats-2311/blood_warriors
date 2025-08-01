const express = require("express");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

/**
 * Get all donation requests
 */
router.get("/", authMiddleware.authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donationrequests")
      .select(
        `
        *,
        patients!inner(
          patient_id,
          users!inner(full_name, phone_number, city, state)
        ),
        bloodgroups!inner(group_name),
        bloodcomponents!inner(component_name)
      `
      )
      .eq("status", "Open")
      .order("request_datetime", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch requests",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Requests fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Create a new donation request
 */
router.post("/", authMiddleware.authenticate, async (req, res) => {
  try {
    const {
      blood_group_id,
      component_id,
      units_required,
      urgency,
      hospital_name,
      hospital_address,
      notes,
    } = req.body;

    const userId = req.user.user_id;

    // Validate required fields
    if (!blood_group_id || !component_id || !units_required || !urgency) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: blood_group_id, component_id, units_required, urgency",
      });
    }

    // Validate field types and ranges
    if (!Number.isInteger(blood_group_id) || blood_group_id < 1 || blood_group_id > 8) {
      return res.status(400).json({
        status: "error",
        message: "Invalid blood_group_id. Must be between 1 and 8",
      });
    }

    if (!Number.isInteger(component_id) || component_id < 1 || component_id > 5) {
      return res.status(400).json({
        status: "error",
        message: "Invalid component_id. Must be between 1 and 5",
      });
    }

    if (!Number.isInteger(units_required) || units_required < 1 || units_required > 10) {
      return res.status(400).json({
        status: "error",
        message: "Invalid units_required. Must be between 1 and 10",
      });
    }

    if (!["SOS", "Urgent", "Scheduled"].includes(urgency)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid urgency. Must be 'SOS', 'Urgent', or 'Scheduled'",
      });
    }

    // Create the request
    const { data, error } = await supabase
      .from("donationrequests")
      .insert({
        patient_id: userId,
        blood_group_id,
        component_id,
        units_required,
        urgency,
        hospital_name,
        hospital_address,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating request:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create request",
      });
    }

    res.status(201).json({
      status: "success",
      message: "Request created successfully",
      data,
    });
  } catch (error) {
    console.error("Request creation error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get a specific donation request by ID
 */
router.get("/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("donationrequests")
      .select(
        `
        *,
        patients!inner(
          patient_id,
          users!inner(full_name, phone_number, city, state)
        ),
        bloodgroups!inner(group_name),
        bloodcomponents!inner(component_name)
      `
      )
      .eq("request_id", id)
      .single();

    if (error) {
      console.error("Error fetching request:", error);
      return res.status(404).json({
        status: "error",
        message: "Request not found",
      });
    }

    res.json({
      status: "success",
      data,
    });
  } catch (error) {
    console.error("Request fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Update a donation request
 */
router.put("/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      blood_group_id,
      component_id,
      units_required,
      urgency,
      hospital_name,
      hospital_address,
      notes,
      status,
    } = req.body;

    const userId = req.user.user_id;

    // Check if user owns this request
    const { data: existingRequest, error: fetchError } = await supabase
      .from("donationrequests")
      .select("patient_id")
      .eq("request_id", id)
      .single();

    if (fetchError || !existingRequest) {
      return res.status(404).json({
        status: "error",
        message: "Request not found",
      });
    }

    if (existingRequest.patient_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this request",
      });
    }

    // Update the request
    const updateData = {};
    if (blood_group_id) updateData.blood_group_id = blood_group_id;
    if (component_id) updateData.component_id = component_id;
    if (units_required) updateData.units_required = units_required;
    if (urgency) updateData.urgency = urgency;
    if (hospital_name !== undefined) updateData.hospital_name = hospital_name;
    if (hospital_address !== undefined) updateData.hospital_address = hospital_address;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    const { data, error } = await supabase
      .from("donationrequests")
      .update(updateData)
      .eq("request_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating request:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update request",
      });
    }

    res.json({
      status: "success",
      message: "Request updated successfully",
      data,
    });
  } catch (error) {
    console.error("Request update error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Delete a donation request
 */
router.delete("/:id", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Check if user owns this request
    const { data: existingRequest, error: fetchError } = await supabase
      .from("donationrequests")
      .select("patient_id")
      .eq("request_id", id)
      .single();

    if (fetchError || !existingRequest) {
      return res.status(404).json({
        status: "error",
        message: "Request not found",
      });
    }

    if (existingRequest.patient_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this request",
      });
    }

    const { error } = await supabase
      .from("donationrequests")
      .delete()
      .eq("request_id", id);

    if (error) {
      console.error("Error deleting request:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete request",
      });
    }

    res.json({
      status: "success",
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Request deletion error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Respond to a donation request (for donors)
 */
router.post("/:id/respond", authMiddleware.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, message } = req.body;
    const userId = req.user.user_id;

    if (!response || !["accept", "decline"].includes(response)) {
      return res.status(400).json({
        status: "error",
        message: "Response must be 'accept' or 'decline'",
      });
    }

    // Check if request exists
    const { data: request, error: fetchError } = await supabase
      .from("donationrequests")
      .select("*")
      .eq("request_id", id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        status: "error",
        message: "Request not found",
      });
    }

    // Create or update notification response
    const notificationStatus = response === "accept" ? "Accepted" : "Declined";

    // Find existing notification for this donor and request
    const { data: existingNotification } = await supabase
      .from("notifications")
      .select("notification_id")
      .eq("donor_id", userId)
      .eq("request_id", id)
      .single();

    if (existingNotification) {
      // Update existing notification
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ status: notificationStatus })
        .eq("notification_id", existingNotification.notification_id);

      if (updateError) {
        console.error("Error updating notification:", updateError);
      }
    } else {
      // Create new notification record
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          donor_id: userId,
          request_id: id,
          message: message || `Donor ${response}ed the request`,
          status: notificationStatus,
        });

      if (insertError) {
        console.error("Error creating notification:", insertError);
      }
    }

    res.json({
      status: "success",
      message: `Successfully ${response}ed the request`,
    });
  } catch (error) {
    console.error("Request response error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
