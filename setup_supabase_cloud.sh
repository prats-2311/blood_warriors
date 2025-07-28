#!/bin/bash

echo "🌐 Blood Warriors - Supabase Cloud Setup"
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

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

echo "This script will configure Blood Warriors to use Supabase Cloud instead of local development."
echo ""

# Check if user has the required information
echo "📋 Before we start, make sure you have:"
echo "   1. Created a Supabase project at https://supabase.com"
echo "   2. Your Project URL (from Settings > API)"
echo "   3. Your Anon Key (from Settings > API)"
echo "   4. Your Service Role Key (from Settings > API)"
echo ""

read -p "Do you have all the required information? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please create a Supabase project first:"
    echo "1. Go to https://supabase.com"
    echo "2. Sign up/Login"
    echo "3. Create a new project"
    echo "4. Wait for it to be ready"
    echo "5. Go to Settings > API to get your keys"
    echo ""
    echo "Then run this script again."
    exit 0
fi

echo ""
echo "🔑 Please enter your Supabase Cloud details:"
echo "============================================"

# Get Project URL
echo ""
read -p "Enter your Supabase Project URL (e.g., https://abcdefgh.supabase.co): " SUPABASE_URL
if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    print_error "Invalid URL format. Should be like: https://abcdefgh.supabase.co"
    exit 1
fi

# Get Anon Key
echo ""
read -p "Enter your Anon Key (starts with 'eyJ'): " SUPABASE_ANON_KEY
if [[ ! $SUPABASE_ANON_KEY =~ ^eyJ ]]; then
    print_error "Invalid Anon Key format. Should start with 'eyJ'"
    exit 1
fi

# Get Service Role Key
echo ""
read -p "Enter your Service Role Key (starts with 'eyJ'): " SUPABASE_SERVICE_ROLE_KEY
if [[ ! $SUPABASE_SERVICE_ROLE_KEY =~ ^eyJ ]]; then
    print_error "Invalid Service Role Key format. Should start with 'eyJ'"
    exit 1
fi

echo ""
print_info "Configuring environment files..."

# Update backend .env
cat > backend/.env << EOF
# Supabase Configuration (Cloud)
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=blood-warriors-jwt-secret-$(date +%s)
JWT_EXPIRES_IN=7d

# Partner API Configuration
PARTNER_API_KEY=blood-warriors-partner-key-2024

# Frontend Configuration (for CORS)
FRONTEND_URL=http://localhost:3100

# Optional: Firebase Configuration (for Push Notifications)
# FIREBASE_PROJECT_ID=your-firebase-project-id
# FIREBASE_CLIENT_EMAIL=your-firebase-client-email
# FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Optional: Qloo API Configuration (for Personalized Coupons)
# QLOO_API_KEY=your-qloo-api-key
# QLOO_API_URL=https://api.qloo.com/v1

# Optional: LLM Configuration (for Enhanced CareBot)
# LLM_API_URL=https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium
# LLM_API_KEY=your-huggingface-api-key
EOF

print_status "Backend .env configured"

# Update frontend .env
cat > frontend/.env << EOF
# Supabase Configuration (Cloud)
REACT_APP_SUPABASE_URL=$SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# API Configuration
REACT_APP_API_URL=http://localhost:4000/api

# Optional: Mapbox Configuration (for Enhanced Maps)
# REACT_APP_MAPBOX_TOKEN=your-mapbox-token

# Optional: Firebase Configuration (for Push Notifications)
# REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
# REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# REACT_APP_FIREBASE_PROJECT_ID=your-project-id
# REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
# REACT_APP_FIREBASE_APP_ID=your-app-id
EOF

print_status "Frontend .env configured"

# Update Supabase client configurations
print_info "Updating Supabase client configurations..."

# Update backend Supabase client
cat > backend/src/utils/supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for cloud connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'blood-warriors-backend'
    }
  }
});

// Test connection on startup
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('BloodGroups')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase Cloud connection test successful');
    }
  } catch (err) {
    console.error('Supabase connection error:', err.message);
  }
};

// Test connection after a short delay
setTimeout(testConnection, 2000);

module.exports = { supabase };
EOF

print_status "Backend Supabase client updated"

# Update frontend Supabase client
cat > frontend/src/utils/supabase.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'blood-warriors-frontend'
    }
  }
});
EOF

print_status "Frontend Supabase client updated"

echo ""
print_info "Testing connection to Supabase Cloud..."

# Test connection using Node.js
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('$SUPABASE_URL', '$SUPABASE_ANON_KEY');

supabase.from('information_schema.tables').select('table_name').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Connection failed:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Connection successful!');
      process.exit(0);
    }
  })
  .catch(err => {
    console.log('❌ Connection error:', err.message);
    process.exit(1);
  });
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_status "Supabase Cloud connection successful!"
else
    print_error "Connection test failed. Please check your credentials."
    exit 1
fi

echo ""
print_info "Applying database schema to Supabase Cloud..."

# Create a combined migration file for cloud deployment
cat > apply_schema_to_cloud.sql << 'EOF'
-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom ENUM types
CREATE TYPE user_type AS ENUM ('Patient', 'Donor', 'Admin');
CREATE TYPE blood_bank_category AS ENUM ('Govt', 'Private', 'Charitable/Vol');
CREATE TYPE request_urgency AS ENUM ('SOS', 'Urgent', 'Scheduled');
CREATE TYPE request_status AS ENUM ('Open', 'In Progress', 'Fulfilled', 'Cancelled');
CREATE TYPE notification_status AS ENUM ('Sent', 'Read', 'Accepted', 'Declined');
CREATE TYPE coupon_status AS ENUM ('Issued', 'Redeemed', 'Expired');

-- ========= USER & PROFILE TABLES =========

-- Create a custom users table that extends Supabase auth.users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    user_type user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BloodGroups table first (referenced by Patients and Donors)
CREATE TABLE BloodGroups (
    blood_group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(3) NOT NULL UNIQUE -- e.g., 'A+', 'O-', 'AB+'
);

CREATE TABLE Patients (
    patient_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    date_of_birth DATE NOT NULL
);

CREATE TABLE Donors (
    donor_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    last_donation_date DATE,
    is_available_for_sos BOOLEAN DEFAULT true,
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    qloo_taste_keywords JSONB, -- Using JSONB for better performance
    -- Add a geography column for PostGIS spatial queries
    location GEOGRAPHY(POINT)
);

-- ========= BLOOD DATA & INVENTORY TABLES =========

CREATE TABLE BloodComponents (
    component_id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE -- e.g., 'Whole Blood', 'Packed Red Blood Cells'
);

CREATE TABLE BloodBanks (
    bank_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    category blood_bank_category NOT NULL,
    phone VARCHAR(100),
    email VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    -- Add a geography column for PostGIS spatial queries
    location GEOGRAPHY(POINT)
);

CREATE TABLE BloodStock (
    stock_id SERIAL PRIMARY KEY,
    bank_id INTEGER NOT NULL REFERENCES BloodBanks(bank_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    component_id INTEGER NOT NULL REFERENCES BloodComponents(component_id),
    units_available INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bank_id, blood_group_id, component_id)
);

-- ========= ACTIVITY & TRANSACTION TABLES =========

CREATE TABLE DonationRequests (
    request_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patients(patient_id),
    blood_group_id INTEGER NOT NULL REFERENCES BloodGroups(blood_group_id),
    component_id INTEGER NOT NULL REFERENCES BloodComponents(component_id),
    units_required INTEGER NOT NULL,
    urgency request_urgency NOT NULL,
    status request_status NOT NULL DEFAULT 'Open',
    request_datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add location for the request (usually hospital or blood bank)
    latitude DECIMAL(9,6),
    longitude DECIMAL(10,6),
    location GEOGRAPHY(POINT)
);

CREATE TABLE Donations (
    donation_id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    bank_id INTEGER REFERENCES BloodBanks(bank_id),
    request_id INTEGER REFERENCES DonationRequests(request_id),
    donation_date DATE NOT NULL,
    units_donated INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    request_id INTEGER NOT NULL REFERENCES DonationRequests(request_id),
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'Sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add FCM token for push notifications
    fcm_token VARCHAR(255)
);

-- ========= PERKS PROGRAM TABLES =========

CREATE TABLE Coupons (
    coupon_id SERIAL PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    coupon_title VARCHAR(255) NOT NULL,
    target_keywords JSONB NOT NULL, -- Using JSONB for better performance
    quantity_total INTEGER,
    quantity_redeemed INTEGER DEFAULT 0,
    expiry_date DATE
);

CREATE TABLE DonorCoupons (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES Donors(donor_id),
    coupon_id INTEGER NOT NULL REFERENCES Coupons(coupon_id),
    status coupon_status NOT NULL DEFAULT 'Issued',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unique_redemption_code VARCHAR(20) NOT NULL UNIQUE
);

-- ========= AI & LOGGING TABLES =========

CREATE TABLE ChatHistory (
    chat_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert blood groups
INSERT INTO BloodGroups (group_name) VALUES 
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');

-- Insert blood components
INSERT INTO BloodComponents (component_name) VALUES 
('Whole Blood'), ('Packed Red Blood Cells'), ('Platelets'), ('Plasma'), ('Cryoprecipitate');
EOF

print_info "Schema file created. Applying to Supabase Cloud..."

# Apply schema using psql (if available) or show instructions
if command -v psql >/dev/null 2>&1; then
    # Extract database URL from Supabase URL
    DB_URL="${SUPABASE_URL/https:\/\//postgresql://postgres:}"
    
    print_info "Applying schema using psql..."
    if psql "${DB_URL}@db.${SUPABASE_URL#https://}.supabase.co:5432/postgres" -f apply_schema_to_cloud.sql >/dev/null 2>&1; then
        print_status "Schema applied successfully!"
    else
        print_warning "Could not apply schema automatically."
        echo ""
        echo "Please apply the schema manually:"
        echo "1. Go to your Supabase dashboard"
        echo "2. Go to SQL Editor"
        echo "3. Copy and paste the contents of 'apply_schema_to_cloud.sql'"
        echo "4. Run the query"
    fi
else
    print_warning "psql not available. Please apply schema manually:"
    echo ""
    echo "1. Go to your Supabase dashboard"
    echo "2. Go to SQL Editor"
    echo "3. Copy and paste the contents of 'apply_schema_to_cloud.sql'"
    echo "4. Run the query"
fi

# Clean up
rm -f apply_schema_to_cloud.sql

echo ""
print_status "Supabase Cloud setup completed!"
echo ""
echo "🌐 Your application is now configured to use Supabase Cloud:"
echo "   • Project URL: $SUPABASE_URL"
echo "   • Dashboard: $SUPABASE_URL (click to open)"
echo ""
echo "🚀 Next steps:"
echo "   1. If schema wasn't applied automatically, apply it manually in Supabase dashboard"
echo "   2. Start the application: ./run.sh"
echo "   3. Test registration and login"
echo ""
echo "🔧 Configuration files updated:"
echo "   • backend/.env"
echo "   • frontend/.env"
echo "   • backend/src/utils/supabase.js"
echo "   • frontend/src/utils/supabase.js"
EOF

chmod +x setup_supabase_cloud.sh