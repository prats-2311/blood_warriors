-- ========= ROW LEVEL SECURITY POLICIES =========

-- Enable RLS on user-specific tables only (not reference tables)
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE Donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE DonationRequests ENABLE ROW LEVEL SECURITY;
ALTER TABLE Donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE Notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE DonorCoupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ChatHistory ENABLE ROW LEVEL SECURITY;

-- Keep reference tables open for all authenticated users
-- BloodGroups, BloodComponents, BloodBanks, BloodStock, Coupons

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

-- Simplified RLS policies for initial setup
-- More restrictive policies can be added later

-- Users table policies - allow users to read/update their own data
CREATE POLICY users_own_data ON Users FOR ALL TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Patients table policies - allow patients to manage their own data
CREATE POLICY patients_own_data ON Patients FOR ALL TO authenticated
USING (patient_id = get_my_user_id())
WITH CHECK (patient_id = get_my_user_id());

-- Donors table policies - allow donors to manage their own data, patients can read
CREATE POLICY donors_own_data ON Donors FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

CREATE POLICY donors_readable_by_patients ON Donors FOR SELECT TO authenticated
USING (is_patient() OR is_admin());

-- DonationRequests policies - patients own their requests, donors can read
CREATE POLICY requests_patient_owns ON DonationRequests FOR ALL TO authenticated
USING (patient_id = get_my_user_id())
WITH CHECK (patient_id = get_my_user_id());

CREATE POLICY requests_donors_can_read ON DonationRequests FOR SELECT TO authenticated
USING (is_donor() OR is_admin());

-- Donations policies - donors own their donations
CREATE POLICY donations_donor_owns ON Donations FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

-- Notifications policies - donors own their notifications
CREATE POLICY notifications_donor_owns ON Notifications FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

-- DonorCoupons policies - donors own their coupons
CREATE POLICY donor_coupons_own ON DonorCoupons FOR ALL TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

-- ChatHistory policies - users own their chat history
CREATE POLICY chat_history_own ON ChatHistory FOR ALL TO authenticated
USING (user_id = get_my_user_id())
WITH CHECK (user_id = get_my_user_id());