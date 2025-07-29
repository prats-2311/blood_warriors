#!/bin/bash

echo "🧪 Testing Authentication Flow"
echo "============================="

# Test registration
echo "Testing registration..."
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "phone_number": "1234567890",
    "full_name": "Test User",
    "city": "Test City",
    "state": "Test State",
    "user_type": "Patient",
    "blood_group_id": 1,
    "date_of_birth": "1990-01-01"
  }' | jq '.' || echo "Registration failed"

echo -e "\n"

# Test login
echo "Testing login..."
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq '.' || echo "Login failed"