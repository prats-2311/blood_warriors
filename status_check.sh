#!/bin/bash

echo "🩸 Blood Warriors Application Status"
echo "==================================="

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

# Check Backend
echo "Backend Status:"
if curl -s http://localhost:4000/health >/dev/null 2>&1; then
    print_status "Backend is running on port 4000"
    echo "   Health check: $(curl -s http://localhost:4000/health | jq -r '.message')"
else
    print_error "Backend is not running on port 4000"
fi

echo ""

# Check Frontend
echo "Frontend Status:"
if curl -s http://localhost:3100 >/dev/null 2>&1; then
    print_status "Frontend is running on port 3100"
else
    print_error "Frontend is not running on port 3100"
fi

echo ""

# Check Supabase Connection
echo "Supabase Connection:"
node -e "
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
const supabase = createClient(
  'https://plipeudrpvekcvcljmon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaXBldWRycHZla2N2Y2xqbW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTIxNzIsImV4cCI6MjA2OTI2ODE3Mn0.AypKIrqiXlIuswNTKUVCNRXOgf57dnJTlDM4aNhGmkU'
);

async function test() {
  try {
    const { data, error } = await supabase.from('bloodgroups').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (err) {
    console.log('❌ Supabase connection error:', err.message);
  }
}

test();
" 2>/dev/null

echo ""

# Check Database Tables
echo "Database Tables:"
node -e "
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
const supabase = createClient(
  'https://plipeudrpvekcvcljmon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaXBldWRycHZla2N2Y2xqbW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTIxNzIsImV4cCI6MjA2OTI2ODE3Mn0.AypKIrqiXlIuswNTKUVCNRXOgf57dnJTlDM4aNhGmkU'
);

async function checkTables() {
  const tables = ['users', 'bloodgroups', 'bloodcomponents', 'bloodbanks'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log('❌', table, 'table:', error.message);
      } else {
        console.log('✅', table, 'table: accessible');
      }
    } catch (err) {
      console.log('❌', table, 'table:', err.message);
    }
  }
}

checkTables();
" 2>/dev/null

echo ""
echo "🌐 Application URLs:"
echo "   • Frontend: http://localhost:3100"
echo "   • Backend:  http://localhost:4000"
echo "   • Supabase: https://plipeudrpvekcvcljmon.supabase.co"
echo ""
echo "📋 Next Steps:"
echo "   1. Open http://localhost:3100 in your browser"
echo "   2. Click 'Register' to create a new account"
echo "   3. Fill out the registration form"
echo "   4. Start using Blood Warriors!"