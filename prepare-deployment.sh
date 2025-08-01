#!/bin/bash

# 🚀 Blood Warriors - Deployment Preparation Script
# This script helps you prepare for deployment to Netlify + Render + Supabase

echo "🩸 Blood Warriors - Deployment Preparation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

echo ""
print_step "Step 1: Checking Prerequisites"

# Check if required files exist
if [ ! -f "frontend/package.json" ]; then
    print_error "Frontend package.json not found"
    exit 1
fi

if [ ! -f "backend/package.json" ]; then
    print_error "Backend package.json not found"
    exit 1
fi

if [ ! -f "supabase/migrations/20250731154634_initial_schema_with_auth_fixed.sql" ]; then
    print_error "Database migration file not found"
    exit 1
fi

print_status "All required files found"

echo ""
print_step "Step 2: Building Frontend"

cd frontend
if npm run build; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

echo ""
print_step "Step 3: Testing Backend Dependencies"

cd backend
if npm install --production; then
    print_status "Backend dependencies installed"
else
    print_error "Backend dependency installation failed"
    exit 1
fi
cd ..

echo ""
print_step "Step 4: Creating Deployment Package"

# Create deployment directory
mkdir -p deployment-ready

# Copy essential files
cp -r frontend/build deployment-ready/frontend-build
cp frontend/netlify.toml deployment-ready/
cp backend/render.yaml deployment-ready/
cp backend/.env.production deployment-ready/backend-env-template.txt
cp frontend/.env.production deployment-ready/frontend-env-template.txt
cp supabase/migrations/20250731154634_initial_schema_with_auth_fixed.sql deployment-ready/migration.sql
cp supabase/migrations/20250731154733_add_indexes_and_functions.sql deployment-ready/migration-indexes.sql

print_status "Deployment package created in 'deployment-ready' directory"

echo ""
print_info "🎯 Next Steps for Deployment:"
echo ""
echo "1. 🗄️  SUPABASE SETUP:"
echo "   - Create new project at https://supabase.com/dashboard"
echo "   - Go to SQL Editor and run migration.sql and migration-indexes.sql"
echo "   - Copy URL and keys from Settings > API"
echo ""
echo "2. 🖥️  RENDER BACKEND DEPLOYMENT:"
echo "   - Connect GitHub repo at https://dashboard.render.com"
echo "   - Use render.yaml for configuration"
echo "   - Set environment variables from backend-env-template.txt"
echo ""
echo "3. 🌐 NETLIFY FRONTEND DEPLOYMENT:"
echo "   - Connect GitHub repo at https://app.netlify.com"
echo "   - Base directory: frontend"
echo "   - Build command: npm run build"
echo "   - Publish directory: frontend/build"
echo "   - Set environment variables from frontend-env-template.txt"
echo ""
echo "4. 🔧 ENVIRONMENT VARIABLES:"
echo "   - Update all placeholder URLs with actual deployment URLs"
echo "   - Generate strong JWT secrets"
echo "   - Configure CORS origins"
echo ""

print_status "Deployment preparation complete! 🎉"
print_info "See DEPLOYMENT_GUIDE.md for detailed step-by-step instructions"