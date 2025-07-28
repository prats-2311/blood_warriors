-- FRESH START: Drop everything and rebuild with UUID and proper Supabase auth
-- This migration completely resets the database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========= DROP ALL EXISTING TABLES AND FUNCTIONS =========

-- Drop all existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS chathistory CASCADE;
DROP TABLE IF EXISTS donorcoupons CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS donationrequests CASCADE;
DROP TABLE IF EXISTS bloodstock CASCADE;
DROP TABLE IF EXISTS donors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop reference tables
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS bloodbanks CASCADE;
DROP TABLE IF EXISTS bloodcomponents CASCADE;
DROP TABLE IF EXISTS bloodgroups CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS cleanup_orphaned_auth_users() CASCADE;
DROP FUNCTION IF EXISTS handle_registration_failure(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_registration_conflict(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS cleanup_orphaned_registrations() CASCADE;
DROP FUNCTION IF EXISTS get_my_user_id() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_patient() CASCADE;
DROP FUNCTION IF EXISTS is_donor() CASCADE;
DROP FUNCTION IF EXISTS find_eligible_donors(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS find_eligible_donors(INTEGER, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS create_sos_notifications(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS create_sos_notifications(INTEGER, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS match_donor_with_coupons(UUID) CASCADE;
DROP FUNCTION IF EXISTS match_donor_with_coupons(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS issue_coupon_to_donor(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS issue_coupon_to_donor(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS generate_redemption_code() CASCADE;
DROP FUNCTION IF EXISTS update_donor_location() CASCADE;
DROP FUNCTION IF EXISTS update_bank_location() CASCADE;
DROP FUNCTION IF EXISTS update_request_location() CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS blood_bank_category CASCADE;
DROP TYPE IF EXISTS request_urgency CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS coupon_status CASCADE;

-- Drop any remaining views
DROP VIEW IF EXISTS active_requests CASCADE;
DROP VIEW IF EXISTS available_donors CASCADE;

-- Drop helper tables
DROP TABLE IF EXISTS _auth_config_notes CASCADE;

-- ========= CREATE FRESH SCHEMA WITH UUID =========

-- Create custom ENUM types
CREATE TYPE user_type AS ENUM ('Patient', 'Donor', 'Admin');
CREATE TYPE blood_bank_category AS ENUM ('Govt', 'Private', 'Charitable/Vol');
CREATE TYPE request_urgency AS ENUM ('SOS', 'Urgent', 'Scheduled');
CREATE TYPE request_status AS ENUM ('Open', 'In Progress', 'Fulfilled', 'Cancelled');
CREATE TYPE notification_status AS ENUM ('Sent', 'Read', 'Accepted', 'Declined');
CREATE TYPE coupon_status AS ENUM ('Issued', 'Redeemed', 'Expired');

-- ========= REFERENCE TABLES (Keep INTEGER PKs for simplicity) =========

CREATE TABLE bloodgroups (
    blood_group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(3) NOT NULL UNIQUE -- e.g., 'A+', 'O-', 'AB+'
);

CREATE TABLE bloodcomponents (
    component_id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE -- e.g., 'Whole Blood', 'Packed Red Blood Cells'
);

CREATE TABLE bloodbanks (
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
    location GEOGRAPHY(POINT)
);

CREATE TABLE coupons (
    coupon_id SERIAL PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    coupon_title VARCHAR(255) NOT NULL,
    target_keywords JSONB NOT NULL,
    quantity_total INTEGER,
    quantity_redeemed INTEGER DEFAULT 0,
    expiry_date DATE
);

-- ========= USER TABLES WITH UUID =========

-- Main users table - extends Supabase auth.users
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    user_type user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    blood_group_id INTEGER NOT NULL REFERENCES bloodgroups(blood_group_id),
    date_of_birth DATE NOT NULL,
    medical_conditions TEXT,
    emergency_contact VARCHAR(15)
);

-- Donors table
CREATE TABLE donors (
    donor_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    blood_group_id INTEGER NOT NULL REFERENCES bloodgroups(blood_group_id),
    last_donation_date DATE,
    is_available_for_sos BOOLEAN DEFAULT true,
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    qloo_taste_keywords JSONB DEFAULT '[]'::jsonb,
    location GEOGRAPHY(POINT),
    donation_count INTEGER DEFAULT 0
);

-- ========= ACTIVITY TABLES WITH UUID =========

CREATE TABLE donationrequests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    blood_group_id INTEGER NOT NULL REFERENCES bloodgroups(blood_group_id),
    component_id INTEGER NOT NULL REFERENCES bloodcomponents(component_id),
    units_required INTEGER NOT NULL,
    urgency request_urgency NOT NULL,
    status request_status NOT NULL DEFAULT 'Open',
    request_datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    hospital_name VARCHAR(255),
    hospital_address TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    location GEOGRAPHY(POINT),
    notes TEXT
);

CREATE TABLE donations (
    donation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES donors(donor_id) ON DELETE CASCADE,
    bank_id INTEGER REFERENCES bloodbanks(bank_id),
    request_id UUID REFERENCES donationrequests(request_id),
    donation_date DATE NOT NULL,
    units_donated INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES donors(donor_id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES donationrequests(request_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'Sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    fcm_token VARCHAR(255)
);

CREATE TABLE donorcoupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES donors(donor_id) ON DELETE CASCADE,
    coupon_id INTEGER NOT NULL REFERENCES coupons(coupon_id),
    status coupon_status NOT NULL DEFAULT 'Issued',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    unique_redemption_code VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE chathistory (
    chat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bloodstock (
    stock_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id INTEGER NOT NULL REFERENCES bloodbanks(bank_id),
    blood_group_id INTEGER NOT NULL REFERENCES bloodgroups(blood_group_id),
    component_id INTEGER NOT NULL REFERENCES bloodcomponents(component_id),
    units_available INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bank_id, blood_group_id, component_id)
);

-- ========= INDEXES FOR PERFORMANCE =========

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_type ON users(user_type);

CREATE INDEX idx_donors_blood_group ON donors(blood_group_id);
CREATE INDEX idx_donors_available ON donors(is_available_for_sos);
CREATE INDEX idx_donors_location ON donors USING GIST(location);

CREATE INDEX idx_patients_blood_group ON patients(blood_group_id);

CREATE INDEX idx_requests_status ON donationrequests(status);
CREATE INDEX idx_requests_urgency ON donationrequests(urgency);
CREATE INDEX idx_requests_patient ON donationrequests(patient_id);
CREATE INDEX idx_requests_location ON donationrequests USING GIST(location);

CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_request ON donations(request_id);
CREATE INDEX idx_donations_date ON donations(donation_date);

CREATE INDEX idx_notifications_donor ON notifications(donor_id);
CREATE INDEX idx_notifications_status ON notifications(status);

CREATE INDEX idx_bloodbanks_location ON bloodbanks USING GIST(location);

-- ========= TRIGGERS FOR GEOGRAPHY COLUMNS =========

CREATE OR REPLACE FUNCTION update_donor_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_donor_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON donors
FOR EACH ROW
EXECUTE FUNCTION update_donor_location();

CREATE OR REPLACE FUNCTION update_bank_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON bloodbanks
FOR EACH ROW
EXECUTE FUNCTION update_bank_location();

CREATE OR REPLACE FUNCTION update_request_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_request_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON donationrequests
FOR EACH ROW
EXECUTE FUNCTION update_request_location();

-- ========= HELPER FUNCTIONS =========

CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========= INSERT REFERENCE DATA =========

-- Insert blood groups
INSERT INTO bloodgroups (group_name) VALUES 
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');

-- Insert blood components
INSERT INTO bloodcomponents (component_name) VALUES 
('Whole Blood'), ('Packed Red Blood Cells'), ('Platelets'), ('Plasma'), ('Cryoprecipitate');

-- Insert sample blood banks
INSERT INTO bloodbanks (name, address, city, state, category, phone, email, latitude, longitude) VALUES
('AIIMS Blood Bank', 'All India Institute of Medical Sciences, Ansari Nagar', 'New Delhi', 'Delhi', 'Govt', '+91-11-26588500', 'bloodbank@aiims.edu', 28.5672, 77.2100),
('Fortis Hospital Blood Bank', 'Sector 62, Phase VIII', 'Mohali', 'Punjab', 'Private', '+91-172-5096001', 'bloodbank@fortishealthcare.com', 30.6942, 76.7344),
('Red Cross Blood Bank', 'Red Cross Bhawan, 1 Red Cross Road', 'Mumbai', 'Maharashtra', 'Charitable/Vol', '+91-22-22660424', 'info@indianredcross.org', 19.0760, 72.8777);

-- Insert sample coupons
INSERT INTO coupons (partner_name, coupon_title, target_keywords, quantity_total, quantity_redeemed, expiry_date) VALUES
('Zomato', '20% off on your next food order', '["food", "dining", "restaurants"]', 100, 0, '2024-12-31'),
('BookMyShow', 'Free movie ticket on booking 2 tickets', '["entertainment", "movies", "cinema"]', 50, 0, '2024-11-30'),
('Myntra', 'Flat ₹500 off on fashion purchases above ₹2000', '["fashion", "clothing", "lifestyle"]', 75, 0, '2024-10-31');