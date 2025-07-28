#!/bin/bash

echo "🔍 Debugging Blood Warriors Database Issues..."
echo "=============================================="

# Check if Supabase CLI is working
echo "1. Checking Supabase CLI..."
if command -v supabase >/dev/null 2>&1; then
    echo "✅ Supabase CLI found: $(supabase --version)"
else
    echo "❌ Supabase CLI not found"
    exit 1
fi

# Check Supabase status
echo ""
echo "2. Checking Supabase status..."
supabase status

# Check if Docker is running (Supabase uses Docker)
echo ""
echo "3. Checking Docker..."
if command -v docker >/dev/null 2>&1; then
    if docker ps >/dev/null 2>&1; then
        echo "✅ Docker is running"
        echo "Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep supabase
    else
        echo "❌ Docker is not running or accessible"
        echo "Please start Docker and try again"
        exit 1
    fi
else
    echo "❌ Docker not found"
    exit 1
fi

# Check if ports are available
echo ""
echo "4. Checking ports..."
PORTS=(54321 54322 54323)
for port in "${PORTS[@]}"; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "✅ Port $port is in use (good)"
    else
        echo "❌ Port $port is not in use (may be a problem)"
    fi
done

# Try to connect to database directly
echo ""
echo "5. Testing direct database connection..."
if timeout 5 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Direct database connection works"
else
    echo "❌ Direct database connection failed"
fi

# Check if API is accessible
echo ""
echo "6. Testing Supabase API..."
if timeout 5 curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo "✅ Supabase API is responding"
else
    echo "❌ Supabase API is not responding"
fi

echo ""
echo "🔧 Suggested fixes:"
echo "1. If Docker is not running: Start Docker Desktop"
echo "2. If ports are not in use: Run 'supabase start'"
echo "3. If database connection fails: Run 'supabase stop && supabase start'"
echo "4. If all else fails: Run the complete reset below"

echo ""
echo "💥 Complete reset command:"
echo "supabase stop && docker system prune -f && supabase start"