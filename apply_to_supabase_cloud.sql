-- Blood Warriors AI Platform - Database Schema for Supabase Cloud
-- Apply this in your Supabase SQL Editor

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom ENUM types
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('Patient', 'Donor', 'Admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE blood_bank_category AS ENUM ('Govt', 'Private', 'Charitable/Vol');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_urgency AS ENUM ('SOS', 'Urgent', 'Scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('Open', 'In Progress', 'Fulfilled', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('Sent', 'Read', 'Accepted', 'Declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_status AS ENUM ('Issued', 'Redeemed', 'Expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========= USER & PROFILE TABLES =========

-- Create a custom users table that extends Supabase auth.users
CREATE TABLE IF NOT EXISTS Users (
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
CREATE TABLE IF NOT EXISTS BloodGroups (
    blood_group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(3) NOT NULL UNIQUE -- e.g., 'A+', 'O-', 'AB+'
);

CREATE TABLE IF NOT EXISTS Patients (
    patient_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    date_of_birth DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS Donors (
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

-- ========= BLOOD DATA & INVENTORY TABLES =========

CREATE TABLE IF NOT EXISTS BloodComponents (
    component_id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE -- e.g., 'Whole Blood', 'Packed Red Blood Cells'
);

CREATE TABLE IF NOT EXISTS BloodBanks (
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

CREATE TABLE IF NOT EXISTS BloodStock (
    stock_id SERIAL PRIMARY KEY,
    bank_id INTEGER NOT NULL REFERENCES BloodBanks(bank_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    component_id INTEGER NOT NULL REFERENCES BloodComponents(component_id),
    units_available INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bank_id, blood_group_id, component_id)
);

-- ========= ACTIVITY & TRANSACTION TABLES =========

CREATE TABLE IF NOT EXISTS DonationRequests (
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

CREATE TABLE IF NOT EXISTS Donations (
    donation_id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    bank_id INTEGER REFERENCES BloodBanks(bank_id),
    request_id INTEGER REFERENCES DonationRequests(request_id),
    donation_date DATE NOT NULL,
    units_donated INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Notifications (
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

CREATE TABLE IF NOT EXISTS Coupons (
    coupon_id SERIAL PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    coupon_title VARCHAR(255) NOT NULL,
    target_keywords JSONB NOT NULL, -- Using JSONB for better performance
    quantity_total INTEGER,
    quantity_redeemed INTEGER DEFAULT 0,
    expiry_date DATE
);

CREATE TABLE IF NOT EXISTS DonorCoupons (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    coupon_id INTEGER NOT NULL REFERENCES Coupons(coupon_id),
    status coupon_status NOT NULL DEFAULT 'Issued',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unique_redemption_code VARCHAR(20) NOT NULL UNIQUE
);

-- ========= AI & LOGGING TABLES =========

CREATE TABLE IF NOT EXISTS ChatHistory (
    chat_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert blood groups
INSERT INTO BloodGroups (group_name) VALUES 
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-')
ON CONFLICT (group_name) DO NOTHING;

-- Insert blood components
INSERT INTO BloodComponents (component_name) VALUES 
('Whole Blood'), ('Packed Red Blood Cells'), ('Platelets'), ('Plasma'), ('Cryoprecipitate')
ON CONFLICT (component_name) DO NOTHING;

-- Success message
SELECT 'Blood Warriors database schema applied successfully!' as message;