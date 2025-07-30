const express = require("express");
const { supabase } = require("../utils/supabase");

const router = express.Router();

/**
 * Get patient statistics
 */
router.get("/patient-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get patient's request statistics
    const { data: requests, error: requestsError } = await supabase
      .from("donationrequests")
      .select("status, urgency")
      .eq("patient_id", userId);

    if (requestsError) {
      console.error("Error fetching patient requests:", requestsError);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch patient statistics",
      });
    }

    const stats = {
      totalRequests: requests.length,
      activeRequests: requests.filter((r) => r.status === "Open").length,
      fulfilledRequests: requests.filter((r) => r.status === "Fulfilled")
        .length,
      cancelledRequests: requests.filter((r) => r.status === "Cancelled")
        .length,
      urgentRequests: requests.filter((r) => r.urgency === "Urgent").length,
      sosRequests: requests.filter((r) => r.urgency === "SOS").length,
    };

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error("Patient stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get donor statistics
 */
router.get("/donor-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get donor's donation statistics
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", userId);

    // Get donor's coupon statistics
    const { data: coupons, error: couponsError } = await supabase
      .from("donorcoupons")
      .select("status")
      .eq("donor_id", userId);

    // Get donor's notification count
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("status")
      .eq("donor_id", userId)
      .eq("status", "Sent");

    if (donationsError || couponsError || notificationsError) {
      console.error("Error fetching donor data:", {
        donationsError,
        couponsError,
        notificationsError,
      });
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch donor statistics",
      });
    }

    const stats = {
      totalDonations: donations?.length || 0,
      availableCoupons:
        coupons?.filter((c) => c.status === "Issued").length || 0,
      redeemedCoupons:
        coupons?.filter((c) => c.status === "Redeemed").length || 0,
      unreadNotifications: notifications?.length || 0,
      acceptedRequests: donations?.length || 0, // Assuming each donation is from an accepted request
    };

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error("Donor stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get patient's recent requests
 */
router.get("/patient-requests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const { data, error } = await supabase
      .from("donationrequests")
      .select(
        `
        *,
        bloodgroups(group_name),
        bloodcomponents(component_name)
      `
      )
      .eq("patient_id", userId)
      .order("request_datetime", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching patient requests:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch recent requests",
      });
    }

    const formattedData = data.map((request) => ({
      request_id: request.request_id,
      blood_group_name: request.bloodgroups?.group_name || request.blood_group,
      component_name:
        request.bloodcomponents?.component_name || request.component,
      urgency: request.urgency,
      status: request.status,
      units_required: request.units_required,
      request_datetime: request.request_datetime,
      hospital_name: request.hospital_name || "Unknown Hospital",
      notes: request.notes,
    }));

    res.json({
      status: "success",
      data: formattedData,
    });
  } catch (error) {
    console.error("Patient requests error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get available requests for donors
 */
router.get("/available-requests", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const donorId = req.query.donor_id;

    // Get donor's blood group for compatibility
    let donorBloodGroup = null;
    if (donorId) {
      const { data: donor } = await supabase
        .from("donors")
        .select("blood_group")
        .eq("donor_id", donorId)
        .single();
      donorBloodGroup = donor?.blood_group;
    }

    let query = supabase
      .from("donationrequests")
      .select(
        `
        *,
        bloodgroups(group_name),
        bloodcomponents(component_name),
        patients(full_name)
      `
      )
      .eq("status", "Open")
      .order("request_datetime", { ascending: false })
      .limit(limit);

    // Filter by blood group compatibility if donor blood group is available
    if (donorBloodGroup) {
      // This is a simplified compatibility check - in reality, you'd want more complex logic
      query = query.eq("blood_group", donorBloodGroup);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching available requests:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch available requests",
      });
    }

    const formattedData = data.map((request) => ({
      request_id: request.request_id,
      blood_group_name: request.bloodgroups?.group_name || request.blood_group,
      component_name:
        request.bloodcomponents?.component_name || request.component,
      urgency: request.urgency,
      status: request.status,
      units_required: request.units_required,
      request_datetime: request.request_datetime,
      patient_name: request.patients?.full_name || "Anonymous",
      hospital_name: request.hospital_name || "Unknown Hospital",
      notes: request.notes,
    }));

    res.json({
      status: "success",
      data: formattedData,
    });
  } catch (error) {
    console.error("Available requests error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get donor notifications
 */
router.get("/donor-notifications/:donorId", async (req, res) => {
  try {
    const { donorId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("donor_id", donorId)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching donor notifications:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch notifications",
      });
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Donor notifications error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get donor donations
 */
router.get("/donor-donations/:donorId", async (req, res) => {
  try {
    const { donorId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const { data, error } = await supabase
      .from("donations")
      .select(
        `
        *,
        bloodbanks(name)
      `
      )
      .eq("donor_id", donorId)
      .order("donation_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching donor donations:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch donations",
      });
    }

    const formattedData = data.map((donation) => ({
      donation_id: donation.donation_id,
      donation_date: donation.donation_date,
      units_donated: donation.units_donated,
      bank_name: donation.bloodbanks?.name || "Unknown Bank",
      request_id: donation.request_id,
    }));

    res.json({
      status: "success",
      data: formattedData,
    });
  } catch (error) {
    console.error("Donor donations error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get health tips
 */
router.get("/health-tips", async (req, res) => {
  try {
    const userType = req.query.user_type;

    const tips =
      userType === "Patient"
        ? [
            "Take your prescribed medications exactly as directed by your doctor",
            "Maintain regular follow-ups with your hematologist",
            "Monitor your iron levels regularly to prevent iron overload",
            "Stay up to date with vaccinations to prevent infections",
            "Maintain a healthy diet rich in iron and vitamins",
          ]
        : [
            "Stay hydrated by drinking plenty of water before and after donation",
            "Eat iron-rich foods to maintain healthy blood levels",
            "Get adequate rest before donating blood",
            "Wait at least 8 weeks between whole blood donations",
            "Avoid alcohol and smoking before donation",
          ];

    res.json({
      status: "success",
      data: tips,
    });
  } catch (error) {
    console.error("Health tips error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
