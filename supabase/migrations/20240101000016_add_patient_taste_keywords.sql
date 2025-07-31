-- Migration: Add taste_keywords field to patients table for AI personalization
-- Date: 2025-01-31
-- Purpose: Enable personalized chat responses for patients based on their interests

-- Add taste_keywords field to patients table
ALTER TABLE public.patients 
ADD COLUMN taste_keywords JSONB DEFAULT '[]'::jsonb;

-- Add performance indexes for taste_keywords fields
CREATE INDEX IF NOT EXISTS idx_patients_taste_keywords ON patients USING GIN (taste_keywords);

-- Ensure donors table has the index as well (it should already exist but let's be safe)
CREATE INDEX IF NOT EXISTS idx_donors_qloo_taste_keywords ON donors USING GIN (qloo_taste_keywords);

-- Add index for chat history queries with user_id and timestamp for better performance
CREATE INDEX IF NOT EXISTS idx_chathistory_user_timestamp ON chathistory (user_id, timestamp DESC);

-- Create a function to validate interest keywords
CREATE OR REPLACE FUNCTION validate_interest_keywords(keywords JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if it's a valid JSON array
    IF jsonb_typeof(keywords) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if array has reasonable size (max 20 interests)
    IF jsonb_array_length(keywords) > 20 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all elements are strings and not too long
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

-- Create a function to sanitize interest keywords
CREATE OR REPLACE FUNCTION sanitize_interest_keywords(keywords JSONB)
RETURNS JSONB AS $$
DECLARE
    sanitized JSONB := '[]'::jsonb;
    keyword TEXT;
BEGIN
    -- If input is null or not an array, return empty array
    IF keywords IS NULL OR jsonb_typeof(keywords) != 'array' THEN
        RETURN '[]'::jsonb;
    END IF;
    
    -- Process each keyword
    FOR keyword IN SELECT jsonb_array_elements_text(keywords)
    LOOP
        -- Trim whitespace and convert to lowercase
        keyword := lower(trim(keyword));
        
        -- Skip empty or very short keywords
        IF length(keyword) >= 2 AND length(keyword) <= 50 THEN
            sanitized := sanitized || to_jsonb(keyword);
        END IF;
    END LOOP;
    
    RETURN sanitized;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find matching coupons based on interests
CREATE OR REPLACE FUNCTION find_matching_coupons_by_interests(
    user_interests JSONB,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    coupon_id UUID,
    partner_name VARCHAR(255),
    description TEXT,
    discount_percentage INTEGER,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.coupon_id,
        c.partner_name,
        c.description,
        c.discount_percentage,
        -- Calculate match score based on keyword overlap
        (
            SELECT COUNT(*)::INTEGER
            FROM jsonb_array_elements_text(user_interests) AS user_keyword
            WHERE c.target_keywords ? user_keyword
        ) AS match_score
    FROM coupons c
    WHERE 
        c.is_active = true
        AND c.expiry_date > CURRENT_DATE
        AND (
            -- Check if any user interest matches any coupon target keyword
            EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(user_interests) AS user_keyword
                WHERE c.target_keywords ? user_keyword
            )
        )
    ORDER BY match_score DESC, c.created_at DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Add comments to document the new fields
COMMENT ON COLUMN patients.taste_keywords IS 'JSON array of user interests for AI personalization (e.g., ["cricket", "movies", "music"])';
COMMENT ON FUNCTION validate_interest_keywords(JSONB) IS 'Validates that interest keywords are properly formatted and within limits';
COMMENT ON FUNCTION sanitize_interest_keywords(JSONB) IS 'Sanitizes and normalizes interest keywords for consistent storage';
COMMENT ON FUNCTION find_matching_coupons_by_interests(JSONB, INTEGER) IS 'Finds coupons that match user interests with scoring';