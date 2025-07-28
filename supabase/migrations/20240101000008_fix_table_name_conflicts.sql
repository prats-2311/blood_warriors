-- Fix table name conflicts and disable email confirmation for development

-- First, ensure RLS is disabled on the tables we need for registration
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE donors DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS patients_own_data ON patients;
DROP POLICY IF EXISTS donors_own_data ON donors;
DROP POLICY IF EXISTS donors_readable_by_patients ON donors;

-- Update helper functions to use lowercase table names
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid() AND user_type = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_patient()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid() AND user_type = 'Patient'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_donor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid() AND user_type = 'Donor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT user_id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    RETURN COALESCE(v_user_id, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update functions to use lowercase table names
CREATE OR REPLACE FUNCTION find_eligible_donors(
    p_request_id INTEGER,
    p_max_distance_km NUMERIC DEFAULT 15
)
RETURNS TABLE (
    donor_id INTEGER,
    distance_km NUMERIC,
    full_name VARCHAR(100),
    phone_number VARCHAR(15),
    email VARCHAR(255)
) AS $$
DECLARE
    v_blood_group_id INTEGER;
    v_request_location GEOGRAPHY;
    v_three_months_ago DATE := CURRENT_DATE - INTERVAL '3 months';
BEGIN
    -- Get the blood group and location from the request
    SELECT 
        dr.blood_group_id, 
        dr.location INTO v_blood_group_id, v_request_location
    FROM donationrequests dr
    WHERE dr.request_id = p_request_id;
    
    -- Return eligible donors
    RETURN QUERY
    SELECT 
        d.donor_id,
        ST_Distance(d.location, v_request_location) / 1000 AS distance_km,
        u.full_name,
        u.phone_number,
        u.email
    FROM donors d
    JOIN users u ON d.donor_id = u.user_id
    WHERE 
        d.blood_group_id = v_blood_group_id
        AND d.is_available_for_sos = true
        AND (d.last_donation_date IS NULL OR d.last_donation_date <= v_three_months_ago)
        AND d.location IS NOT NULL
        AND ST_DWithin(d.location, v_request_location, p_max_distance_km * 1000)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;