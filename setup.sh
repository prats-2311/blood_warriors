#!/bin/bash

# Blood Warriors AI Platform Setup Script
echo "🩸 Setting up Blood Warriors AI Platform..."
echo "================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

print_info() {
    echo -e "\033[1;34mℹ️  $1\033[0m"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js (v16+) first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js v16 or higher."
    exit 1
fi

print_status "Node.js $(node --version) found"

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm $(npm --version) found"

# Install Supabase CLI if not present
if ! command_exists supabase; then
    print_warning "Supabase CLI is not installed. Installing..."
    npm install -g supabase
    if [ $? -eq 0 ]; then
        print_status "Supabase CLI installed successfully"
    else
        print_error "Failed to install Supabase CLI"
        exit 1
    fi
else
    print_status "Supabase CLI found"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if npm install; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Setup Supabase
echo ""
echo "🗄️  Setting up Supabase local development..."
cd ..

# Initialize Supabase if not already done
if [ ! -f "supabase/config.toml" ]; then
    print_info "Initializing Supabase project..."
    supabase init
fi

# Start Supabase local development
echo ""
print_info "Starting Supabase local development (this may take a few minutes)..."
if supabase start; then
    print_status "Supabase started successfully"
else
    print_error "Failed to start Supabase"
    print_info "Try running: supabase stop && supabase start"
    exit 1
fi

# Apply database migrations
echo ""
print_info "Applying database migrations..."
if supabase db reset --linked=false; then
    print_status "Database migrations applied successfully"
else
    print_error "Failed to apply database migrations"
    print_info "Trying to fix database issues..."
    
    # Try to fix the database
    if [ -f "./fix_database.sh" ]; then
        print_info "Running database fix script..."
        ./fix_database.sh
    else
        print_info "You can try manually:"
        print_info "  1. supabase stop"
        print_info "  2. supabase start"
        print_info "  3. supabase migration up"
    fi
fi

# Setup environment files
echo ""
print_info "Setting up environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    print_status "Created backend/.env from example"
else
    print_warning "backend/.env already exists, skipping"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    print_status "Created frontend/.env from example"
else
    print_warning "frontend/.env already exists, skipping"
fi

# Get Supabase status
echo ""
print_info "Getting Supabase local development info..."
supabase status

echo ""
echo "🎉 Setup completed successfully!"
echo "================================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🚀 Start the development servers:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm start"
echo ""
echo "2. 🌐 Access the application:"
echo "   • Frontend:        http://localhost:3100"
echo "   • Backend API:     http://localhost:4000/api"
echo "   • Supabase Studio: http://localhost:54323"
echo ""
echo "3. 🔧 Optional integrations (update .env files):"
echo "   • Firebase (Push notifications)"
echo "   • Mapbox (Enhanced maps)"
echo "   • Hugging Face (Enhanced AI)"
echo ""
echo "4. 📚 Documentation:"
echo "   • Setup Guide:     SETUP_GUIDE.md"
echo "   • Deployment:      DEPLOYMENT.md"
echo "   • Main README:     README.md"
echo ""
echo "🩸 Happy coding with Blood Warriors!"
echo ""
print_info "If you encounter issues, check SETUP_GUIDE.md for troubleshooting"