#!/bin/bash

echo "💥 COMPLETE RESET - Blood Warriors Database"
echo "==========================================="
echo "⚠️  This will completely reset your database and remove all data!"
echo ""

read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping all services..."
supabase stop

echo "🧹 Cleaning up Docker..."
docker container prune -f
docker volume prune -f
docker network prune -f

echo "🗑️  Removing Supabase data..."
rm -rf supabase/.branches
rm -rf supabase/.temp

echo "⏳ Waiting for cleanup to complete..."
sleep 5

echo "🚀 Starting fresh Supabase instance..."
if supabase start; then
    echo "✅ Supabase started successfully"
else
    echo "❌ Failed to start Supabase"
    echo ""
    echo "🔧 Try these steps manually:"
    echo "1. Make sure Docker Desktop is running"
    echo "2. Run: docker system prune -a -f"
    echo "3. Run: supabase start"
    exit 1
fi

echo "⏳ Waiting for services to be fully ready..."
sleep 15

echo "📊 Applying database schema..."
if supabase db reset; then
    echo "✅ Database reset successful"
else
    echo "❌ Database reset failed"
    echo "Check the error messages above"
    exit 1
fi

echo ""
echo "🧪 Testing the setup..."
if ./test_database.sh; then
    echo ""
    echo "🎉 Complete reset successful!"
    echo ""
    echo "🚀 You can now start the application:"
    echo "   ./run.sh"
else
    echo ""
    echo "❌ Setup test failed. Check TROUBLESHOOTING.md"
fi