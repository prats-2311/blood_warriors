-- Disable the problematic auth trigger that's preventing user registration
-- The backend will handle user creation manually

-- Drop the trigger that automatically creates users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well to avoid confusion
DROP FUNCTION IF EXISTS handle_new_user_registration() CASCADE;

-- Add a note about this change
INSERT INTO auth_config_notes (note) VALUES 
('TRIGGER DISABLED: Removed automatic user creation trigger. Backend now handles user creation manually during registration process.');