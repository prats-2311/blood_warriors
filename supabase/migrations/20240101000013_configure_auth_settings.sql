-- Configure authentication settings for development
-- Note: Some settings need to be changed manually in Supabase Dashboard

-- Create a function to handle user registration without email confirmation
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically confirm email for development
  -- This function will be called when a new user is created in auth.users
  
  -- Insert user into our custom users table
  INSERT INTO public.users (
    auth_id,
    email,
    phone_number,
    full_name,
    city,
    state,
    user_type
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'Patient')::user_type
  )
  ON CONFLICT (auth_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
-- This will automatically create a user record when someone signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Create a table for configuration notes
CREATE TABLE IF NOT EXISTS auth_config_notes (
  id SERIAL PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a note about manual configuration needed
INSERT INTO auth_config_notes (note) VALUES 
('MANUAL ACTION REQUIRED: Go to Supabase Dashboard > Authentication > Settings and:
1. Turn OFF "Enable email confirmations"
2. Turn ON "Enable sign ups"  
3. Set Site URL to http://localhost:3100
4. Save settings');

-- Create a function to check auth configuration
CREATE OR REPLACE FUNCTION check_auth_config()
RETURNS TABLE (
  setting_name TEXT,
  current_value TEXT,
  recommended_value TEXT,
  needs_change BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Email Confirmations'::TEXT as setting_name,
    'Check Dashboard'::TEXT as current_value,
    'Disabled'::TEXT as recommended_value,
    true as needs_change
  UNION ALL
  SELECT 
    'Sign Ups'::TEXT,
    'Check Dashboard'::TEXT,
    'Enabled'::TEXT,
    true;
END;
$$ LANGUAGE plpgsql;