#!/bin/bash

echo "🐳 Docker Resources Check - Blood Warriors"
echo "========================================"

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

echo "1. 🖥️  System Information:"
echo "========================="
echo "OS: $(uname -s) $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Memory: $(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024 " GB"}')"
echo "CPU Cores: $(sysctl -n hw.ncpu)"

echo ""
echo "2. 🐳 Docker Information:"
echo "========================"
if docker --version >/dev/null 2>&1; then
    print_status "Docker installed: $(docker --version)"
    
    if docker info >/dev/null 2>&1; then
        print_status "Docker is running"
        
        echo ""
        echo "Docker system info:"
        docker system df
        
        echo ""
        echo "Docker resource usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        
    else
        print_error "Docker is not running"
        echo "Please start Docker Desktop"
        exit 1
    fi
else
    print_error "Docker is not installed"
    exit 1
fi

echo ""
echo "3. 🔌 Port Analysis:"
echo "==================="
PORTS=(3100 4000 54321 54322 54323)

for port in "${PORTS[@]}"; do
    if lsof -i :$port >/dev/null 2>&1; then
        PROCESS=$(lsof -i :$port | tail -n 1 | awk '{print $1}')
        print_status "Port $port: In use by $PROCESS"
    else
        print_warning "Port $port: Free"
    fi
done

echo ""
echo "4. 🐳 Supabase Containers Analysis:"
echo "==================================="

CONTAINERS=$(docker ps --filter "name=supabase" --format "{{.Names}}")

if [ -z "$CONTAINERS" ]; then
    print_error "No Supabase containers running"
else
    print_status "Supabase containers found:"
    
    for container in $CONTAINERS; do
        STATUS=$(docker inspect --format='{{.State.Status}}' "$container")
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
        
        if [ "$STATUS" = "running" ]; then
            if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no-health-check" ]; then
                print_status "$container: $STATUS ($HEALTH)"
            else
                print_warning "$container: $STATUS ($HEALTH)"
            fi
        else
            print_error "$container: $STATUS"
        fi
    done
fi

echo ""
echo "5. 🗄️  Database Container Deep Dive:"
echo "===================================="

DB_CONTAINER=$(docker ps --filter "name=supabase_db_blood_warriors" --format "{{.Names}}" | head -1)

if [ ! -z "$DB_CONTAINER" ]; then
    print_status "Database container found: $DB_CONTAINER"
    
    echo ""
    echo "Container details:"
    docker inspect "$DB_CONTAINER" --format='
    Image: {{.Config.Image}}
    Status: {{.State.Status}}
    Started: {{.State.StartedAt}}
    Memory Limit: {{.HostConfig.Memory}}
    CPU Limit: {{.HostConfig.CpuQuota}}
    Restart Count: {{.RestartCount}}'
    
    echo ""
    echo "Container resource usage:"
    docker stats --no-stream "$DB_CONTAINER" --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    echo "Recent container logs (last 30 lines):"
    docker logs --tail 30 "$DB_CONTAINER" 2>&1 | head -50
    
else
    print_error "No database container found"
fi

echo ""
echo "6. 🔍 Connection Test Analysis:"
echo "==============================="

# Test different connection methods
echo "Testing localhost connection:"
if timeout 5 nc -z localhost 54322; then
    print_status "Port 54322 is reachable via localhost"
else
    print_error "Port 54322 is NOT reachable via localhost"
fi

echo ""
echo "Testing 127.0.0.1 connection:"
if timeout 5 nc -z 127.0.0.1 54322; then
    print_status "Port 54322 is reachable via 127.0.0.1"
else
    print_error "Port 54322 is NOT reachable via 127.0.0.1"
fi

echo ""
echo "Testing PostgreSQL connection:"
if timeout 10 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "PostgreSQL connection works"
else
    print_error "PostgreSQL connection failed"
    
    echo ""
    echo "Detailed connection attempt:"
    timeout 10 psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;" 2>&1 || true
fi

echo ""
echo "7. 💡 Recommendations:"
echo "======================"

# Check Docker resources
DOCKER_MEM=$(docker system info --format '{{.MemTotal}}' 2>/dev/null)
if [ ! -z "$DOCKER_MEM" ] && [ "$DOCKER_MEM" -lt 4000000000 ]; then
    print_warning "Docker has less than 4GB RAM allocated"
    echo "   → Increase Docker memory in Docker Desktop > Settings > Resources"
fi

# Check for common macOS issues
if [ "$(uname -s)" = "Darwin" ]; then
    echo ""
    echo "macOS-specific checks:"
    
    # Check if firewall might be blocking
    if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled"; then
        print_warning "macOS Firewall is enabled"
        echo "   → May need to allow Docker in System Preferences > Security & Privacy > Firewall"
    fi
    
    # Check for Rosetta if on Apple Silicon
    if [ "$(uname -m)" = "arm64" ]; then
        print_info "Running on Apple Silicon (M1/M2)"
        echo "   → Ensure Docker is using the correct architecture"
    fi
fi

echo ""
echo "🔧 Suggested next steps:"
echo "1. If containers are unhealthy: ./nuclear_db_fix.sh"
echo "2. If PostgreSQL issues persist: ./fix_postgres_issues.sh"
echo "3. If Docker resources are low: Increase Docker memory/CPU"
echo "4. If ports are blocked: Check firewall settings"