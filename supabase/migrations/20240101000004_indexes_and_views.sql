-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON Users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON Users(user_type);
CREATE INDEX IF NOT EXISTS idx_donors_location ON Donors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON Donors(blood_group_id);
CREATE INDEX IF NOT EXISTS idx_donors_available_sos ON Donors(is_available_for_sos);
CREATE INDEX IF NOT EXISTS idx_blood_banks_location ON BloodBanks USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_blood_banks_city ON BloodBanks(city);
CREATE INDEX IF NOT EXISTS idx_blood_banks_state ON BloodBanks(state);
CREATE INDEX IF NOT EXISTS idx_donation_requests_location ON DonationRequests USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON DonationRequests(status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_urgency ON DonationRequests(urgency);
CREATE INDEX IF NOT EXISTS idx_donation_requests_patient_id ON DonationRequests(patient_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_blood_group ON DonationRequests(blood_group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_donor_id ON Notifications(donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON Notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON Notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_blood_stock_bank_id ON BloodStock(bank_id);
CREATE INDEX IF NOT EXISTS idx_blood_stock_blood_group_id ON BloodStock(blood_group_id);
CREATE INDEX IF NOT EXISTS idx_blood_stock_component_id ON BloodStock(component_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON Donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_request_id ON Donations(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_coupons_donor_id ON DonorCoupons(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_coupons_status ON DonorCoupons(status);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON ChatHistory(user_id);

-- Add some helpful views for common queries
CREATE OR REPLACE VIEW active_requests AS
SELECT 
    dr.*,
    u.full_name as patient_name,
    u.phone_number as patient_phone,
    bg.group_name as blood_group,
    bc.component_name as component_name
FROM DonationRequests dr
JOIN Patients p ON dr.patient_id = p.patient_id
JOIN Users u ON p.patient_id = u.user_id
JOIN BloodGroups bg ON dr.blood_group_id = bg.blood_group_id
JOIN BloodComponents bc ON dr.component_id = bc.component_id
WHERE dr.status = 'Open';

CREATE OR REPLACE VIEW available_donors AS
SELECT 
    d.*,
    u.full_name,
    u.phone_number,
    u.email,
    u.city,
    u.state,
    bg.group_name as blood_group
FROM Donors d
JOIN Users u ON d.donor_id = u.user_id
JOIN BloodGroups bg ON d.blood_group_id = bg.blood_group_id
WHERE d.is_available_for_sos = true
AND (d.last_donation_date IS NULL OR d.last_donation_date <= CURRENT_DATE - INTERVAL '3 months');

-- Grant necessary permissions
GRANT SELECT ON active_requests TO authenticated;
GRANT SELECT ON available_donors TO authenticated;