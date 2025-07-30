#!/bin/bash

echo "🩸 Starting Blood Warriors Application..."

# Start backend
echo "Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo "✅ Application started!"
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:3100"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID