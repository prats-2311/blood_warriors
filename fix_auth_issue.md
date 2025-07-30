# Fix Authentication Issue

## Problem

Users exist in database but getting "Unauthorized" errors.

## Root Cause

The issue is likely due to:

1. Stale session data in browser
2. Backend using wrong Supabase client for token validation
3. Mismatch between auth tokens and database records

## Solution Steps

### 1. Clear Browser Session (IMMEDIATE FIX)

Open browser console and run:

```javascript
// Clear all Supabase session data
Object.keys(localStorage).forEach((key) => {
  if (key.includes("supabase") || key.includes("sb-")) {
    localStorage.removeItem(key);
  }
});
Object.keys(sessionStorage).forEach((key) => {
  if (key.includes("supabase") || key.includes("sb-")) {
    sessionStorage.removeItem(key);
  }
});
location.reload();
```

### 2. Register a New User

Instead of trying to login with existing users, register a completely new user:

- Go to http://localhost:3100/register
- Use a new email address (not one from the database)
- Complete the registration process

### 3. Backend Configuration Fixed

The backend now has:

- ✅ Proper Supabase client configuration
- ✅ Separate clients for auth validation and database operations
- ✅ Debug endpoints for troubleshooting

### 4. Test Authentication

After clearing session and registering new user:

1. Registration should work without errors
2. Login should redirect to dashboard
3. Profile should load correctly

## Debug Information

- Backend API: http://localhost:4000
- Debug users: http://localhost:4000/api/debug/users
- All existing users are visible in database
- Backend is running and responding correctly

## Next Steps

1. Clear browser session (most important)
2. Register with NEW email address
3. Test the complete flow
4. If issues persist, check browser console for specific errors
