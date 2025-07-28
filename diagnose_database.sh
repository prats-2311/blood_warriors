#!/bin/bash

echo "🔍 Blood Warriors Database Diagnostic Tool"
echo "=========================================="

# Function to print colored output
print_status() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

print_info() {
    echo -e "\033[1;34mℹ️  $1\033[0m"
}

# 1. Check Docker containers
echo "1. 🐳 Docker Container Analysis:"
echo "================================"

if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep supabase; then
    print_status "Supabase containers are running"
else
    print_error "No Supabase containers found"
fi

echo ""
echo "Container details:"
docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# 2. Check container logs for errors
echo ""
echo "2. 📋 Container Logs Analysis:"
echo "=============================="

# Check database container logs
DB_CONTAINER=$(docker ps --filter "name=supabase_db_blood_warriors" --format "{{.Names}}" | head -1)
if [ ! -z "$DB_CONTAINER" ]; then
    echo "Database container logs (last 10 lines):"
    docker logs --tail 10 "$DB_CONTAINER" 2>&1 | head -20
else
    print_error "Database container not found"
fi

echo ""

# Check API container logs
API_CONTAINER=$(docker ps --filter "name=supabase_kong_blood_warriors" --format "{{.Names}}" | head -1)
if [ ! -z "$API_CONTAINER" ]; then
    echo "API container logs (last 10 lines):"
    docker logs --tail 10 "$API_CONTAINER" 2>&1 | head -20
else
    print_error "API container not found"
fi

# 3. Test database connection with different methods
echo ""
echo "3. 🔌 Database Connection Tests:"
echo "==============================="

# Test 1: Direct PostgreSQL connection
echo "Test 1: Direct PostgreSQL connection"
if timeout 10 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT version();" 2>/dev/null; then
    print_status "Direct PostgreSQL connection works"
else
    print_error "Direct PostgreSQL connection failed"
    echo "Trying alternative connection methods..."
    
    # Try with localhost
    if timeout 10 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" 2>/dev/null; then
        print_status "Connection works with localhost"
    else
        print_error "Connection failed with localhost too"
    fi
fi

# Test 2: Supabase API connection
echo ""
echo "Test 2: Supabase API connection"
if timeout 10 curl -s http://127.0.0.1:54321/health 2>/dev/null | grep -q "ok\|healthy"; then
    print_status "Supabase API is responding"
else
    print_error "Supabase API is not responding"
    
    # Check what's actually running on port 54321
    echo "Checking what's on port 54321:"
    curl -s -v http://127.0.0.1:54321/ 2>&1 | head -10
fi

# Test 3: Check if database is ready
echo ""
echo "Test 3: Database readiness check"
if timeout 10 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM information_schema.tables;" 2>/dev/null; then
    print_status "Database is ready and has tables"
else
    print_error "Database is not ready or has no tables"
fi

# 4. Check Supabase configuration
echo ""
echo "4. ⚙️  Supabase Configuration:"
echo "============================="

if [ -f "supabase/config.toml" ]; then
    echo "Project ID: $(grep 'project_id' supabase/config.toml | cut -d'"' -f2)"
    echo "Database port: $(grep -A 5 '\[db\]' supabase/config.toml | grep 'port' | cut -d'=' -f2 | tr -d ' ')"
    echo "API port: $(grep -A 5 '\[api\]' supabase/config.toml | grep 'port' | cut -d'=' -f2 | tr -d ' ')"
else
    print_error "supabase/config.toml not found"
fi

# 5. Check for common issues
echo ""
echo "5. 🔧 Common Issues Check:"
echo "========================="

# Check if migrations exist
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations)" ]; then
    print_status "Migration files found: $(ls supabase/migrations | wc -l) files"
    echo "Migration files:"
    ls -la supabase/migrations/
else
    print_warning "No migration files found"
fi

# Check Docker resources
echo ""
echo "Docker resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep supabase

# 6. Suggested fixes
echo ""
echo "6. 💡 Suggested Fixes:"
echo "====================="

echo "Based on the analysis above, try these fixes in order:"
echo ""
echo "🔧 Fix 1: Restart Supabase services"
echo "   supabase stop && sleep 5 && supabase start"
echo ""
echo "🔧 Fix 2: Reset database with fresh start"
echo "   supabase stop && docker system prune -f && supabase start"
echo ""
echo "🔧 Fix 3: Check Docker resources"
echo "   - Ensure Docker has enough memory (4GB+ recommended)"
echo "   - Restart Docker Desktop if needed"
echo ""
echo "🔧 Fix 4: Manual database reset"
echo "   supabase db reset --linked=false"
echo ""
echo "🔧 Fix 5: Complete reset (nuclear option)"
echo "   ./reset_everything.sh"

# 7. Generate fix script based on findings
echo ""
echo "7. 🚀 Auto-Generated Fix Script:"
echo "==============================="

cat > auto_fix_database.sh << 'EOF'
#!/bin/bash
echo "🔧 Auto-fixing database issues..."

# Stop Supabase
echo "1. Stopping Supabase..."
supabase stop

# Wait for cleanup
echo "2. Waiting for cleanup..."
sleep 10

# Clean Docker if needed
echo "3. Cleaning Docker containers..."
docker container prune -f

# Start Supabase
echo "4. Starting Supabase..."
if supabase start; then
    echo "✅ Supabase started"
else
    echo "❌ Supabase start failed, trying with Docker cleanup..."
    docker system prune -f
    supabase start
fi

# Wait for services to be ready
echo "5. Waiting for services to be ready..."
sleep 15

# Test connection
echo "6. Testing connection..."
if timeout 10 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection works"
    
    # Apply migrations
    echo "7. Applying migrations..."
    supabase db reset --linked=false
    
    echo "🎉 Database fix completed!"
    echo "Run './check_status.sh' to verify"
else
    echo "❌ Database connection still failing"
    echo "Try running './reset_everything.sh'"
fi
EOF

chmod +x auto_fix_database.sh
echo "Created auto_fix_database.sh - run it to attempt automatic fix"

echo ""
echo "🏁 Diagnostic Complete!"
echo "======================"
echo "Review the output above and run the suggested fixes."