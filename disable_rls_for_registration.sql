-- Temporarily disable RLS for registration tables
-- Apply this in your Supabase SQL Editor

-- Drop all existing policies on users table
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS users_can_register ON users;
DROP POLICY IF EXISTS users_can_read_own ON users;
DROP POLICY IF EXISTS users_can_update_own ON users;
DROP POLICY IF EXISTS users_can_delete_own ON users;
DROP POLICY IF EXISTS users_registration_and_own_data ON users;

-- Drop all existing policies on patients table
DROP POLICY IF EXISTS patients_own_data ON patients;
DROP POLICY IF EXISTS patients_can_insert ON patients;
DROP POLICY IF EXISTS patients_can_read_own ON patients;
DROP POLICY IF EXISTS patients_can_update_own ON patients;

-- Drop all existing policies on donors table
DROP POLICY IF EXISTS donors_own_data ON donors;
DROP POLICY IF EXISTS donors_can_insert ON donors;
DROP POLICY IF EXISTS donors_can_read_own ON donors;
DROP POLICY IF EXISTS donors_can_update_own ON donors;
DROP POLICY IF EXISTS donors_readable_by_patients ON donors;

-- Temporarily disable RLS on these tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE donors DISABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'RLS temporarily disabled for registration. Re-enable after testing!' as message;