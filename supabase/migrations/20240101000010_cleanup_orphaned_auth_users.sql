-- Clean up orphaned auth users and fix registration issues

-- Create a function to clean up orphaned auth users
-- These are users in auth.users but not in our users table
CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users()
RETURNS INTEGER AS $$
DECLARE
    orphaned_count INTEGER := 0;
    auth_user RECORD;
BEGIN
    -- Find auth users that don't have corresponding records in our users table
    FOR auth_user IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN users u ON au.id = u.auth_id
        WHERE u.auth_id IS NULL
    LOOP
        -- Log the cleanup (optional)
        RAISE NOTICE 'Cleaning up orphaned auth user: % (%)', auth_user.email, auth_user.id;
        
        -- Delete the orphaned auth user
        -- Note: This requires service role permissions
        -- DELETE FROM auth.users WHERE id = auth_user.id;
        
        orphaned_count := orphaned_count + 1;
    END LOOP;
    
    RETURN orphaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle registration cleanup on failure
CREATE OR REPLACE FUNCTION handle_registration_failure(p_auth_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete any partial records that might have been created
    DELETE FROM patients WHERE patient_id IN (
        SELECT user_id FROM users WHERE auth_id = p_auth_id
    );
    
    DELETE FROM donors WHERE donor_id IN (
        SELECT user_id FROM users WHERE auth_id = p_auth_id
    );
    
    DELETE FROM users WHERE auth_id = p_auth_id;
    
    -- Note: We can't delete from auth.users here due to RLS
    -- This needs to be handled in the backend
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a unique constraint on email in our users table to prevent duplicates
-- This might already exist, so we use IF NOT EXISTS equivalent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- Add a unique constraint on phone_number to prevent duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_phone_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone_number);
    END IF;
END $$;