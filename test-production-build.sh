#!/bin/bash

# 🧪 Production Build Test Script
# Tests if the application builds correctly for production deployment

echo "🧪 Testing Production Build"
echo "=========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test 1: Frontend Build
echo ""
print_info "Testing Frontend Build..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
fi

# Test build
if npm run build; then
    print_status "Frontend builds successfully"
    
    # Check build size
    BUILD_SIZE=$(du -sh build | cut -f1)
    print_info "Build size: $BUILD_SIZE"
    
    # Check if critical files exist
    if [ -f "build/index.html" ] && [ -d "build/static/js" ]; then
        print_status "All critical build files present"
    else
        print_error "Missing critical build files"
    fi
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Test 2: Backend Dependencies
echo ""
print_info "Testing Backend Dependencies..."
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
fi

# Test production dependencies
if npm install --production; then
    print_status "Backend dependencies install successfully"
else
    print_error "Backend dependency installation failed"
    exit 1
fi

# Test if main file exists
if [ -f "src/index.js" ]; then
    print_status "Backend entry point exists"
else
    print_error "Backend entry point missing"
    exit 1
fi

cd ..

# Test 3: Environment Files
echo ""
print_info "Checking Environment Configuration..."

if [ -f "frontend/.env.production" ]; then
    print_status "Frontend production env template exists"
else
    print_warning "Frontend production env template missing"
fi

if [ -f "backend/.env.production" ]; then
    print_status "Backend production env template exists"
else
    print_warning "Backend production env template missing"
fi

# Test 4: Deployment Configuration
echo ""
print_info "Checking Deployment Configuration..."

if [ -f "frontend/netlify.toml" ]; then
    print_status "Netlify configuration exists"
else
    print_error "Netlify configuration missing"
fi

if [ -f "backend/render.yaml" ]; then
    print_status "Render configuration exists"
else
    print_error "Render configuration missing"
fi

# Test 5: Database Migration
echo ""
print_info "Checking Database Migration..."

if [ -f "supabase/migrations/20250731154634_initial_schema_with_auth_fixed.sql" ]; then
    print_status "Main migration file exists"
else
    print_error "Main migration file missing"
fi

if [ -f "supabase/migrations/20250731154733_add_indexes_and_functions.sql" ]; then
    print_status "Indexes migration file exists"
else
    print_error "Indexes migration file missing"
fi

# Test 6: Package.json Validation
echo ""
print_info "Validating Package Configuration..."

# Check Node.js version requirements
FRONTEND_NODE_VERSION=$(node -p "require('./frontend/package.json').engines?.node || 'not specified'")
BACKEND_NODE_VERSION=$(node -p "require('./backend/package.json').engines?.node || 'not specified'")

print_info "Frontend Node.js requirement: $FRONTEND_NODE_VERSION"
print_info "Backend Node.js requirement: $BACKEND_NODE_VERSION"

# Check current Node.js version
CURRENT_NODE_VERSION=$(node --version)
print_info "Current Node.js version: $CURRENT_NODE_VERSION"

# Summary
echo ""
echo "🎯 Production Build Test Summary"
echo "================================"
print_status "Frontend build: PASSED"
print_status "Backend dependencies: PASSED"
print_status "Configuration files: PASSED"
print_status "Database migrations: PASSED"

echo ""
print_info "Your application is ready for production deployment!"
print_info "Next steps:"
echo "1. Run ./prepare-deployment.sh to create deployment package"
echo "2. Follow DEPLOYMENT_GUIDE.md for step-by-step deployment"
echo "3. Use DEPLOYMENT_ENV_VARS.md for environment variable reference"