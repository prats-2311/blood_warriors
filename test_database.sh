#!/bin/bash

echo "🧪 Testing Blood Warriors Database Setup..."

# Check if Supabase is running
if ! curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo "❌ Supabase is not running. Please start it first:"
    echo "   supabase start"
    exit 1
fi

echo "✅ Supabase is running"

# Test database connection
echo "🔍 Testing database connection..."
if psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check if tables exist
echo "📊 Checking database tables..."
TABLES=(
    "Users"
    "BloodGroups" 
    "BloodComponents"
    "Patients"
    "Donors"
    "BloodBanks"
    "BloodStock"
    "DonationRequests"
    "Donations"
    "Notifications"
    "Coupons"
    "DonorCoupons"
    "ChatHistory"
)

for table in "${TABLES[@]}"; do
    if psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT COUNT(*) FROM \"$table\";" >/dev/null 2>&1; then
        echo "✅ Table $table exists"
    else
        echo "❌ Table $table missing or has issues"
    fi
done

# Check if blood groups are populated
echo "🩸 Checking blood groups data..."
BLOOD_COUNT=$(psql postgresql://postgres:postgres@localhost:54322/postgres -t -c "SELECT COUNT(*) FROM \"BloodGroups\";")
if [ "$BLOOD_COUNT" -eq 8 ]; then
    echo "✅ Blood groups populated (8 groups)"
else
    echo "⚠️  Blood groups count: $BLOOD_COUNT (expected 8)"
fi

# Check if blood components are populated
echo "🧪 Checking blood components data..."
COMPONENT_COUNT=$(psql postgresql://postgres:postgres@localhost:54322/postgres -t -c "SELECT COUNT(*) FROM \"BloodComponents\";")
if [ "$COMPONENT_COUNT" -eq 5 ]; then
    echo "✅ Blood components populated (5 components)"
else
    echo "⚠️  Blood components count: $COMPONENT_COUNT (expected 5)"
fi

# Check if sample blood banks exist
echo "🏥 Checking blood banks data..."
BANK_COUNT=$(psql postgresql://postgres:postgres@localhost:54322/postgres -t -c "SELECT COUNT(*) FROM \"BloodBanks\";")
if [ "$BANK_COUNT" -gt 0 ]; then
    echo "✅ Blood banks populated ($BANK_COUNT banks)"
else
    echo "⚠️  No blood banks found"
fi

# Check PostGIS extension
echo "🗺️  Checking PostGIS extension..."
if psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT PostGIS_Version();" >/dev/null 2>&1; then
    echo "✅ PostGIS extension is working"
else
    echo "❌ PostGIS extension not working"
fi

# Test API health endpoint
echo "🌐 Testing API endpoints..."
if curl -s http://localhost:4000/health >/dev/null 2>&1; then
    echo "✅ Backend API is responding"
else
    echo "⚠️  Backend API not running (this is OK if you haven't started it yet)"
fi

echo ""
echo "🎉 Database test completed!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend: cd backend && npm run dev  (port 4000)"
echo "2. Start the frontend: cd frontend && npm start   (port 3100)"
echo "3. Access Supabase Studio: http://localhost:54323"