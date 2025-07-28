const { supabase } = require('../utils/supabase');

/**
 * Create a new donation request
 */
const createRequest = async (req, res) => {
  try {
    const patientId = req.user.user_id;
    const { 
      blood_group_id, 
      component_id, 
      units_required, 
      urgency,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    if (!blood_group_id || !component_id || !units_required || !urgency) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields' 
      });
    }

    // Validate urgency
    if (!['SOS', 'Urgent', 'Scheduled'].includes(urgency)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid urgency. Must be SOS, Urgent, or Scheduled' 
      });
    }

    // Create the donation request
    const { data: request, error } = await supabase
      .from('donationrequests')
      .insert({
        patient_id: patientId,
        blood_group_id,
        component_id,
        units_required,
        urgency,
        status: 'Open',
        latitude,
        longitude
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    // If it's an SOS request, create notifications for eligible donors
    if (urgency === 'SOS') {
      const { data: notificationCount, error: funcError } = await supabase
        .rpc('create_sos_notifications', {
          p_request_id: request.request_id,
          p_max_distance_km: 15
        });

      if (funcError) {
        console.error('Error creating SOS notifications:', funcError);
      } else {
        console.log(`Created ${notificationCount} notifications for SOS request`);
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Donation request created successfully',
      data: {
        request_id: request.request_id,
        urgency: request.urgency,
        status: request.status,
        created_at: request.request_datetime
      }
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create donation request' 
    });
  }
};

/**
 * Get a specific donation request
 */
const getRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const userType = req.user.user_type;

    // Get the donation request
    const { data: request, error } = await supabase
      .from('donationrequests')
      .select(`
        *,
        BloodGroups(group_name),
        BloodComponents(component_name),
        Patients(
          Users(full_name, phone_number)
        )
      `)
      .eq('request_id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Donation request not found' 
      });
    }

    // Check if user has permission to view this request
    if (userType === 'Patient' && request.patient_id !== userId) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You do not have permission to view this request' 
      });
    }

    // Format the response
    const formattedRequest = {
      request_id: request.request_id,
      patient_name: request.Patients.Users.full_name,
      patient_phone: userType === 'Admin' ? request.Patients.Users.phone_number : undefined,
      blood_group: request.BloodGroups.group_name,
      component: request.BloodComponents.component_name,
      units_required: request.units_required,
      urgency: request.urgency,
      status: request.status,
      created_at: request.request_datetime,
      latitude: request.latitude,
      longitude: request.longitude
    };

    // If user is a donor, check if they have a notification for this request
    if (userType === 'Donor') {
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .select('notification_id, status')
        .eq('donor_id', userId)
        .eq('request_id', id)
        .single();

      if (!notifError) {
        formattedRequest.notification = {
          notification_id: notification.notification_id,
          status: notification.status
        };
      }
    }

    res.status(200).json({
      status: 'success',
      data: formattedRequest
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get donation request' 
    });
  }
};

/**
 * List donation requests
 */
const listRequests = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userType = req.user.user_type;
    const { status, urgency } = req.query;

    // Build the query
    let query = supabase
      .from('donationrequests')
      .select(`
        request_id,
        urgency,
        status,
        units_required,
        request_datetime,
        BloodGroups(group_name),
        BloodComponents(component_name),
        Patients(
          patient_id,
          Users(full_name)
        )
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (urgency) {
      query = query.eq('urgency', urgency);
    }

    // Filter by patient_id if user is a patient
    if (userType === 'Patient') {
      query = query.eq('patient_id', userId);
    }

    // Order by date (newest first)
    query = query.order('request_datetime', { ascending: false });

    // Execute the query
    const { data: requests, error } = await query;

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    // Format the response
    const formattedRequests = requests.map(request => ({
      request_id: request.request_id,
      patient_name: request.Patients.Users.full_name,
      patient_id: request.Patients.patient_id,
      blood_group: request.BloodGroups.group_name,
      component: request.BloodComponents.component_name,
      units_required: request.units_required,
      urgency: request.urgency,
      status: request.status,
      created_at: request.request_datetime
    }));

    res.status(200).json({
      status: 'success',
      data: formattedRequests
    });
  } catch (error) {
    console.error('List requests error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to list donation requests' 
    });
  }
};

/**
 * Respond to a donation request (for donors)
 */
const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const donorId = req.user.user_id;
    const { response } = req.body;

    // Validate response
    if (!response || !['accept', 'decline'].includes(response)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid response. Must be accept or decline' 
      });
    }

    // Check if the donor has a notification for this request
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('notification_id, status')
      .eq('donor_id', donorId)
      .eq('request_id', id)
      .single();

    if (notifError) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Notification not found for this request' 
      });
    }

    // Update the notification status
    const newStatus = response === 'accept' ? 'Accepted' : 'Declined';
    
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ status: newStatus })
      .eq('notification_id', notification.notification_id);

    if (updateError) {
      return res.status(400).json({ 
        status: 'error', 
        message: updateError.message 
      });
    }

    // If accepted, update the request status to 'In Progress'
    if (response === 'accept') {
      const { error: requestError } = await supabase
        .from('donationrequests')
        .update({ status: 'In Progress' })
        .eq('request_id', id)
        .eq('status', 'Open'); // Only update if still open

      if (requestError) {
        console.error('Error updating request status:', requestError);
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully ${response === 'accept' ? 'accepted' : 'declined'} the donation request`
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to respond to donation request' 
    });
  }
};

/**
 * Update donation request status (for patients)
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.user_id;
    const { status } = req.body;

    // Validate status
    if (!status || !['Open', 'In Progress', 'Fulfilled', 'Cancelled'].includes(status)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid status. Must be Open, In Progress, Fulfilled, or Cancelled' 
      });
    }

    // Check if the request belongs to the patient
    const { data: request, error: requestError } = await supabase
      .from('donationrequests')
      .select('request_id, patient_id, status')
      .eq('request_id', id)
      .single();

    if (requestError) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Donation request not found' 
      });
    }

    if (request.patient_id !== patientId) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You do not have permission to update this request' 
      });
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from('donationrequests')
      .update({ status })
      .eq('request_id', id);

    if (updateError) {
      return res.status(400).json({ 
        status: 'error', 
        message: updateError.message 
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Donation request status updated successfully'
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update donation request status' 
    });
  }
};

module.exports = {
  createRequest,
  getRequest,
  listRequests,
  respondToRequest,
  updateRequestStatus
};