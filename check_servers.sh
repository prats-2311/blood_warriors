#!/bin/bash

echo "🔍 Checking Blood Warriors Servers"
echo "=================================="

# Check backend
echo "Backend (Port 4000):"
if curl -s http://localhost:4000/api/health >/dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running"
fi

# Check frontend
echo "Frontend (Port 3100):"
if curl -s http://localhost:3100 >/dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running"
fi

echo ""
echo "🌐 Application URLs:"
echo "   • Frontend: http://localhost:3100"
echo "   • Backend:  http://localhost:4000"