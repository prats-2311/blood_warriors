const { supabase } = require('../utils/supabase');

/**
 * Create an SOS request from a partner (hospital)
 */
const createSosRequest = async (req, res) => {
  try {
    const { 
      patient_id, 
      blood_group_id, 
      component_id, 
      units_required,
      latitude,
      longitude,
      hospital_name,
      hospital_address
    } = req.body;

    // Validate required fields
    if (!patient_id || !blood_group_id || !component_id || !units_required || !latitude || !longitude) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields' 
      });
    }

    // Check if the patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('patient_id')
      .eq('patient_id', patient_id)
      .single();

    if (patientError) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Patient not found' 
      });
    }

    // Create the SOS request
    const { data: request, error } = await supabase
      .from('donationrequests')
      .insert({
        patient_id,
        blood_group_id,
        component_id,
        units_required,
        urgency: 'SOS',
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

    // Create notifications for eligible donors
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

    res.status(201).json({
      status: 'success',
      message: 'SOS request created successfully',
      data: {
        request_id: request.request_id,
        notification_count: notificationCount || 0
      }
    });
  } catch (error) {
    console.error('Create SOS request error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create SOS request' 
    });
  }
};

/**
 * Register a donor from a partner (NGO)
 */
const registerDonor = async (req, res) => {
  try {
    const { 
      email, 
      phone_number, 
      full_name, 
      city, 
      state, 
      blood_group_id,
      is_available_for_sos
    } = req.body;

    // Validate required fields
    if (!email || !phone_number || !full_name || !blood_group_id) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields' 
      });
    }

    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User with this email already exists' 
      });
    }

    // Generate a random password for the user
    const password = Math.random().toString(36).slice(-8);

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ 
        status: 'error', 
        message: authError.message 
      });
    }

    // Create user record in our Users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        phone_number,
        full_name,
        city,
        state,
        user_type: 'Donor'
      })
      .select()
      .single();

    if (userError) {
      // Rollback: delete the auth user if we couldn't create the user record
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(400).json({ 
        status: 'error', 
        message: userError.message 
      });
    }

    // Create Donor record
    const { error: donorError } = await supabase
      .from('donors')
      .insert({
        donor_id: userData.user_id,
        blood_group_id,
        is_available_for_sos: is_available_for_sos !== false
      });

    if (donorError) {
      // Rollback: delete the user record and auth user
      await supabase.from('users').delete().eq('user_id', userData.user_id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(400).json({ 
        status: 'error', 
        message: donorError.message 
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Donor registered successfully',
      data: {
        user_id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name,
        temporary_password: password
      }
    });
  } catch (error) {
    console.error('Register donor error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to register donor' 
    });
  }
};

module.exports = {
  createSosRequest,
  registerDonor
};