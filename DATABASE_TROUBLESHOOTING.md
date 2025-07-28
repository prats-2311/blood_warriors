# 🗄️ Database Troubleshooting Guide - Blood Warriors

## 🔍 Common Database Issues & Solutions

### Issue 1: Database Connection Failed

**Symptoms:**

- `Database connection failed` in status check
- `ECONNREFUSED` errors
- Timeouts when connecting to PostgreSQL

**Solutions:**

#### Quick Fix:

```bash
./fix_db_connection.sh
```

#### Manual Fix:

```bash
# 1. Stop and restart Supabase
supabase stop
sleep 10
supabase start

# 2. Wait for database to be ready (up to 2 minutes)
sleep 120

# 3. Test connection
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;"
```

### Issue 2: Supabase API Not Responding

**Symptoms:**

- `Supabase API not responding`
- HTTP connection timeouts to port 54321

**Solutions:**

```bash
# Check if Kong (API Gateway) container is running
docker ps | grep kong

# Check Kong logs
docker logs $(docker ps --filter "name=supabase_kong" --format "{{.Names}}" | head -1)

# Restart if needed
supabase stop && supabase start
```

### Issue 3: Migration Failures

**Symptoms:**

- `Failed to apply database migrations`
- SQL syntax errors during migration

**Solutions:**

```bash
# Apply migrations individually
for migration in supabase/migrations/*.sql; do
    echo "Applying $(basename "$migration")..."
    supabase migration up --file "$(basename "$migration")"
done

# Or reset database completely
supabase db reset --linked=false
```

### Issue 4: Docker Resource Issues

**Symptoms:**

- Containers keep restarting
- Out of memory errors
- Slow database responses

**Solutions:**

```bash
# Check Docker resource usage
docker stats --no-stream | grep supabase

# Increase Docker memory (Docker Desktop > Settings > Resources)
# Recommended: 4GB+ RAM, 2+ CPU cores

# Clean up Docker if needed
docker system prune -f
```

## 🛠️ Diagnostic Tools

### 1. Comprehensive Diagnosis

```bash
./diagnose_database.sh
```

### 2. Connection Fix

```bash
./fix_db_connection.sh
```

### 3. Status Check

```bash
./check_status.sh
```

### 4. Complete Reset (Nuclear Option)

```bash
./reset_everything.sh
```

## 🔧 Manual Database Commands

### Connection Testing

```bash
# Test PostgreSQL connection
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT version();"

# Test Supabase API
curl -s http://127.0.0.1:54321/health

# Test with timeout
timeout 10 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;"
```

### Container Management

```bash
# List Supabase containers
docker ps --filter "name=supabase"

# Check container logs
docker logs supabase_db_blood_warriors
docker logs supabase_kong_blood_warriors

# Restart specific container
docker restart supabase_db_blood_warriors
```

### Database Queries

```bash
# Connect to database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Check tables
\dt

# Check if our tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# Check blood groups data
SELECT * FROM "BloodGroups";
```

## 🚨 Emergency Procedures

### Complete Database Reset

```bash
#!/bin/bash
echo "🚨 EMERGENCY DATABASE RESET"

# Stop everything
supabase stop
docker stop $(docker ps -q --filter "name=supabase")
docker rm $(docker ps -aq --filter "name=supabase")

# Clean Docker
docker system prune -f
docker volume prune -f

# Remove Supabase data
rm -rf supabase/.branches
rm -rf supabase/.temp

# Start fresh
supabase start
sleep 60
supabase db reset --linked=false
```

### Backup and Restore

```bash
# Backup database
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres > backup.sql

# Restore database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup.sql
```

## 🔍 Common Error Messages

### "FATAL: password authentication failed"

- Check if you're using the correct credentials
- Default: `postgres:postgres`
- Verify with: `supabase status`

### "could not connect to server: Connection refused"

- Database container not running
- Wrong port (should be 54322)
- Docker not running

### "relation does not exist"

- Migrations not applied
- Run: `supabase db reset --linked=false`

### "permission denied for schema public"

- RLS policies too restrictive
- Check policies in migration files

## 📊 Performance Monitoring

### Check Database Performance

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long running queries
SELECT query, state, query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Database size
SELECT pg_size_pretty(pg_database_size('postgres'));
```

### Monitor Container Resources

```bash
# Real-time stats
docker stats

# Container resource limits
docker inspect supabase_db_blood_warriors | grep -A 10 "Memory"
```

## 🔄 Maintenance Tasks

### Daily Checks

```bash
# Check if services are running
./check_status.sh

# Check logs for errors
docker logs --tail 50 supabase_db_blood_warriors | grep ERROR
```

### Weekly Maintenance

```bash
# Clean up Docker
docker system prune -f

# Update Supabase CLI
npm update -g supabase

# Check for migration updates
supabase migration list
```

## 📞 Getting Help

### Before Asking for Help

1. Run `./diagnose_database.sh` and save the output
2. Check Docker Desktop is running and has enough resources
3. Try `./fix_db_connection.sh`
4. Check container logs: `docker logs supabase_db_blood_warriors`

### Information to Include

- Output of `./diagnose_database.sh`
- Output of `supabase status`
- Output of `docker ps | grep supabase`
- Any error messages from logs
- Your operating system and Docker version

---

**Most database issues can be resolved with `./fix_db_connection.sh`** 🔧
