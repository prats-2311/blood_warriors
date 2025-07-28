#!/bin/bash

echo "🧪 Testing Supabase Cloud Connection"
echo "===================================="

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

# Check if environment files exist
if [ ! -f "backend/.env" ] || [ ! -f "frontend/.env" ]; then
    print_error "Environment files not found. Please run ./setup_supabase_cloud.sh first"
    exit 1
fi

# Load environment variables
source backend/.env

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    print_error "Supabase environment variables not found. Please run ./setup_supabase_cloud.sh first"
    exit 1
fi

print_info "Testing connection to: $SUPABASE_URL"

# Test 1: Basic connection
echo ""
echo "Test 1: Basic API connection"
if curl -s -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" >/dev/null 2>&1; then
    print_status "Supabase API is reachable"
else
    print_error "Cannot reach Supabase API"
    exit 1
fi

# Test 2: Database connection using Node.js
echo ""
echo "Test 2: Database connection"
node -e "
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
const supabase = createClient('$SUPABASE_URL', '$SUPABASE_ANON_KEY');

async function test() {
  try {
    const { data, error } = await supabase.from('bloodgroups').select('count');
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection successful');
      process.exit(0);
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    process.exit(1);
  }
}

test();
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_status "Database connection works"
else
    print_error "Database connection failed"
    echo ""
    echo "This might mean:"
    echo "1. The database schema hasn't been applied yet"
    echo "2. The credentials are incorrect"
    echo "3. The Supabase project isn't ready"
fi

# Test 3: Check if tables exist
echo ""
echo "Test 3: Checking if tables exist"
node -e "
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
const supabase = createClient('$SUPABASE_URL', '$SUPABASE_ANON_KEY');

async function checkTables() {
  try {
    const { data: bloodGroups, error: bgError } = await supabase.from('bloodgroups').select('count');
    const { data: users, error: userError } = await supabase.from('users').select('count');
    
    if (!bgError && !userError) {
      console.log('✅ Core tables exist');
      process.exit(0);
    } else {
      console.log('❌ Tables missing or inaccessible');
      if (bgError) console.log('bloodgroups error:', bgError.message);
      if (userError) console.log('users error:', userError.message);
      process.exit(1);
    }
  } catch (err) {
    console.log('❌ Table check error:', err.message);
    process.exit(1);
  }
}

checkTables();
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_status "Database tables are accessible"
else
    print_error "Database tables are missing or inaccessible"
    echo ""
    echo "Please apply the database schema:"
    echo "1. Go to your Supabase dashboard: $SUPABASE_URL"
    echo "2. Go to SQL Editor"
    echo "3. Run the schema from the setup script"
fi

# Test 4: Check authentication
echo ""
echo "Test 4: Authentication test"
node -e "
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
const supabase = createClient('$SUPABASE_URL', '$SUPABASE_ANON_KEY');

async function testAuth() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Auth error:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Authentication system is working');
      process.exit(0);
    }
  } catch (err) {
    console.log('❌ Auth test error:', err.message);
    process.exit(1);
  }
}

testAuth();
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_status "Authentication system works"
else
    print_error "Authentication system has issues"
fi

echo ""
echo "🏁 Test Summary:"
echo "================"
echo "If all tests passed, you can now:"
echo "1. Start the backend: cd backend && npm run dev"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Access the app at: http://localhost:3100"
echo ""
echo "If tests failed, check:"
echo "1. Your Supabase project is active: $SUPABASE_URL"
echo "2. The database schema has been applied"
echo "3. Your API keys are correct"