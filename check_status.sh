#!/bin/bash

echo "🔍 Blood Warriors - System Status Check"
echo "======================================="

# Check Docker
echo "1. Docker Status:"
if docker --version >/dev/null 2>&1; then
    echo "   ✅ Docker installed: $(docker --version)"
    if docker ps >/dev/null 2>&1; then
        echo "   ✅ Docker is running"
    else
        echo "   ❌ Docker is not running - START DOCKER DESKTOP FIRST!"
        exit 1
    fi
else
    echo "   ❌ Docker not installed"
    exit 1
fi

echo ""
echo "2. Supabase Status:"
if command -v supabase >/dev/null 2>&1; then
    echo "   ✅ Supabase CLI installed: $(supabase --version)"
    
    echo ""
    echo "   Supabase Services:"
    supabase status
    
    echo ""
    echo "3. Port Check:"
    if lsof -i :54321 >/dev/null 2>&1; then
        echo "   ✅ Port 54321 (Supabase API) is in use"
    else
        echo "   ❌ Port 54321 (Supabase API) is free - Supabase not running"
    fi
    
    if lsof -i :54322 >/dev/null 2>&1; then
        echo "   ✅ Port 54322 (Database) is in use"
    else
        echo "   ❌ Port 54322 (Database) is free - Database not running"
    fi
    
    if lsof -i :54323 >/dev/null 2>&1; then
        echo "   ✅ Port 54323 (Studio) is in use"
    else
        echo "   ❌ Port 54323 (Studio) is free - Studio not running"
    fi
    
    if lsof -i :4000 >/dev/null 2>&1; then
        echo "   ✅ Port 4000 (Backend API) is in use"
    else
        echo "   ⚠️  Port 4000 (Backend API) is free - Backend not started yet"
    fi
    
    if lsof -i :3100 >/dev/null 2>&1; then
        echo "   ✅ Port 3100 (Frontend) is in use"
    else
        echo "   ⚠️  Port 3100 (Frontend) is free - Frontend not started yet"
    fi
    
else
    echo "   ❌ Supabase CLI not installed"
    exit 1
fi

echo ""
echo "4. Database Connection Test:"
if timeout 5 psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "   ✅ Database connection successful"
else
    echo "   ❌ Database connection failed"
fi

echo ""
echo "5. API Test:"
if timeout 5 curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo "   ✅ Supabase API responding"
else
    echo "   ❌ Supabase API not responding"
fi

echo ""
echo "📋 Next Steps:"
echo "   If everything shows ✅: Run './run.sh' to start the app"
echo "   If Docker is not running: Start Docker Desktop"
echo "   If Supabase is not running: Run 'supabase start'"
echo "   If database connection fails: Run './fix_database.sh'"
echo "   If everything is broken: Run './reset_everything.sh'"
echo ""
echo "🌐 Application will be available at:"
echo "   • Frontend: http://localhost:3100"
echo "   • Backend API: http://localhost:4000/api"