#!/bin/bash

# 🧪 Test Database Connection Template
# Copy this to test_connection.sh and add your real credentials

echo "🧪 Testing Blood Warriors Connection"
echo "==================================="

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    echo "Please create it with your Supabase credentials"
    exit 1
fi

# Load environment variables
source backend/.env

# Test Supabase connection using environment variables
echo "Testing Supabase connection..."
node -e "
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');

// Use environment variables instead of hardcoded values
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  console.log('❌ Please set real Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Testing bloodgroups table...');
    const { data, error } = await supabase.from('bloodgroups').select('*').limit(3);
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Found', data.length, 'blood groups');
      console.log('Data:', data);
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

test();
"

echo ""
echo "✅ Connection test complete!"