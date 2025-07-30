#!/bin/bash

echo "🩸 Starting Blood Warriors Application..."

# Kill any existing processes
echo "Stopping existing servers..."
pkill -f "node src/index.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

# Wait a moment for processes to stop
sleep 2

# Start backend server
echo "Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✅ Backend server started successfully on port 4000"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "Starting frontend server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if curl -s -I http://localhost:3100 > /dev/null; then
    echo "✅ Frontend server started successfully on port 3100"
else
    echo "❌ Frontend server failed to start"
    exit 1
fi

echo ""
echo "🎉 Blood Warriors Application is now running!"
echo "📱 Frontend: http://localhost:3100"
echo "🔧 Backend API: http://localhost:4000"
echo ""
echo "To stop the servers, run: pkill -f 'node src/index.js' && pkill -f 'react-scripts start'"
echo ""

# Keep script running to show logs
wait