-- Initial Schema with Authentication System
-- Date: 2025-01-31
-- Purpose: Complete database schema including authentication system redesign

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========= CREATE CUSTOM TYPES =========

CREATE TYPE user_type AS ENUM ('Patient', 'Donor', 'Admin');
CREATE TYPE blood_bank_category AS ENUM ('Govt', 'Private', 'Charitable/Vol');
CREATE TYPE request_urgency AS ENUM ('SOS', 'Urgent', 'Scheduled');
CREATE TYPE request_status AS ENUM ('Open', 'In Progress', 'Fulfilled', 'Cancelled');
CREATE TYPE notification_status AS ENUM ('Sent', 'Read', 'Accepted', 'Declined');
CREATE TYPE coupon_status AS ENUM ('Issued', 'Redeemed', 'Expired');

-- ========= REFERENCE TABLES =========

CREATE TABLE bloodgroups (
    blood_group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(3) NOT NULL UNIQUE
);

CREATE TABLE bloodcomponents (
    component_id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE
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

-- ========= USER TABLES WITH AUTHENTICATION ENHANCEMENTS =========

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255)
);

CREATE TABLE patients (
    patient_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    blood_group_id INTEGER NOT NULL REFERENCES bloodgroups(blood_group_id),
    date_of_birth DATE NOT NULL,
    medical_conditions TEXT,
    emergency_contact VARCHAR(15),
    taste_keywords JSONB DEFAULT '[]'::jsonb
);

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

-- ========= AUTHENTICATION TABLES =========

CREATE TABLE refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE email_verifications (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE password_resets (
    reset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE login_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL
);

-- ========= ACTIVITY TABLES =========

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

-- ========= INSERT REFERENCE DATA =========

INSERT INTO bloodgroups (group_name) VALUES 
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');

INSERT INTO bloodcomponents (component_name) VALUES 
('Whole Blood'), ('Packed Red Blood Cells'), ('Platelets'), ('Plasma'), ('Cryoprecipitate');

INSERT INTO bloodbanks (name, address, city, state, category, phone, email, latitude, longitude) VALUES
('AIIMS Blood Bank', 'All India Institute of Medical Sciences, Ansari Nagar', 'New Delhi', 'Delhi', 'Govt', '+91-11-26588500', 'bloodbank@aiims.edu', 28.5672, 77.2100),
('Fortis Hospital Blood Bank', 'Sector 62, Phase VIII', 'Mohali', 'Punjab', 'Private', '+91-172-5096001', 'bloodbank@fortishealthcare.com', 30.6942, 76.7344),
('Red Cross Blood Bank', 'Red Cross Bhawan, 1 Red Cross Road', 'Mumbai', 'Maharashtra', 'Charitable/Vol', '+91-22-22660424', 'info@indianredcross.org', 19.0760, 72.8777);

INSERT INTO coupons (partner_name, coupon_title, target_keywords, quantity_total, quantity_redeemed, expiry_date) VALUES
('Zomato', '20% off on your next food order', '["food", "dining", "restaurants"]', 100, 0, '2024-12-31'),
('BookMyShow', 'Free movie ticket on booking 2 tickets', '["entertainment", "movies", "cinema"]', 50, 0, '2024-11-30'),
('Myntra', 'Flat ₹500 off on fashion purchases above ₹2000', '["fashion", "clothing", "lifestyle"]', 75, 0, '2024-10-31');