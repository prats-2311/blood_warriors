#!/bin/bash

echo "🧪 Testing User Registration"
echo "============================"

# Generate a unique email for testing
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"

echo "Testing registration with email: $TEST_EMAIL"

# Test registration
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\",
    \"phone_number\": \"123456789$TIMESTAMP\",
    \"full_name\": \"Test User $TIMESTAMP\",
    \"city\": \"Test City\",
    \"state\": \"Test State\",
    \"user_type\": \"Patient\",
    \"blood_group_id\": 1,
    \"date_of_birth\": \"1990-01-01\"
  }" | jq '.' 2>/dev/null || echo "Registration API call failed"