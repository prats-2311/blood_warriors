-- Seed data migration for Blood Warriors AI Platform

-- Insert sample blood banks
INSERT INTO BloodBanks (name, address, city, state, category, phone, email, latitude, longitude) VALUES
('AIIMS Blood Bank', 'All India Institute of Medical Sciences, Ansari Nagar', 'New Delhi', 'Delhi', 'Govt', '+91-11-26588500', 'bloodbank@aiims.edu', 28.5672, 77.2100),
('Fortis Hospital Blood Bank', 'Sector 62, Phase VIII', 'Mohali', 'Punjab', 'Private', '+91-172-5096001', 'bloodbank@fortishealthcare.com', 30.6942, 76.7344),
('Red Cross Blood Bank', 'Red Cross Bhawan, 1 Red Cross Road', 'Mumbai', 'Maharashtra', 'Charitable/Vol', '+91-22-22660424', 'info@indianredcross.org', 19.0760, 72.8777),
('Apollo Hospital Blood Bank', 'Jubilee Hills', 'Hyderabad', 'Telangana', 'Private', '+91-40-23607777', 'bloodbank@apollohospitals.com', 17.4239, 78.4738),
('Rotary Blood Bank', 'TTK Road, Alwarpet', 'Chennai', 'Tamil Nadu', 'Charitable/Vol', '+91-44-24981331', 'rotarybloodbank@gmail.com', 13.0339, 80.2619);

-- Insert sample blood stock
INSERT INTO BloodStock (bank_id, blood_group_id, component_id, units_available, last_updated) VALUES
-- AIIMS Blood Bank stock
(1, 1, 1, 25, CURRENT_TIMESTAMP), -- A+ Whole Blood
(1, 1, 2, 15, CURRENT_TIMESTAMP), -- A+ Packed RBC
(1, 2, 1, 8, CURRENT_TIMESTAMP),  -- A- Whole Blood
(1, 3, 1, 30, CURRENT_TIMESTAMP), -- B+ Whole Blood
(1, 7, 1, 45, CURRENT_TIMESTAMP), -- O+ Whole Blood
(1, 8, 1, 12, CURRENT_TIMESTAMP), -- O- Whole Blood

-- Fortis Hospital stock
(2, 1, 1, 18, CURRENT_TIMESTAMP), -- A+ Whole Blood
(2, 3, 1, 22, CURRENT_TIMESTAMP), -- B+ Whole Blood
(2, 7, 1, 35, CURRENT_TIMESTAMP), -- O+ Whole Blood
(2, 8, 1, 8, CURRENT_TIMESTAMP),  -- O- Whole Blood

-- Red Cross Blood Bank stock
(3, 1, 1, 40, CURRENT_TIMESTAMP), -- A+ Whole Blood
(3, 1, 2, 25, CURRENT_TIMESTAMP), -- A+ Packed RBC
(3, 1, 3, 10, CURRENT_TIMESTAMP), -- A+ Platelets
(3, 7, 1, 50, CURRENT_TIMESTAMP), -- O+ Whole Blood
(3, 8, 1, 15, CURRENT_TIMESTAMP), -- O- Whole Blood

-- Apollo Hospital stock
(4, 2, 1, 12, CURRENT_TIMESTAMP), -- A- Whole Blood
(4, 4, 1, 18, CURRENT_TIMESTAMP), -- B- Whole Blood
(4, 5, 1, 8, CURRENT_TIMESTAMP),  -- AB+ Whole Blood
(4, 7, 1, 28, CURRENT_TIMESTAMP), -- O+ Whole Blood

-- Rotary Blood Bank stock
(5, 1, 1, 32, CURRENT_TIMESTAMP), -- A+ Whole Blood
(5, 3, 1, 28, CURRENT_TIMESTAMP), -- B+ Whole Blood
(5, 7, 1, 42, CURRENT_TIMESTAMP), -- O+ Whole Blood
(5, 8, 1, 10, CURRENT_TIMESTAMP); -- O- Whole Blood

-- Insert sample coupons for the perks program
INSERT INTO Coupons (partner_name, coupon_title, target_keywords, quantity_total, quantity_redeemed, expiry_date) VALUES
('Zomato', '20% off on your next food order', '["food", "dining", "restaurants"]', 100, 15, '2024-12-31'),
('BookMyShow', 'Free movie ticket on booking 2 tickets', '["entertainment", "movies", "cinema"]', 50, 8, '2024-11-30'),
('Myntra', 'Flat ₹500 off on fashion purchases above ₹2000', '["fashion", "clothing", "lifestyle"]', 75, 12, '2024-10-31'),
('Swiggy', 'Free delivery on your next 3 orders', '["food", "delivery", "convenience"]', 200, 45, '2024-12-15'),
('Uber', '₹100 off on your next ride', '["travel", "transportation", "mobility"]', 150, 32, '2024-09-30'),
('Flipkart', '15% off on electronics and gadgets', '["technology", "electronics", "gadgets"]', 80, 18, '2024-11-15'),
('Nykaa', 'Buy 2 Get 1 Free on skincare products', '["beauty", "skincare", "wellness"]', 60, 9, '2024-10-15'),
('Amazon', '₹200 cashback on purchases above ₹1500', '["shopping", "online", "retail"]', 120, 28, '2024-12-31');