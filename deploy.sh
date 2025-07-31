#!/bin/bash

# 🚀 Blood Warriors AI Deployment Script
# This script helps prepare your app for deployment

echo "🚀 Blood Warriors AI Deployment Preparation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required files exist
echo ""
print_info "Checking deployment files..."

# Backend files
if [ -f "backend/package.json" ]; then
    print_status "Backend package.json found"
else
    print_error "Backend package.json not found"
    exit 1
fi

# Frontend files
if [ -f "frontend/package.json" ]; then
    print_status "Frontend package.json found"
else
    print_error "Frontend package.json not found"
    exit 1
fi

# Environment files
if [ -f "backend/.env.production" ]; then
    print_status "Backend production env template found"
else
    print_warning "Backend production env template not found"
fi

if [ -f "frontend/.env.production" ]; then
    print_status "Frontend production env template found"
else
    print_warning "Frontend production env template not found"
fi

# Check for migration file
if [ -f "supabase/migrations/20240101000016_add_patient_taste_keywords.sql" ]; then
    print_status "Database migration file found"
else
    print_error "Database migration file not found"
    exit 1
fi

echo ""
print_info "Preparing deployment files..."

# Create deployment directory
mkdir -p deployment-files

# Copy important files to deployment directory
cp backend/.env.production deployment-files/backend-env-template.txt
cp frontend/.env.production deployment-files/frontend-env-template.txt
cp backend/render.yaml deployment-files/
cp frontend/netlify.toml deployment-files/
cp supabase/migrations/20240101000016_add_patient_taste_keywords.sql deployment-files/migration.sql

print_status "Deployment files prepared in 'deployment-files' directory"

echo ""
print_info "Next Steps:"
echo "1. 🗄️  Set up Supabase project and apply migration"
echo "2. 🖥️  Deploy backend to Render"
echo "3. 🌐 Deploy frontend to Netlify"
echo "4. 🔧 Configure environment variables"
echo ""
print_info "See DEPLOYMENT_GUIDE.md for detailed instructions"

echo ""
print_status "Deployment preparation complete! 🎉"