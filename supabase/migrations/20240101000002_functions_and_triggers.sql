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