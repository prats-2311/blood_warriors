#!/bin/bash

echo "🔧 PostgreSQL Issues Fix - Blood Warriors"
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

echo "🔍 Analyzing the PostgreSQL issues from your logs..."
echo ""
echo "Issues identified:"
echo "  - Logical replication slot errors"
echo "  - Index creation problems"
echo "  - Database initialization hanging"
echo ""

print_info "Step 1: Stopping Supabase..."
supabase stop

print_info "Step 2: Removing problematic Docker volumes..."
# Remove only the database volume to fix corruption
docker volume rm supabase_db_blood_warriors 2>/dev/null || true

print_info "Step 3: Starting Supabase with clean database..."
supabase start

print_info "Step 4: Waiting for database to initialize properly..."
# Wait longer for proper initialization
sleep 90

print_info "Step 5: Testing basic connection..."
if timeout 20 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "Basic connection works"
else
    print_error "Basic connection failed"
    
    print_info "Checking database container logs..."
    DB_CONTAINER=$(docker ps --filter "name=supabase_db_blood_warriors" --format "{{.Names}}" | head -1)
    if [ ! -z "$DB_CONTAINER" ]; then
        echo "Last 20 lines of database logs:"
        docker logs --tail 20 "$DB_CONTAINER"
    fi
    
    exit 1
fi

print_info "Step 6: Applying schema without problematic features..."

# Create a simplified schema first
print_info "Creating basic tables..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres << 'EOF'
-- Create basic tables without complex features first
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('Patient', 'Donor', 'Admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE blood_bank_category AS ENUM ('Govt', 'Private', 'Charitable/Vol');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_urgency AS ENUM ('SOS', 'Urgent', 'Scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('Open', 'In Progress', 'Fulfilled', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('Sent', 'Read', 'Accepted', 'Declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_status AS ENUM ('Issued', 'Redeemed', 'Expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create basic tables
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    auth_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    user_type user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS BloodGroups (
    blood_group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(3) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS BloodComponents (
    component_id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE
);

-- Insert basic data
INSERT INTO BloodGroups (group_name) VALUES 
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-')
ON CONFLICT (group_name) DO NOTHING;

INSERT INTO BloodComponents (component_name) VALUES 
('Whole Blood'), ('Packed Red Blood Cells'), ('Platelets'), ('Plasma'), ('Cryoprecipitate')
ON CONFLICT (component_name) DO NOTHING;

EOF

if [ $? -eq 0 ]; then
    print_status "Basic schema created successfully"
else
    print_error "Basic schema creation failed"
    exit 1
fi

print_info "Step 7: Testing basic functionality..."
if psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM \"BloodGroups\";" >/dev/null 2>&1; then
    print_status "Basic tables are working"
    
    BLOOD_GROUPS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM \"BloodGroups\";" | tr -d ' ')
    echo "Blood groups count: $BLOOD_GROUPS"
else
    print_error "Basic tables are not working"
    exit 1
fi

print_info "Step 8: Testing Supabase API..."
if timeout 10 curl -s http://127.0.0.1:54321/health >/dev/null 2>&1; then
    print_status "Supabase API is responding"
else
    print_error "Supabase API is not responding"
    
    # Check API container
    API_CONTAINER=$(docker ps --filter "name=supabase_kong_blood_warriors" --format "{{.Names}}" | head -1)
    if [ ! -z "$API_CONTAINER" ]; then
        echo "API container logs:"
        docker logs --tail 10 "$API_CONTAINER"
    fi
fi

echo ""
print_status "PostgreSQL issues fix completed!"
echo ""
echo "🧪 Test the connection:"
echo "   ./check_status.sh"
echo ""
echo "🚀 If this works, you can now:"
echo "   1. Apply the full schema: supabase db reset --linked=false"
echo "   2. Start the application: ./run.sh"