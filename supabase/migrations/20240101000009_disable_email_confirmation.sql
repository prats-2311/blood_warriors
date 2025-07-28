-- Disable email confirmation for development
-- Note: This should be re-enabled in production

-- This migration doesn't directly change auth settings (those are in Supabase dashboard)
-- But we can create a note for manual configuration

-- Create a temporary table to remind us about auth settings
CREATE TABLE IF NOT EXISTS _auth_config_notes (
    id SERIAL PRIMARY KEY,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO _auth_config_notes (note) VALUES 
('MANUAL ACTION REQUIRED: Disable email confirmation in Supabase Dashboard > Authentication > Settings > Email Confirmations = OFF for development');

-- Also ensure our backend can handle unconfirmed emails
-- This is handled in the backend auth controller