-- Add indexes and functions for authentication system
-- Date: 2025-01-31

-- ========= INDEXES FOR PERFORMANCE =========

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Donor and patient indexes
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group_id);
CREATE INDEX IF NOT EXISTS idx_donors_available ON donors(is_available_for_sos);
CREATE INDEX IF NOT EXISTS idx_donors_location ON donors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_donors_qloo_taste_keywords ON donors USING GIN (qloo_taste_keywords);

CREATE INDEX IF NOT EXISTS idx_patients_blood_group ON patients(blood_group_id);
CREATE INDEX IF NOT EXISTS idx_patients_taste_keywords ON patients USING GIN (taste_keywords);

-- Request and donation indexes
CREATE INDEX IF NOT EXISTS idx_requests_status ON donationrequests(status);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON donationrequests(urgency);
CREATE INDEX IF NOT EXISTS idx_requests_patient ON donationrequests(patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_location ON donationrequests USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_request ON donations(request_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);

CREATE INDEX IF NOT EXISTS idx_notifications_donor ON notifications(donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

CREATE INDEX IF NOT EXISTS idx_bloodbanks_location ON bloodbanks USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_chathistory_user_timestamp ON chathistory (user_id, timestamp DESC);

-- Authentication table indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash ON email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_used_at ON password_resets(used_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active ON refresh_tokens(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_verifications_pending ON email_verifications(user_id, expires_at) WHERE verified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_resets_pending ON password_resets(user_id, expires_at) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_login_attempts_recent_failures ON login_attempts(email, attempted_at) WHERE success = false;

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

-- ========= AUTHENTICATION HELPER FUNCTIONS =========

CREATE OR REPLACE FUNCTION cleanup_expired_auth_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM email_verifications 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    DELETE FROM password_resets 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    DELETE FROM login_attempts 
    WHERE attempted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_account_locked(user_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT is_active, locked_until, failed_login_attempts
    INTO user_record
    FROM users 
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    IF NOT user_record.is_active THEN
        RETURN TRUE;
    END IF;
    
    IF user_record.locked_until IS NOT NULL AND user_record.locked_until > CURRENT_TIMESTAMP THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_failed_login(user_email VARCHAR, ip_addr INET DEFAULT NULL, user_agent_str TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    current_attempts INTEGER;
    lock_duration INTERVAL;
BEGIN
    UPDATE users 
    SET failed_login_attempts = failed_login_attempts + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = user_email;
    
    SELECT failed_login_attempts INTO current_attempts
    FROM users 
    WHERE email = user_email;
    
    IF current_attempts >= 5 THEN
        IF current_attempts >= 10 THEN
            lock_duration := INTERVAL '1 hour';
        ELSE
            lock_duration := INTERVAL '15 minutes';
        END IF;
        
        UPDATE users 
        SET locked_until = CURRENT_TIMESTAMP + lock_duration,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = user_email;
    END IF;
    
    INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason, user_id)
    SELECT user_email, ip_addr, user_agent_str, false, 'invalid_credentials', user_id
    FROM users WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_successful_login(user_email VARCHAR, ip_addr INET DEFAULT NULL, user_agent_str TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    UPDATE users 
    SET failed_login_attempts = 0,
        locked_until = NULL,
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = user_email
    RETURNING user_id INTO user_uuid;
    
    INSERT INTO login_attempts (email, ip_address, user_agent, success, user_id)
    VALUES (user_email, ip_addr, user_agent_str, true, user_uuid);
    
    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION revoke_all_user_tokens(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    UPDATE refresh_tokens 
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE user_id = target_user_id 
    AND revoked_at IS NULL;
    
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_interest_keywords(keywords JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF jsonb_typeof(keywords) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    IF jsonb_array_length(keywords) > 20 THEN
        RETURN FALSE;
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(keywords) AS elem
        WHERE jsonb_typeof(elem) != 'string' 
           OR length(elem::text) > 50
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sanitize_interest_keywords(keywords JSONB)
RETURNS JSONB AS $$
DECLARE
    sanitized JSONB := '[]'::jsonb;
    keyword TEXT;
BEGIN
    IF keywords IS NULL OR jsonb_typeof(keywords) != 'array' THEN
        RETURN '[]'::jsonb;
    END IF;
    
    FOR keyword IN SELECT jsonb_array_elements_text(keywords)
    LOOP
        keyword := lower(trim(keyword));
        
        IF length(keyword) >= 2 AND length(keyword) <= 50 THEN
            sanitized := sanitized || to_jsonb(keyword);
        END IF;
    END LOOP;
    
    RETURN sanitized;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;