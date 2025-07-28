-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom ENUM types
CREATE TYPE user_type AS ENUM ('Patient', 'Donor', 'Admin');
CREATE TYPE blood_bank_category AS ENUM ('Govt', 'Private', 'Charitable/Vol');
CREATE TYPE request_urgency AS ENUM ('SOS', 'Urgent', 'Scheduled');
CREATE TYPE request_status AS ENUM ('Open', 'In Progress', 'Fulfilled', 'Cancelled');
CREATE TYPE notification_status AS ENUM ('Sent', 'Read', 'Accepted', 'Declined');
CREATE TYPE coupon_status AS ENUM ('Issued', 'Redeemed', 'Expired');

-- ========= USER & PROFILE TABLES =========

-- Create a custom users table that extends Supabase auth.users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    user_type user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BloodGroups table first (referenced by Patients and Donors)
CREATE TABLE BloodGroups (
    blood_group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(3) NOT NULL UNIQUE -- e.g., 'A+', 'O-', 'AB+'
);

CREATE TABLE Patients (
    patient_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    date_of_birth DATE NOT NULL
);

CREATE TABLE Donors (
    donor_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    last_donation_date DATE,
    is_available_for_sos BOOLEAN DEFAULT true,
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    qloo_taste_keywords JSONB, -- Using JSONB for better performance
    -- Add a geography column for PostGIS spatial queries
    location GEOGRAPHY(POINT)
);

-- Create a function to update the geography column when lat/long change
CREATE OR REPLACE FUNCTION update_donor_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the geography column
CREATE TRIGGER update_donor_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON Donors
FOR EACH ROW
EXECUTE FUNCTION update_donor_location();

-- ========= BLOOD DATA & INVENTORY TABLES =========

CREATE TABLE BloodComponents (
    component_id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE -- e.g., 'Whole Blood', 'Packed Red Blood Cells'
);

CREATE TABLE BloodBanks (
    bank_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    category blood_bank_category NOT NULL,
    phone VARCHAR(100),
    email VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    -- Add a geography column for PostGIS spatial queries
    location GEOGRAPHY(POINT)
);

-- Create a function to update the geography column for blood banks
CREATE OR REPLACE FUNCTION update_bank_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the geography column
CREATE TRIGGER update_bank_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON BloodBanks
FOR EACH ROW
EXECUTE FUNCTION update_bank_location();

CREATE TABLE BloodStock (
    stock_id SERIAL PRIMARY KEY,
    bank_id INTEGER NOT NULL REFERENCES BloodBanks(bank_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    component_id INTEGER NOT NULL REFERENCES BloodComponents(component_id),
    units_available INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bank_id, blood_group_id, component_id)
);

-- ========= ACTIVITY & TRANSACTION TABLES =========

CREATE TABLE DonationRequests (
    request_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patients(patient_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    component_id INTEGER NOT NULL REFERENCES BloodComponents(component_id),
    units_required INTEGER NOT NULL,
    urgency request_urgency NOT NULL,
    status request_status NOT NULL DEFAULT 'Open',
    request_datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add location for the request (usually hospital or blood bank)
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    location GEOGRAPHY(POINT)
);

-- Create a function to update the geography column for donation requests
CREATE OR REPLACE FUNCTION update_request_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the geography column
CREATE TRIGGER update_request_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON DonationRequests
FOR EACH ROW
EXECUTE FUNCTION update_request_location();

CREATE TABLE Donations (
    donation_id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    bank_id INTEGER REFERENCES BloodBanks(bank_id),
    request_id INTEGER REFERENCES DonationRequests(request_id),
    donation_date DATE NOT NULL,
    units_donated INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    request_id INTEGER NOT NULL REFERENCES DonationRequests(request_id),
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'Sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add FCM token for push notifications
    fcm_token VARCHAR(255)
);

-- ========= PERKS PROGRAM TABLES =========

CREATE TABLE Coupons (
    coupon_id SERIAL PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    coupon_title VARCHAR(255) NOT NULL,
    target_keywords JSONB NOT NULL, -- Using JSONB for better performance
    quantity_total INTEGER,
    quantity_redeemed INTEGER DEFAULT 0,
    expiry_date DATE
);

CREATE TABLE DonorCoupons (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    coupon_id INTEGER NOT NULL REFERENCES Coupons(coupon_id),
    status coupon_status NOT NULL DEFAULT 'Issued',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unique_redemption_code VARCHAR(20) NOT NULL UNIQUE
);

-- ========= AI & LOGGING TABLES =========

CREATE TABLE ChatHistory (
    chat_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========= ROW LEVEL SECURITY POLICIES =========

-- Enable RLS on all tables
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE Donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE BloodGroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE BloodComponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE BloodBanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE BloodStock ENABLE ROW LEVEL SECURITY;
ALTER TABLE DonationRequests ENABLE ROW LEVEL SECURITY;
ALTER TABLE Donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE Notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE Coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE DonorCoupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ChatHistory ENABLE ROW LEVEL SECURITY;

-- Create a function to check if the user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM Users
        WHERE auth_id = auth.uid() AND user_type = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if the user is a patient
CREATE OR REPLACE FUNCTION is_patient()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM Users
        WHERE auth_id = auth.uid() AND user_type = 'Patient'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if the user is a donor
CREATE OR REPLACE FUNCTION is_donor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM Users
        WHERE auth_id = auth.uid() AND user_type = 'Donor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current user's ID
CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT user_id INTO v_user_id FROM Users WHERE auth_id = auth.uid();
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY admin_all_users ON Users TO authenticated
USING (is_admin());

CREATE POLICY user_read_own ON Users TO authenticated
USING (auth_id = auth.uid());

-- Patients table policies
CREATE POLICY admin_all_patients ON Patients TO authenticated
USING (is_admin());

CREATE POLICY patient_read_own ON Patients TO authenticated
USING (patient_id = get_my_user_id());

-- Donors table policies
CREATE POLICY admin_all_donors ON Donors TO authenticated
USING (is_admin());

CREATE POLICY donor_read_own ON Donors TO authenticated
USING (donor_id = get_my_user_id());

CREATE POLICY patient_read_donors ON Donors TO authenticated
USING (is_patient());

-- Blood-related tables - readable by all authenticated users
CREATE POLICY read_blood_groups ON BloodGroups FOR SELECT TO authenticated USING (true);
CREATE POLICY read_blood_components ON BloodComponents FOR SELECT TO authenticated USING (true);
CREATE POLICY read_blood_banks ON BloodBanks FOR SELECT TO authenticated USING (true);
CREATE POLICY read_blood_stock ON BloodStock FOR SELECT TO authenticated USING (true);

-- DonationRequests policies
CREATE POLICY admin_all_requests ON DonationRequests TO authenticated
USING (is_admin());

CREATE POLICY patient_own_requests ON DonationRequests TO authenticated
USING (patient_id = get_my_user_id());

CREATE POLICY donor_view_requests ON DonationRequests FOR SELECT TO authenticated
USING (is_donor());

-- Donations policies
CREATE POLICY admin_all_donations ON Donations TO authenticated
USING (is_admin());

CREATE POLICY donor_own_donations ON Donations TO authenticated
USING (donor_id = get_my_user_id());

CREATE POLICY patient_view_own_request_donations ON Donations FOR SELECT TO authenticated
USING (
    is_patient() AND 
    request_id IN (SELECT request_id FROM DonationRequests WHERE patient_id = get_my_user_id())
);

-- Notifications policies
CREATE POLICY admin_all_notifications ON Notifications TO authenticated
USING (is_admin());

CREATE POLICY donor_own_notifications ON Notifications TO authenticated
USING (donor_id = get_my_user_id());

-- Coupons policies
CREATE POLICY admin_all_coupons ON Coupons TO authenticated
USING (is_admin());

CREATE POLICY donor_view_coupons ON Coupons FOR SELECT TO authenticated
USING (is_donor());

-- DonorCoupons policies
CREATE POLICY admin_all_donor_coupons ON DonorCoupons TO authenticated
USING (is_admin());

CREATE POLICY donor_own_coupons ON DonorCoupons TO authenticated
USING (donor_id = get_my_user_id());

-- ChatHistory policies
CREATE POLICY admin_all_chat_history ON ChatHistory TO authenticated
USING (is_admin());

CREATE POLICY user_own_chat_history ON ChatHistory TO authenticated
USING (user_id = get_my_user_id());

-- ========= SEED DATA =========

-- Insert blood groups
INSERT INTO BloodGroups (group_name) VALUES 
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');

-- Insert blood components
INSERT INTO BloodComponents (component_name) VALUES 
('Whole Blood'), ('Packed Red Blood Cells'), ('Platelets'), ('Plasma'), ('Cryoprecipitate');

-- ========= FUNCTIONS FOR DYNAMIC SOS NETWORK =========

-- Function to find eligible donors for a blood request
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
    FROM DonationRequests dr
    WHERE dr.request_id = p_request_id;
    
    -- Return eligible donors
    RETURN QUERY
    SELECT 
        d.donor_id,
        ST_Distance(d.location, v_request_location) / 1000 AS distance_km,
        u.full_name,
        u.phone_number,
        u.email
    FROM Donors d
    JOIN Users u ON d.donor_id = u.user_id
    WHERE 
        d.blood_group_id = v_blood_group_id
        AND d.is_available_for_sos = true
        AND (d.last_donation_date IS NULL OR d.last_donation_date <= v_three_months_ago)
        AND d.location IS NOT NULL
        AND ST_DWithin(d.location, v_request_location, p_max_distance_km * 1000)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for eligible donors
CREATE OR REPLACE FUNCTION create_sos_notifications(
    p_request_id INTEGER,
    p_max_distance_km NUMERIC DEFAULT 15
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_donor RECORD;
    v_message TEXT;
    v_request_info RECORD;
BEGIN
    -- Get request information
    SELECT 
        dr.request_id,
        dr.urgency,
        bg.group_name,
        bc.component_name,
        dr.units_required
    INTO v_request_info
    FROM DonationRequests dr
    JOIN BloodGroups bg ON dr.blood_group_id = bg.blood_group_id
    JOIN BloodComponents bc ON dr.component_id = bc.component_id
    WHERE dr.request_id = p_request_id;
    
    -- Create the notification message
    v_message := 'URGENT: ' || v_request_info.urgency || ' request for ' || 
                 v_request_info.units_required || ' units of ' || 
                 v_request_info.group_name || ' ' || v_request_info.component_name || 
                 '. Please respond if you can help.';
    
    -- Find eligible donors and create notifications
    FOR v_donor IN 
        SELECT * FROM find_eligible_donors(p_request_id, p_max_distance_km)
    LOOP
        INSERT INTO Notifications (
            donor_id,
            request_id,
            message,
            status
        ) VALUES (
            v_donor.donor_id,
            p_request_id,
            v_message,
            'Sent'
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========= FUNCTIONS FOR DONOR PERKS PROGRAM =========

-- Function to match donor with suitable coupons
CREATE OR REPLACE FUNCTION match_donor_with_coupons(
    p_donor_id INTEGER
)
RETURNS TABLE (
    coupon_id INTEGER,
    partner_name VARCHAR(255),
    coupon_title VARCHAR(255)
) AS $$
DECLARE
    v_taste_keywords JSONB;
BEGIN
    -- Get donor's taste keywords
    SELECT qloo_taste_keywords INTO v_taste_keywords
    FROM Donors
    WHERE donor_id = p_donor_id;
    
    -- If no taste keywords, return empty result
    IF v_taste_keywords IS NULL OR v_taste_keywords = '[]'::jsonb THEN
        RETURN;
    END IF;
    
    -- Find matching coupons
    RETURN QUERY
    SELECT 
        c.coupon_id,
        c.partner_name,
        c.coupon_title
    FROM Coupons c
    WHERE 
        c.quantity_redeemed < c.quantity_total
        AND (c.expiry_date IS NULL OR c.expiry_date >= CURRENT_DATE)
        AND (
            -- Check if any keyword in donor's taste matches any in coupon's target
            c.target_keywords ?| (SELECT array_agg(x) FROM jsonb_array_elements_text(v_taste_keywords) x)
        )
    ORDER BY c.coupon_id ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique redemption code
CREATE OR REPLACE FUNCTION generate_redemption_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    v_code VARCHAR(20);
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random alphanumeric code
        v_code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
        );
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM DonorCoupons WHERE unique_redemption_code = v_code
        ) INTO v_exists;
        
        -- If code doesn't exist, return it
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to issue a coupon to a donor
CREATE OR REPLACE FUNCTION issue_coupon_to_donor(
    p_donor_id INTEGER,
    p_coupon_id INTEGER
)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_redemption_code VARCHAR(20);
BEGIN
    -- Generate a unique redemption code
    v_redemption_code := generate_redemption_code();
    
    -- Insert the donor coupon record
    INSERT INTO DonorCoupons (
        donor_id,
        coupon_id,
        status,
        unique_redemption_code
    ) VALUES (
        p_donor_id,
        p_coupon_id,
        'Issued',
        v_redemption_code
    );
    
    -- Update the coupon's redeemed count
    UPDATE Coupons
    SET quantity_redeemed = quantity_redeemed + 1
    WHERE coupon_id = p_coupon_id;
    
    RETURN v_redemption_code;
END;
$$ LANGUAGE plpgsql;