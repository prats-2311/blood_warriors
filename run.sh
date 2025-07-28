#!/bin/bash

# Blood Warriors AI Platform - Development Runner
echo "🩸 Blood Warriors AI Platform - Development Mode"
echo "================================================"

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

# Check if setup has been run
if [ ! -f "backend/.env" ] || [ ! -f "frontend/.env" ]; then
    print_error "Environment files not found. Please run setup first:"
    echo "   ./setup.sh"
    exit 1
fi

# Check if Supabase is running
if ! curl -s http://localhost:54321/health >/dev/null 2>&1; then
    print_info "Starting Supabase local development..."
    supabase start
    if [ $? -ne 0 ]; then
        print_error "Failed to start Supabase"
        exit 1
    fi
fi

print_status "Supabase is running"

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend server
print_info "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
print_info "Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

print_status "Development servers started!"
echo ""
echo "🌐 Application URLs:"
echo "   • Frontend:        http://localhost:3100"
echo "   • Backend API:     http://localhost:4000/api"
echo "   • Supabase Studio: http://localhost:54323"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for processes to finish
wait $BACKEND_PID $FRONTEND_PID