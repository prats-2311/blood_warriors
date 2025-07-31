# Authentication System Redesign - Database Migration

## Overview

This document describes the database schema changes required for the Authentication System Redesign. The migration adds new security features, authentication tables, and helper functions to support JWT-based authentication.

## Migration File

**Location:** `supabase/migrations/20240101000017_auth_system_redesign.sql`

## Changes Implemented

### 1. Users Table Enhancements

Added new security-related columns to the existing `users` table:

- `is_active` (BOOLEAN) - Whether the user account is active and can log in
- `is_verified` (BOOLEAN) - Whether the user has verified their email address
- `last_login` (TIMESTAMP) - Timestamp of the user's last successful login
- `failed_login_attempts` (INTEGER) - Number of consecutive failed login attempts
- `locked_until` (TIMESTAMP) - Timestamp until which the account is locked
- `password_hash` (VARCHAR) - Bcrypt hash of user password for JWT authentication

### 2. New Authentication Tables

#### Refresh Tokens Table

Stores JWT refresh tokens with rotation support:

- `token_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `token_hash` (VARCHAR) - Hashed refresh token
- `expires_at` (TIMESTAMP) - Token expiration time
- `created_at` (TIMESTAMP) - Token creation time
- `revoked_at` (TIMESTAMP) - Token revocation time (nullable)
- `device_info` (JSONB) - Device information
- `ip_address` (INET) - IP address of the device
- `user_agent` (TEXT) - User agent string

#### Email Verifications Table

Stores email verification tokens for account activation:

- `verification_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `token_hash` (VARCHAR) - Hashed verification token
- `expires_at` (TIMESTAMP) - Token expiration time
- `verified_at` (TIMESTAMP) - Verification completion time (nullable)
- `created_at` (TIMESTAMP) - Token creation time
- `email` (VARCHAR) - Email address being verified

#### Password Resets Table

Stores password reset tokens with expiration:

- `reset_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `token_hash` (VARCHAR) - Hashed reset token
- `expires_at` (TIMESTAMP) - Token expiration time
- `used_at` (TIMESTAMP) - Token usage time (nullable)
- `created_at` (TIMESTAMP) - Token creation time
- `ip_address` (INET) - IP address of the requester
- `user_agent` (TEXT) - User agent string

#### Login Attempts Table

Audit log of all login attempts for security monitoring:

- `attempt_id` (UUID, Primary Key)
- `email` (VARCHAR) - Email address used in login attempt
- `ip_address` (INET) - IP address of the attempt
- `user_agent` (TEXT) - User agent string
- `success` (BOOLEAN) - Whether the login was successful
- `failure_reason` (VARCHAR) - Reason for failure (if applicable)
- `attempted_at` (TIMESTAMP) - Time of the attempt
- `user_id` (UUID, Foreign Key to users, nullable)

### 3. Performance Indexes

The migration creates comprehensive indexes for optimal query performance:

#### User Table Indexes

- `idx_users_is_active` - For filtering active users
- `idx_users_is_verified` - For filtering verified users
- `idx_users_locked_until` - For checking account locks
- `idx_users_last_login` - For login analytics

#### Authentication Table Indexes

- Individual indexes on primary lookup columns
- Composite indexes for common query patterns
- Partial indexes for active/pending records

### 4. Helper Functions

#### `cleanup_expired_auth_tokens()`

Cleans up expired authentication tokens and old login attempts.

#### `is_account_locked(user_email VARCHAR)`

Checks if a user account is currently locked due to failed attempts.

#### `handle_failed_login(user_email VARCHAR, ip_addr INET, user_agent_str TEXT)`

Handles failed login attempts with progressive account locking.

#### `handle_successful_login(user_email VARCHAR, ip_addr INET, user_agent_str TEXT)`

Handles successful login, resets failed attempts, and logs the event.

#### `revoke_all_user_tokens(target_user_id UUID)`

Revokes all refresh tokens for a user (for security incident response).

## How to Apply the Migration

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor

### Step 2: Execute Migration SQL

1. Copy the entire contents of `supabase/migrations/20240101000017_auth_system_redesign.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

### Step 3: Verify Migration

Run the verification script to ensure the migration was applied successfully:

```bash
cd backend
node test-auth-migration.js
```

Expected output should show:

- ✅ All auth columns exist in users table
- ✅ All authentication tables exist
- ✅ Helper functions are available

## Security Considerations

### Account Locking

- Accounts are locked after 5 failed login attempts
- Lock duration: 15 minutes for 5-9 attempts, 1 hour for 10+ attempts
- Locks are automatically cleared on successful login

### Token Security

- Refresh tokens are hashed before storage
- Tokens have appropriate expiration times
- Token rotation is supported for enhanced security

### Audit Trail

- All login attempts are logged with IP and user agent
- Failed attempts include failure reasons
- Logs are automatically cleaned up after 30 days

## Migration Compatibility

### Existing Data

- All existing users are set as `is_active = true` and `is_verified = true`
- This ensures backward compatibility during the transition
- Review and adjust these settings based on business requirements

### Rollback Considerations

- The migration uses `IF NOT EXISTS` clauses to prevent conflicts
- New columns have appropriate defaults
- Foreign key constraints ensure data integrity

## Testing

After applying the migration, test the following:

1. **Schema Verification**

   ```sql
   -- Check users table columns
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'users';

   -- Check new tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_name IN ('refresh_tokens', 'email_verifications', 'password_resets', 'login_attempts');
   ```

2. **Function Testing**

   ```sql
   -- Test helper functions
   SELECT cleanup_expired_auth_tokens();
   SELECT is_account_locked('test@example.com');
   ```

3. **Index Verification**
   ```sql
   -- Check indexes were created
   SELECT indexname FROM pg_indexes
   WHERE tablename IN ('users', 'refresh_tokens', 'email_verifications', 'password_resets', 'login_attempts');
   ```

## Requirements Satisfied

This migration satisfies the following requirements from the Authentication System Redesign:

- **Requirement 2.6**: Enhanced user registration with security fields
- **Requirement 4.5**: Token management and security infrastructure
- **Requirement 6.1**: Session management database support
- **Requirement 9.5**: Comprehensive logging and audit trails

## Next Steps

After successfully applying this migration:

1. Implement the JWT Service (Task 2.1)
2. Create authentication middleware (Task 3.1)
3. Build authentication controllers (Task 4.x)
4. Update frontend authentication context (Task 5.x)

## Support

If you encounter issues during migration:

1. Check the Supabase dashboard for error messages
2. Verify your database permissions
3. Run the test script to identify specific problems
4. Review the migration SQL for any syntax issues

For additional help, refer to the Authentication System Redesign documentation in `.kiro/specs/auth-system-redesign/`.
