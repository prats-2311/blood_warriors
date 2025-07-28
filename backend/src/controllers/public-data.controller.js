const { supabase } = require('../utils/supabase');

/**
 * List blood banks
 */
const listBloodBanks = async (req, res) => {
  try {
    const { city, state, latitude, longitude, radius } = req.query;

    // Build the query
    let query = supabase
      .from('bloodbanks')
      .select('*');

    // Apply filters
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (state) {
      query = query.ilike('state', `%${state}%`);
    }

    // Execute the query
    const { data: banks, error } = await query;

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    // If latitude, longitude, and radius are provided, filter by distance
    let filteredBanks = banks;
    if (latitude && longitude && radius) {
      // Convert to numbers
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseFloat(radius);

      // Filter banks by distance using PostGIS
      const { data: nearbyBanks, error: distError } = await supabase.rpc(
        'find_nearby_banks',
        {
          p_latitude: lat,
          p_longitude: lng,
          p_radius_km: rad
        }
      );

      if (!distError) {
        filteredBanks = nearbyBanks;
      }
    }

    res.status(200).json({
      status: 'success',
      data: filteredBanks
    });
  } catch (error) {
    console.error('List blood banks error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to list blood banks' 
    });
  }
};

/**
 * Get blood stock information
 */
const getBloodStock = async (req, res) => {
  try {
    const { bank_id, blood_group_id, component_id } = req.query;

    // Build the query
    let query = supabase
      .from('bloodstock')
      .select(`
        stock_id,
        units_available,
        last_updated,
        BloodBanks(bank_id, name, city, state),
        BloodGroups(blood_group_id, group_name),
        BloodComponents(component_id, component_name)
      `);

    // Apply filters
    if (bank_id) {
      query = query.eq('bank_id', bank_id);
    }

    if (blood_group_id) {
      query = query.eq('blood_group_id', blood_group_id);
    }

    if (component_id) {
      query = query.eq('component_id', component_id);
    }

    // Execute the query
    const { data: stock, error } = await query;

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    // Format the response
    const formattedStock = stock.map(item => ({
      stock_id: item.stock_id,
      units_available: item.units_available,
      last_updated: item.last_updated,
      bank: {
        bank_id: item.BloodBanks.bank_id,
        name: item.BloodBanks.name,
        city: item.BloodBanks.city,
        state: item.BloodBanks.state
      },
      blood_group: {
        blood_group_id: item.BloodGroups.blood_group_id,
        group_name: item.BloodGroups.group_name
      },
      component: {
        component_id: item.BloodComponents.component_id,
        component_name: item.BloodComponents.component_name
      }
    }));

    res.status(200).json({
      status: 'success',
      data: formattedStock
    });
  } catch (error) {
    console.error('Get blood stock error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get blood stock' 
    });
  }
};

/**
 * Get blood groups
 */
const getBloodGroups = async (req, res) => {
  try {
    const { data: bloodGroups, error } = await supabase
      .from('bloodgroups')
      .select('*')
      .order('group_name');

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    res.status(200).json({
      status: 'success',
      data: bloodGroups
    });
  } catch (error) {
    console.error('Get blood groups error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get blood groups' 
    });
  }
};

/**
 * Get blood components
 */
const getBloodComponents = async (req, res) => {
  try {
    const { data: bloodComponents, error } = await supabase
      .from('bloodcomponents')
      .select('*')
      .order('component_name');

    if (error) {
      return res.status(400).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    res.status(200).json({
      status: 'success',
      data: bloodComponents
    });
  } catch (error) {
    console.error('Get blood components error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get blood components' 
    });
  }
};

module.exports = {
  listBloodBanks,
  getBloodStock,
  getBloodGroups,
  getBloodComponents
};