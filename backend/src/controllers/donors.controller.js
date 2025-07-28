const { supabase } = require('../utils/supabase');

/**
 * Update donor's location
 */
const updateLocation = async (req, res) => {
  try {
    const donorId = req.user.user_id;
    const { latitude, longitude } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Latitude and longitude are required' 
      });
    }

    // Update the donor's location
    const { error } = await supabase
      .from('donors')
      .update({
        latitude,
        longitude
      })
      .eq('donor_id', donorId);

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update location' 
    });
  }
};

/**
 * Toggle SOS availability
 */
const toggleSosAvailability = async (req, res) => {
  try {
    const donorId = req.user.user_id;
    const { is_available_for_sos } = req.body;

    // Validate required fields
    if (is_available_for_sos === undefined) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'is_available_for_sos is required' 
      });
    }

    // Update the donor's SOS availability
    const { error } = await supabase
      .from('donors')
      .update({
        is_available_for_sos
      })
      .eq('donor_id', donorId);

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    res.status(200).json({
      status: 'success',
      message: `SOS availability ${is_available_for_sos ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Toggle SOS availability error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to toggle SOS availability' 
    });
  }
};

/**
 * Update donor's taste keywords (interests)
 */
const updateTasteKeywords = async (req, res) => {
  try {
    const donorId = req.user.user_id;
    const { interests } = req.body;

    // Validate required fields
    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Interests must be an array' 
      });
    }

    // Update the donor's taste keywords
    const { error } = await supabase
      .from('donors')
      .update({
        qloo_taste_keywords: interests
      })
      .eq('donor_id', donorId);

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Interests updated successfully'
    });
  } catch (error) {
    console.error('Update taste keywords error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update interests' 
    });
  }
};

/**
 * Get donor's coupons
 */
const getDonorCoupons = async (req, res) => {
  try {
    const donorId = req.user.user_id;
    const { status } = req.query;

    // Build the query
    let query = supabase
      .from('donorcoupons')
      .select(`
        id,
        status,
        issued_at,
        unique_redemption_code,
        Coupons(
          coupon_id,
          partner_name,
          coupon_title,
          expiry_date
        )
      `)
      .eq('donor_id', donorId);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Order by date (newest first)
    query = query.order('issued_at', { ascending: false });

    // Execute the query
    const { data: coupons, error } = await query;

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    // Format the response
    const formattedCoupons = coupons.map(coupon => ({
      id: coupon.id,
      status: coupon.status,
      issued_at: coupon.issued_at,
      redemption_code: coupon.unique_redemption_code,
      coupon_id: coupon.Coupons.coupon_id,
      partner_name: coupon.Coupons.partner_name,
      coupon_title: coupon.Coupons.coupon_title,
      expiry_date: coupon.Coupons.expiry_date
    }));

    res.status(200).json({
      status: 'success',
      data: formattedCoupons
    });
  } catch (error) {
    console.error('Get donor coupons error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get coupons' 
    });
  }
};

/**
 * Record a donation
 */
const recordDonation = async (req, res) => {
  try {
    const donorId = req.user.user_id;
    const { bank_id, request_id, donation_date, units_donated } = req.body;

    // Validate required fields
    if (!bank_id || !donation_date) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Bank ID and donation date are required' 
      });
    }

    // Create the donation record
    const { data: donation, error } = await supabase
      .from('donations')
      .insert({
        donor_id: donorId,
        bank_id,
        request_id,
        donation_date,
        units_donated: units_donated || 1
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    // Update the donor's last donation date
    const { error: updateError } = await supabase
      .from('donors')
      .update({
        last_donation_date: donation_date
      })
      .eq('donor_id', donorId);

    if (updateError) {
      console.error('Error updating last donation date:', updateError);
    }

    // If there's a request_id, update the request status to 'Fulfilled'
    if (request_id) {
      const { error: requestError } = await supabase
        .from('donationrequests')
        .update({ status: 'Fulfilled' })
        .eq('request_id', request_id);

      if (requestError) {
        console.error('Error updating request status:', requestError);
      }
    }

    // Process donation reward (coupon)
    try {
      const { data: matchingCoupons, error: matchError } = await supabase
        .rpc('match_donor_with_coupons', {
          p_donor_id: donorId
        });
        
      if (!matchError && matchingCoupons.length > 0) {
        const couponId = matchingCoupons[0].coupon_id;
        
        const { data: redemptionCode, error: issueError } = await supabase
          .rpc('issue_coupon_to_donor', {
            p_donor_id: donorId,
            p_coupon_id: couponId
          });
          
        if (!issueError) {
          console.log(`Issued coupon with code ${redemptionCode} to donor ${donorId}`);
        }
      }
    } catch (rewardError) {
      console.error('Error processing donation reward:', rewardError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Donation recorded successfully',
      data: {
        donation_id: donation.donation_id,
        donation_date: donation.donation_date,
        units_donated: donation.units_donated
      }
    });
  } catch (error) {
    console.error('Record donation error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to record donation' 
    });
  }
};

/**
 * Get donor's notifications
 */
const getNotifications = async (req, res) => {
  try {
    const donorId = req.user.user_id;
    const { status } = req.query;

    // Build the query
    let query = supabase
      .from('notifications')
      .select(`
        notification_id,
        message,
        status,
        sent_at,
        request_id,
        DonationRequests(
          urgency,
          status,
          BloodGroups(group_name),
          BloodComponents(component_name)
        )
      `)
      .eq('donor_id', donorId);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Order by date (newest first)
    query = query.order('sent_at', { ascending: false });

    // Execute the query
    const { data: notifications, error } = await query;

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    // Format the response
    const formattedNotifications = notifications.map(notification => ({
      notification_id: notification.notification_id,
      message: notification.message,
      status: notification.status,
      sent_at: notification.sent_at,
      request_id: notification.request_id,
      request_urgency: notification.DonationRequests.urgency,
      request_status: notification.DonationRequests.status,
      blood_group: notification.DonationRequests.BloodGroups.group_name,
      component: notification.DonationRequests.BloodComponents.component_name
    }));

    res.status(200).json({
      status: 'success',
      data: formattedNotifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get notifications' 
    });
  }
};

module.exports = {
  updateLocation,
  toggleSosAvailability,
  updateTasteKeywords,
  getDonorCoupons,
  recordDonation,
  getNotifications
};