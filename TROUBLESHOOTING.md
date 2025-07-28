# 🔧 Troubleshooting Guide - Blood Warriors AI Platform

## 🗄️ Database Migration Issues

### Problem: Foreign Key Constraint Error

```
ERROR: insert or update on table "users" violates foreign key constraint "users_auth_id_fkey"
```

**Solution:**

```bash
# Stop and restart Supabase
supabase stop
supabase start

# Use the fix script
./fix_database.sh

# Or manually apply migrations one by one
supabase migration up --file 20240101000001_initial_schema.sql
supabase migration up --file 20240101000002_functions_and_triggers.sql
supabase migration up --file 20240101000003_rls_policies.sql
supabase migration up --file 20240101000004_indexes_and_views.sql
supabase migration up --file 20240101000005_seed_data.sql
```

### Problem: Migration Already Exists

```
NOTICE (42P06): schema "supabase_migrations" already exists, skipping
```

**Solution:**

```bash
# Reset the database completely
supabase db reset

# Or check migration status
supabase migration list
```

### Problem: PostGIS Extension Error

```
ERROR: extension "postgis" is not available
```

**Solution:**

```bash
# Restart Supabase (PostGIS should be included)
supabase stop
supabase start

# Check if PostGIS is working
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT PostGIS_Version();"
```

## 🚀 Application Startup Issues

### Problem: Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**

```bash
# Find and kill process using port 4000
lsof -ti:4000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Problem: Supabase Not Running

```
Error: connect ECONNREFUSED 127.0.0.1:54321
```

**Solution:**

```bash
# Check Supabase status
supabase status

# Start Supabase if not running
supabase start

# If that fails, try stopping first
supabase stop
supabase start
```

### Problem: Environment Variables Not Found

```
Error: SUPABASE_URL is not defined
```

**Solution:**

```bash
# Check if .env files exist
ls -la backend/.env frontend/.env

# Copy from examples if missing
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Verify environment variables
cd backend && node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

## 🔐 Authentication Issues

### Problem: JWT Token Invalid

```
Error: Invalid or expired token
```

**Solution:**

```bash
# Check if JWT_SECRET is set
grep JWT_SECRET backend/.env

# Verify Supabase keys match
supabase status
# Compare with your .env files
```

### Problem: User Registration Fails

```
Error: User not found after registration
```

**Solution:**

1. Check if the user was created in Supabase Auth
2. Verify the Users table has the corresponding record
3. Check RLS policies are not too restrictive

```sql
-- Check in Supabase Studio or psql
SELECT * FROM auth.users;
SELECT * FROM "Users";
```

## 🌐 API Connection Issues

### Problem: CORS Errors

```
Access to fetch at 'http://localhost:4000/api' from origin 'http://localhost:3100' has been blocked by CORS policy
```

**Solution:**

```bash
# Check backend CORS configuration
# Verify REACT_APP_API_URL in frontend/.env
grep REACT_APP_API_URL frontend/.env

# Should match your backend URL
```

### Problem: API Routes Not Found

```
Error: Cannot GET /api/health
```

**Solution:**

```bash
# Check if backend is running
curl http://localhost:4000/health

# Check backend logs for errors
# Verify routes are properly imported in backend/src/index.js
```

## 🗄️ Database Connection Issues

### Problem: Cannot Connect to Database

```
Error: getaddrinfo ENOTFOUND localhost
```

**Solution:**

```bash
# Check if Supabase is running
supabase status

# Test direct database connection
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;"

# Check if ports are available
lsof -i :54321
lsof -i :54322
lsof -i :54323
```

### Problem: RLS Policy Errors

```
Error: new row violates row-level security policy
```

**Solution:**

```sql
-- Temporarily disable RLS for testing
ALTER TABLE "Users" DISABLE ROW LEVEL SECURITY;

-- Or check if user has proper permissions
SELECT auth.uid(), auth.role();

-- Re-enable after fixing
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
```

## 🔧 Development Tools

### Useful Commands

```bash
# Check all services status
supabase status

# View database logs
supabase logs db

# Connect to database directly
psql postgresql://postgres:postgres@localhost:54322/postgres

# Reset everything
supabase stop
rm -rf supabase/.branches supabase/.temp
supabase start
supabase db reset

# Test database setup
./test_database.sh

# Check environment variables
printenv | grep SUPABASE
printenv | grep REACT_APP
```

### Database Queries for Debugging

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check blood groups
SELECT * FROM "BloodGroups";

-- Check users (as admin)
SELECT user_id, email, user_type FROM "Users";

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';

-- Check PostGIS
SELECT PostGIS_Version();
```

## 🆘 Emergency Reset

If everything is broken and you want to start fresh:

```bash
#!/bin/bash
echo "🚨 Emergency Reset - This will delete all data!"
read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Stop everything
    supabase stop

    # Clean up
    rm -rf supabase/.branches
    rm -rf supabase/.temp
    rm -rf node_modules

    # Reinstall
    npm install
    cd backend && npm install
    cd ../frontend && npm install
    cd ..

    # Restart Supabase
    supabase start
    supabase db reset

    echo "✅ Emergency reset complete!"
fi
```

## 📞 Getting Help

### Before Asking for Help

1. **Check the logs**: Look at terminal output for error messages
2. **Verify services**: Run `supabase status` and check all services are running
3. **Test database**: Run `./test_database.sh`
4. **Check environment**: Verify all `.env` files are properly configured
5. **Try reset**: Use `./fix_database.sh` or emergency reset

### Information to Include

When reporting issues, include:

- Operating system and version
- Node.js version (`node --version`)
- Supabase CLI version (`supabase --version`)
- Complete error message
- Steps to reproduce
- Output of `supabase status`

### Common Solutions Summary

| Problem              | Quick Fix                           |
| -------------------- | ----------------------------------- |
| Migration fails      | `./fix_database.sh`                 |
| Port in use          | `lsof -ti:4000 \| xargs kill -9`    |
| Supabase not running | `supabase start`                    |
| Missing .env         | `cp .env.example .env`              |
| CORS errors          | Check `REACT_APP_API_URL`           |
| Auth issues          | Verify JWT_SECRET and Supabase keys |
| Database connection  | `supabase status` and check ports   |

---

**Still having issues?** Check the main documentation files:

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup instructions
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Environment configuration
- [README.md](README.md) - Main project documentation
