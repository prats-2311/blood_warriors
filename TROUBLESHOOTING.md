# 🔧 Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to fetch" / "ERR_NAME_NOT_RESOLVED"

**Symptoms:**

- Login fails with "Failed to fetch"
- Blood groups API returns network error
- Console shows CORS errors

**Solutions:**

1. **Check if backend is running:**

   ```bash
   cd backend
   npm start
   ```

   Should show: `🩸 Blood Warriors API running on port 4000`

2. **Test backend directly:**
   Open browser and visit: `http://localhost:4000/health`
   Should return: `{"status":"ok","message":"Blood Warriors API is running"}`

3. **Check environment variables:**

   ```bash
   cd backend
   cat .env
   ```

   Make sure you have:

   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Fix CORS issues:**
   The backend is now configured for both ports 3000 and 3100.

### Issue 2: "duplicate key value violates unique constraint"

**Symptoms:**

- Registration fails with phone number constraint error
- Error mentions "users_phone_number_key"

**Solutions:**

1. **Use a different phone number:**
   Try registering with a phone number you haven't used before.

2. **Clean duplicate data:**

   ```bash
   node fix-issues.js
   ```

3. **Check existing users in Supabase:**
   Go to Supabase Dashboard → Table Editor → users table
   Look for duplicate phone numbers and delete them.

### Issue 3: "Error fetching blood groups"

**Symptoms:**

- Registration form doesn't load blood group options
- Console shows blood groups API error

**Solutions:**

1. **Seed the database:**

   ```bash
   cd backend
   node seed-data.js
   ```

2. **Check database migration:**
   Make sure you applied the migration in Supabase console.

3. **Test API directly:**
   Visit: `http://localhost:4000/api/public-data/blood-groups`

### Issue 4: Login Authentication Errors

**Symptoms:**

- Login form shows "Failed to fetch"
- Authentication token errors

**Solutions:**

1. **Check Supabase Auth settings:**

   - Go to Supabase Dashboard → Authentication → Settings
   - Make sure "Enable email confirmations" is OFF for testing
   - Check if "Enable custom SMTP" is properly configured

2. **Test with correct credentials:**
   Make sure you're using the email/password you registered with.

3. **Clear browser cache:**
   Sometimes old tokens cause issues.

## 🛠️ Quick Fix Commands

### 1. Complete Environment Setup

```bash
# Set up environment variables
./setup-env.sh

# Apply database migration (in Supabase console)
# Copy SQL from: supabase/migrations/20240101000016_add_patient_taste_keywords.sql

# Seed database with initial data
cd backend
node seed-data.js

# Fix common issues
node fix-issues.js
```

### 2. Restart Everything

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

### 3. Test the Setup

```bash
# Test backend health
curl http://localhost:4000/health

# Test blood groups API
curl http://localhost:4000/api/public-data/blood-groups

# Visit frontend
open http://localhost:3000
```

## 🔍 Debugging Steps

### 1. Check Backend Logs

Look at your backend terminal for error messages:

- Database connection errors
- API endpoint errors
- CORS issues

### 2. Check Browser Console

Open Developer Tools (F12) and look for:

- Network errors (red entries in Network tab)
- JavaScript errors (Console tab)
- Failed API calls

### 3. Check Supabase Dashboard

- Go to Supabase Dashboard → Logs
- Look for authentication errors
- Check if tables have data

### 4. Verify Environment Variables

```bash
# Backend
cd backend
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Frontend
cd frontend
echo $REACT_APP_API_URL
echo $REACT_APP_SUPABASE_URL
```

## 📋 Pre-Registration Checklist

Before trying to register a user:

- [ ] Backend is running on port 4000
- [ ] Frontend is running on port 3000
- [ ] Database migration is applied
- [ ] Blood groups are seeded
- [ ] Environment variables are set
- [ ] No CORS errors in console
- [ ] API health check passes

## 🆘 Still Having Issues?

### 1. Check the Logs

```bash
# Backend logs
cd backend
npm start 2>&1 | tee backend.log

# Check the log file for errors
cat backend.log
```

### 2. Test Individual Components

**Test Database Connection:**

```bash
cd backend
node -e "
const { supabase } = require('./src/utils/supabase');
supabase.from('users').select('count').then(console.log);
"
```

**Test API Endpoints:**

```bash
# Test health
curl -v http://localhost:4000/health

# Test blood groups
curl -v http://localhost:4000/api/public-data/blood-groups

# Test with CORS
curl -v -H "Origin: http://localhost:3000" http://localhost:4000/api/public-data/blood-groups
```

### 3. Reset Everything

If all else fails:

```bash
# 1. Stop all servers
# Ctrl+C in both terminals

# 2. Clear node modules
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install

# 3. Reset environment
rm backend/.env frontend/.env
./setup-env.sh

# 4. Restart
cd backend && npm start
cd frontend && npm start
```

## 📞 Getting Help

If you're still stuck:

1. **Check the error messages carefully** - they usually tell you exactly what's wrong
2. **Look at the browser Network tab** - see which API calls are failing
3. **Check Supabase logs** - database errors show up there
4. **Try the fix script**: `node fix-issues.js`

Most issues are related to:

- Missing environment variables
- Database not seeded with initial data
- CORS configuration
- Duplicate data constraints

The fix script should resolve most of these automatically! 🚀
