#!/bin/bash

echo "🧪 Testing Blood Warriors Connection"
echo "==================================="

# Test Supabase connection
echo "Testing Supabase connection..."
node -e "
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
const supabase = createClient(
  'https://plipeudrpvekcvcljmon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaXBldWRycHZla2N2Y2xqbW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTIxNzIsImV4cCI6MjA2OTI2ODE3Mn0.AypKIrqiXlIuswNTKUVCNRXOgf57dnJTlDM4aNhGmkU'
);

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