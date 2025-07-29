#!/bin/bash

echo "🩸 Starting Blood Warriors Application"
echo "====================================="

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

# Kill any existing processes on our ports
print_info "Cleaning up existing processes..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:3100 | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Start backend
print_info "Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_info "Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if curl -s http://localhost:4000/health >/dev/null 2>&1; then
    print_status "Backend is running on port 4000"
else
    print_error "Backend failed to start. Check backend.log for details"
    cat backend.log
    exit 1
fi

# Start frontend
print_info "Starting frontend server..."
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
print_info "Waiting for frontend to initialize..."
sleep 10

# Check if frontend is running
if curl -s http://localhost:3100 >/dev/null 2>&1; then
    print_status "Frontend is running on port 3100"
else
    print_error "Frontend failed to start. Check frontend.log for details"
fi

print_status "Blood Warriors Application Started!"
echo ""
echo "🌐 Application URLs:"
echo "   • Frontend: http://localhost:3100"
echo "   • Backend:  http://localhost:4000"
echo ""
echo "📋 Process IDs:"
echo "   • Backend PID: $BACKEND_PID"
echo "   • Frontend PID: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   • Backend: backend.log"
echo "   • Frontend: frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait