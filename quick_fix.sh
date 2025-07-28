#!/bin/bash

echo "🔧 Quick Fix for Blood Warriors Database"
echo "========================================"

# First check what's wrong
echo "🔍 Checking current status..."
./check_status.sh

echo ""
echo "🔧 Attempting quick fix..."

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and run this script again."
    exit 1
fi

# Stop Supabase
echo "1. Stopping Supabase..."
supabase stop

# Wait a moment
echo "2. Waiting for cleanup..."
sleep 3

# Start fresh
echo "3. Starting Supabase..."
if supabase start; then
    echo "✅ Supabase started"
else
    echo "❌ Failed to start Supabase"
    echo "Try running: ./reset_everything.sh"
    exit 1
fi

# Wait for it to be ready
echo "4. Waiting for services to be ready..."
sleep 10

# Test connection first
echo "5. Testing connection..."
if timeout 10 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection works"
else
    echo "❌ Database connection failed, waiting longer..."
    sleep 10
    if timeout 10 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database connection works now"
    else
        echo "❌ Database still not accessible"
        echo "Try running: ./reset_everything.sh"
        exit 1
    fi
fi

# Apply migrations
echo "6. Applying migrations..."
if supabase db reset; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Migration failed"
    echo "Try running: ./fix_database.sh"
    exit 1
fi

# Test the setup
echo "7. Testing database setup..."
if ./test_database.sh; then
    echo ""
    echo "🎉 Database is now working!"
    echo ""
    echo "🚀 You can now start the application:"
    echo "   ./run.sh"
    echo ""
    echo "   Or manually:"
    echo "   Terminal 1: cd backend && npm run dev  (port 4000)"
    echo "   Terminal 2: cd frontend && npm start   (port 3100)"
else
    echo ""
    echo "❌ Database still has issues."
    echo "Try running: ./reset_everything.sh"
fi