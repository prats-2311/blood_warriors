-- Fix RLS policies to allow user registration

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS users_own_data ON users;

-- Create separate policies for different operations
-- Allow anyone to insert (for registration)
CREATE POLICY users_can_register ON users
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY users_can_read_own ON users
FOR SELECT TO authenticated
USING (auth_id = auth.uid());

-- Allow users to update their own data
CREATE POLICY users_can_update_own ON users
FOR UPDATE TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Allow users to delete their own data (optional)
CREATE POLICY users_can_delete_own ON users
FOR DELETE TO authenticated
USING (auth_id = auth.uid());

-- Update the helper function to handle the case where user doesn't exist yet
CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT user_id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    RETURN COALESCE(v_user_id, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update other policies to be more permissive during registration
-- Allow patients to insert their own records
DROP POLICY IF EXISTS patients_own_data ON patients;

CREATE POLICY patients_can_insert ON patients
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY patients_can_read_own ON patients
FOR SELECT TO authenticated
USING (patient_id = get_my_user_id() OR get_my_user_id() = 0);

CREATE POLICY patients_can_update_own ON patients
FOR UPDATE TO authenticated
USING (patient_id = get_my_user_id())
WITH CHECK (patient_id = get_my_user_id());

-- Allow donors to insert their own records
DROP POLICY IF EXISTS donors_own_data ON donors;

CREATE POLICY donors_can_insert ON donors
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY donors_can_read_own ON donors
FOR SELECT TO authenticated
USING (donor_id = get_my_user_id() OR get_my_user_id() = 0);

CREATE POLICY donors_can_update_own ON donors
FOR UPDATE TO authenticated
USING (donor_id = get_my_user_id())
WITH CHECK (donor_id = get_my_user_id());

-- Keep the existing readable policy for donors (if it exists)
DROP POLICY IF EXISTS donors_readable_by_patients ON donors;
CREATE POLICY donors_readable_by_patients ON donors
FOR SELECT TO authenticated
USING (is_patient() OR is_admin());