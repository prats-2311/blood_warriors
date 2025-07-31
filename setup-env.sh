#!/bin/bash

# 🔧 Environment Variables Setup Script
# This script helps you set up your environment variables

echo "🔧 Blood Warriors AI - Environment Setup"
echo "======================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
print_info "This script will help you set up your environment variables."
echo ""

# Check if .env files exist
if [ -f "backend/.env" ]; then
    print_warning "backend/.env already exists. Backing up to .env.backup"
    cp backend/.env backend/.env.backup
fi

if [ -f "frontend/.env" ]; then
    print_warning "frontend/.env already exists. Backing up to .env.backup"
    cp frontend/.env frontend/.env.backup
fi

echo ""
print_info "Please provide your Supabase credentials:"
echo "You can find these in your Supabase Dashboard > Settings > API"
echo ""

# Get Supabase credentials
read -p "Enter your Supabase URL (https://your-project-id.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_KEY

echo ""
print_info "Optional: AI Enhancement APIs (press Enter to skip)"
read -p "Enter your Qloo API Key (optional): " QLOO_API_KEY
read -p "Enter your Hugging Face API Key (optional): " LLM_API_KEY

echo ""
print_info "Creating environment files..."

# Create backend .env
cat > backend/.env << EOF
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-key-change-this
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# AI Enhancement APIs (Optional)
QLOO_API_KEY=$QLOO_API_KEY
QLOO_API_URL=https://api.qloo.com/v1
LLM_API_URL=https://api-inference.huggingface.co/models
LLM_API_KEY=$LLM_API_KEY

# Partner API Configuration
PARTNER_API_KEY=blood-warriors-partner-key-2024
EOF

# Create frontend .env
cat > frontend/.env << EOF
# Backend API URL (Local development)
REACT_APP_API_URL=http://localhost:4000/api

# Supabase Configuration (Public keys only)
REACT_APP_SUPABASE_URL=$SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# App Configuration
REACT_APP_APP_NAME=Blood Warriors (Dev)
REACT_APP_VERSION=1.0.0-dev
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_AI_CHAT=true
REACT_APP_ENABLE_PERSONALIZATION=true
REACT_APP_ENABLE_REWARDS=true

# Development Tools
REACT_APP_DEBUG=true
GENERATE_SOURCEMAP=true
EOF

print_success "Environment files created successfully!"

echo ""
print_info "Files created:"
echo "  - backend/.env"
echo "  - frontend/.env"

echo ""
print_info "Next steps:"
echo "1. Apply the database migration in Supabase console"
echo "2. Test your setup: cd backend && npm start"
echo "3. In another terminal: cd frontend && npm start"
echo "4. Visit http://localhost:3000 to test your app"

echo ""
print_success "Environment setup complete! 🎉"