#!/bin/bash

echo "💥 Nuclear Database Fix - Blood Warriors"
echo "========================================"
echo "⚠️  This will completely reset your database and Docker volumes!"
echo ""

read -p "Are you sure you want to continue? This will delete all data! (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Function to print colored output
print_status() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_info() {
    echo -e "\033[1;34mℹ️  $1\033[0m"
}

echo ""
echo "🛑 Step 1: Complete Supabase shutdown..."
supabase stop

# Wait for complete shutdown
sleep 10

echo ""
echo "🐳 Step 2: Aggressive Docker cleanup..."

# Stop all Supabase containers
print_info "Stopping all Supabase containers..."
docker stop $(docker ps -q --filter "name=supabase") 2>/dev/null || true

# Remove all Supabase containers
print_info "Removing all Supabase containers..."
docker rm $(docker ps -aq --filter "name=supabase") 2>/dev/null || true

# Remove Supabase volumes (this is the key!)
print_info "Removing Supabase volumes..."
docker volume rm $(docker volume ls -q --filter "name=supabase") 2>/dev/null || true

# Remove Supabase networks
print_info "Removing Supabase networks..."
docker network rm $(docker network ls -q --filter "name=supabase") 2>/dev/null || true

# Clean up Docker system
print_info "Cleaning Docker system..."
docker system prune -f --volumes

echo ""
echo "🗑️  Step 3: Cleaning Supabase local data..."
rm -rf supabase/.branches
rm -rf supabase/.temp
rm -rf supabase/logs

# Also clean any potential lock files
rm -f supabase/.lock 2>/dev/null || true

echo ""
echo "⏳ Step 4: Waiting for Docker to settle..."
sleep 15

echo ""
echo "🚀 Step 5: Starting fresh Supabase instance..."

# Start Supabase with verbose output
if supabase start --debug 2>&1; then
    print_status "Supabase started successfully"
else
    print_error "Supabase start failed"
    
    print_info "Checking Docker status..."
    docker ps
    
    print_info "Checking Docker logs..."
    docker logs $(docker ps --filter "name=supabase_db" --format "{{.Names}}" | head -1) 2>/dev/null || echo "No DB container found"
    
    exit 1
fi

echo ""
echo "⏳ Step 6: Extended wait for database initialization..."
print_info "Waiting 2 minutes for database to fully initialize..."

# Wait longer for database to be ready
sleep 120

echo ""
echo "🔌 Step 7: Testing database connection..."

# Test connection with multiple attempts
for i in {1..10}; do
    print_info "Connection attempt $i/10..."
    
    if timeout 15 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT version();" >/dev/null 2>&1; then
        print_status "Database connection successful!"
        break
    fi
    
    if [ $i -eq 10 ]; then
        print_error "Database connection failed after 10 attempts"
        
        # Show container status
        echo ""
        echo "Container status:"
        docker ps --filter "name=supabase"
        
        # Show database logs
        echo ""
        echo "Database container logs:"
        docker logs --tail 50 $(docker ps --filter "name=supabase_db" --format "{{.Names}}" | head -1) 2>/dev/null || echo "No DB container logs available"
        
        exit 1
    fi
    
    sleep 10
done

echo ""
echo "🌐 Step 8: Testing Supabase API..."

# Test API with multiple attempts
for i in {1..5}; do
    print_info "API test attempt $i/5..."
    
    if timeout 10 curl -s http://127.0.0.1:54321/health | grep -q "ok\|healthy"; then
        print_status "Supabase API is responding!"
        break
    fi
    
    if [ $i -eq 5 ]; then
        print_error "Supabase API failed after 5 attempts"
        
        # Show API logs
        echo ""
        echo "API container logs:"
        docker logs --tail 30 $(docker ps --filter "name=supabase_kong" --format "{{.Names}}" | head -1) 2>/dev/null || echo "No API container logs available"
    fi
    
    sleep 10
done

echo ""
echo "📊 Step 9: Applying database schema..."

# Apply migrations with error handling
if supabase db reset --linked=false; then
    print_status "Database schema applied successfully"
else
    print_error "Database schema application failed"
    
    print_info "Trying to apply migrations individually..."
    
    # Apply each migration file individually
    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")
            print_info "Applying $filename..."
            
            if supabase migration up --file "$filename"; then
                print_status "✅ Applied $filename"
            else
                print_error "❌ Failed to apply $filename"
                
                # Show the specific error
                echo "Migration content:"
                head -20 "$migration"
            fi
        fi
    done
fi

echo ""
echo "🧪 Step 10: Final verification..."

# Test database tables
if timeout 10 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM \"BloodGroups\";" >/dev/null 2>&1; then
    print_status "Database tables are working"
    
    # Show table count
    BLOOD_GROUPS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM \"BloodGroups\";" 2>/dev/null | tr -d ' ')
    echo "Blood groups in database: $BLOOD_GROUPS"
else
    print_error "Database tables are not accessible"
fi

# Show final status
echo ""
echo "📋 Final Status:"
supabase status

echo ""
echo "🎉 Nuclear database fix completed!"
echo ""
echo "🌐 Services should now be available at:"
echo "   • Frontend:        http://localhost:3100"
echo "   • Backend API:     http://localhost:4000/api"
echo "   • Supabase Studio: http://localhost:54323"
echo "   • Database:        postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""
echo "🚀 Next steps:"
echo "   1. Run './check_status.sh' to verify everything is working"
echo "   2. Run './run.sh' to start the application"
echo ""
echo "If this still doesn't work, the issue might be:"
echo "   - Docker Desktop needs more resources (4GB+ RAM)"
echo "   - macOS firewall blocking connections"
echo "   - Port conflicts with other applications"