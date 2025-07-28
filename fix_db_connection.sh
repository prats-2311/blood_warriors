#!/bin/bash

echo "🔧 Blood Warriors Database Connection Fix"
echo "========================================"

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

# Function to test database connection
test_db_connection() {
    local host=$1
    local port=$2
    local timeout_duration=${3:-10}
    
    if timeout $timeout_duration psql postgresql://postgres:postgres@$host:$port/postgres -c "SELECT 1;" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for database to be ready
wait_for_database() {
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for database to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if test_db_connection "127.0.0.1" "54322" 5; then
            print_status "Database is ready!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts - waiting 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    print_error "Database failed to become ready after $max_attempts attempts"
    return 1
}

# Main fix process
echo "Step 1: Checking current status..."

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

print_status "Docker is running"

# Check current Supabase status
echo ""
echo "Step 2: Current Supabase status..."
supabase status

# Stop Supabase to ensure clean state
echo ""
echo "Step 3: Stopping Supabase for clean restart..."
supabase stop

# Clean up any hanging containers
echo ""
echo "Step 4: Cleaning up Docker containers..."
docker container prune -f >/dev/null 2>&1

# Wait a moment for cleanup
sleep 5

# Start Supabase
echo ""
echo "Step 5: Starting Supabase..."
if supabase start; then
    print_status "Supabase start command completed"
else
    print_error "Supabase start failed"
    
    print_info "Trying with Docker system cleanup..."
    docker system prune -f
    
    if supabase start; then
        print_status "Supabase started after Docker cleanup"
    else
        print_error "Supabase start failed even after cleanup"
        exit 1
    fi
fi

# Wait for database to be ready
echo ""
echo "Step 6: Waiting for database to be ready..."
if wait_for_database; then
    print_status "Database connection established"
else
    print_error "Database connection failed"
    
    print_info "Checking what might be wrong..."
    
    # Check if containers are actually running
    echo "Docker containers:"
    docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}"
    
    # Check logs
    echo ""
    echo "Database container logs:"
    DB_CONTAINER=$(docker ps --filter "name=supabase_db_blood_warriors" --format "{{.Names}}" | head -1)
    if [ ! -z "$DB_CONTAINER" ]; then
        docker logs --tail 20 "$DB_CONTAINER"
    fi
    
    exit 1
fi

# Test API connection
echo ""
echo "Step 7: Testing Supabase API..."
if timeout 10 curl -s http://127.0.0.1:54321/health >/dev/null 2>&1; then
    print_status "Supabase API is responding"
else
    print_error "Supabase API is not responding"
    
    # Try to restart just the API
    print_info "API might need more time to start..."
    sleep 10
    
    if timeout 10 curl -s http://127.0.0.1:54321/health >/dev/null 2>&1; then
        print_status "Supabase API is now responding"
    else
        print_error "Supabase API still not responding"
    fi
fi

# Apply database migrations
echo ""
echo "Step 8: Applying database migrations..."
if supabase db reset --linked=false; then
    print_status "Database migrations applied successfully"
else
    print_error "Database migration failed"
    
    print_info "Trying to apply migrations individually..."
    
    # Try applying migrations one by one
    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "Applying $(basename "$migration")..."
            if supabase migration up --file "$(basename "$migration")"; then
                print_status "Applied $(basename "$migration")"
            else
                print_error "Failed to apply $(basename "$migration")"
            fi
        fi
    done
fi

# Final verification
echo ""
echo "Step 9: Final verification..."

# Test database connection
if test_db_connection "127.0.0.1" "54322"; then
    print_status "Database connection: OK"
else
    print_error "Database connection: FAILED"
fi

# Test API
if timeout 5 curl -s http://127.0.0.1:54321/health >/dev/null 2>&1; then
    print_status "Supabase API: OK"
else
    print_error "Supabase API: FAILED"
fi

# Test if tables exist
if psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM \"BloodGroups\";" >/dev/null 2>&1; then
    print_status "Database tables: OK"
else
    print_error "Database tables: MISSING"
fi

echo ""
echo "🏁 Database connection fix completed!"
echo ""
echo "🌐 Services should be available at:"
echo "   • Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "   • Supabase API: http://127.0.0.1:54321"
echo "   • Supabase Studio: http://127.0.0.1:54323"
echo ""
echo "🧪 Run './check_status.sh' to verify everything is working"
echo "🚀 Run './run.sh' to start the application"