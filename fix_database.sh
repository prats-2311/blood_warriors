#!/bin/bash

echo "🔧 Fixing Blood Warriors Database Issues..."
echo "=========================================="

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

# Check if Docker is running
print_info "Checking Docker..."
if ! docker ps >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi
print_status "Docker is running"

# Stop Supabase completely
print_info "Stopping Supabase..."
supabase stop

# Clean up any existing data
print_info "Cleaning up temporary files..."
rm -rf supabase/.branches
rm -rf supabase/.temp

# Clean up Docker containers if needed
print_info "Cleaning up Docker containers..."
docker container prune -f >/dev/null 2>&1

# Start Supabase fresh
print_info "Starting Supabase (this may take a few minutes)..."
if supabase start; then
    print_status "Supabase started successfully"
else
    print_error "Failed to start Supabase"
    print_info "Try running: docker system prune -f && supabase start"
    exit 1
fi

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 10

# Test connection before applying migrations
print_info "Testing database connection..."
if timeout 10 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
    print_info "Waiting a bit more for database to be ready..."
    sleep 10
    
    if timeout 10 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "Database connection successful after waiting"
    else
        print_error "Database still not accessible. Try restarting Docker."
        exit 1
    fi
fi

# Apply database reset (this applies all migrations)
print_info "Applying database migrations..."
if supabase db reset; then
    print_status "Database migrations applied successfully"
else
    print_error "Failed to apply database migrations"
    print_info "Trying alternative approach..."
    
    # Try applying migrations one by one
    print_info "Applying migrations individually..."
    supabase migration up --file 20240101000001_initial_schema.sql
    supabase migration up --file 20240101000002_functions_and_triggers.sql
    supabase migration up --file 20240101000003_rls_policies.sql
    supabase migration up --file 20240101000004_indexes_and_views.sql
    supabase migration up --file 20240101000005_seed_data.sql
fi

# Test the final setup
print_info "Testing final database setup..."
if timeout 5 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT COUNT(*) FROM \"BloodGroups\";" >/dev/null 2>&1; then
    print_status "Database is working correctly"
else
    print_error "Database test failed"
fi

# Show status
echo ""
print_info "Final status check..."
supabase status

echo ""
print_status "Database fix completed!"
echo ""
echo "🌐 Access URLs:"
echo "   • Supabase Studio: http://localhost:54323"
echo "   • Database: postgresql://postgres:postgres@localhost:54322/postgres"
echo "   • Supabase API: http://localhost:54321"
echo "   • Backend API: http://localhost:4000/api"
echo ""
echo "🧪 Test the setup:"
echo "   ./test_database.sh"
echo ""
echo "🚀 Start the application:"
echo "   ./run.sh"