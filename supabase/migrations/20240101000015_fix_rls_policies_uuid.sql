-- Fix RLS policies for UUID-based schema
-- This migration ensures proper RLS policies that allow user registration

-- First, disable RLS on all tables to clean slate
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE donors DISABLE ROW LEVEL SECURITY;
ALTER TABLE donationrequests DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE donorcoupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE chathistory DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS users_can_register ON users;
DROP POLICY IF EXISTS users_can_read_own ON users;
DROP POLICY IF EXISTS users_can_update_own ON users;
DROP POLICY IF EXISTS users_can_delete_own ON users;

DROP POLICY IF EXISTS patients_own_data ON patients;
DROP POLICY IF EXISTS patients_can_insert ON patients;
DROP POLICY IF EXISTS patients_can_read_own ON patients;
DROP POLICY IF EXISTS patients_can_update_own ON patients;

DROP POLICY IF EXISTS donors_own_data ON donors;
DROP POLICY IF EXISTS donors_can_insert ON donors;
DROP POLICY IF EXISTS donors_can_read_own ON donors;
DROP POLICY IF EXISTS donors_can_update_own ON donors;
DROP POLICY IF EXISTS donors_readable_by_patients ON donors;

DROP POLICY IF EXISTS requests_patient_owns ON donationrequests;
DROP POLICY IF EXISTS requests_donors_can_read ON donationrequests;

DROP POLICY IF EXISTS donations_donor_owns ON donations;

DROP POLICY IF EXISTS notifications_donor_owns ON notifications;

DROP POLICY IF EXISTS donor_coupons_own ON donorcoupons;

DROP POLICY IF EXISTS chat_history_own ON chathistory;

-- Drop old functions that might conflict
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_patient() CASCADE;
DROP FUNCTION IF EXISTS is_donor() CASCADE;

-- Recreate helper functions for UUID-based schema
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

-- Update get_my_user_id function to return UUID
CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donationrequests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE donorcoupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE chathistory ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for registration and basic operations

-- Users table policies - allow registration and own data access
CREATE POLICY users_registration ON users
FOR INSERT TO authenticated
WITH CHECK (auth_id = auth.uid());

CREATE POLICY users_own_data ON users
FOR ALL TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Patients table policies - allow registration and own data access
CREATE POLICY patients_registration ON patients
FOR INSERT TO authenticated
WITH CHECK (patient_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY patients_own_data ON patients
FOR ALL TO authenticated
USING (patient_id = get_my_user_id())
WITH CHECK (patient_id = get_my_user_id());

-- Donors table policies - allow registration, own data access, and reading by patients
CREATE POLICY donors_registration ON donors
FOR INSERT TO authenticated
WITH CHECK (donor_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY donors_own_data ON donors
FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

CREATE POLICY donors_readable_by_patients ON donors
FOR SELECT TO authenticated
USING (is_patient() OR is_admin());

-- DonationRequests policies - patients own their requests, donors can read
CREATE POLICY requests_patient_owns ON donationrequests
FOR ALL TO authenticated
USING (patient_id = get_my_user_id())
WITH CHECK (patient_id = get_my_user_id());

CREATE POLICY requests_donors_can_read ON donationrequests
FOR SELECT TO authenticated
USING (is_donor() OR is_admin());

-- Donations policies - donors own their donations
CREATE POLICY donations_donor_owns ON donations
FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

-- Notifications policies - donors own their notifications
CREATE POLICY notifications_donor_owns ON notifications
FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

-- DonorCoupons policies - donors own their coupons
CREATE POLICY donor_coupons_own ON donorcoupons
FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

-- ChatHistory policies - users own their chat history
CREATE POLICY chat_history_own ON chathistory
FOR ALL TO authenticated
USING (user_id = get_my_user_id())
WITH CHECK (user_id = get_my_user_id());

-- Keep reference tables open for all authenticated users (no RLS needed)
-- bloodgroups, bloodcomponents, bloodbanks, bloodstock, coupons