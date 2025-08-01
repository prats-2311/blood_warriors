#!/bin/bash

# 🔒 Security Audit Script
# Checks for sensitive data that shouldn't be committed to Git

echo "🔒 Security Audit - Checking for Sensitive Data"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

ISSUES_FOUND=0

echo ""
print_info "1. Checking for environment files in Git tracking..."

# Check for .env files being tracked
TRACKED_ENV_FILES=$(git ls-files | grep -E "\.env$|\.env\." | grep -v -E "\.env\.example$|\.env\.production$")

if [ -n "$TRACKED_ENV_FILES" ]; then
    print_error "Found environment files being tracked by Git:"
    echo "$TRACKED_ENV_FILES" | while read file; do
        echo "  - $file"
    done
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    echo ""
    print_warning "These files may contain sensitive credentials!"
    print_info "Run: git rm --cached <filename> to remove from tracking"
else
    print_status "No sensitive environment files found in Git tracking"
fi

echo ""
print_info "2. Checking for real API keys in tracked files..."

# Check for potential real API keys in tracked files
SUSPICIOUS_PATTERNS=(
    "supabase\.co"
    "eyJhbGciOiJIUzI1NiIs"
    "sk-[a-zA-Z0-9]"
    "pk_[a-zA-Z0-9]"
    "AIza[a-zA-Z0-9]"
    "[a-zA-Z0-9]{32,}"
)

for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
    MATCHES=$(git ls-files -z | xargs -0 grep -l "$pattern" 2>/dev/null | grep -v -E "\.md$|security-audit\.sh$" || true)
    if [ -n "$MATCHES" ]; then
        print_warning "Found potential API keys/URLs matching pattern '$pattern':"
        echo "$MATCHES" | while read file; do
            if [ -f "$file" ]; then
                echo "  - $file"
                # Show the matching lines (but mask sensitive parts)
                grep -n "$pattern" "$file" | sed 's/[a-zA-Z0-9]\{10,\}/***MASKED***/g' | head -3
            fi
        done
        echo ""
    fi
done

echo ""
print_info "3. Checking .gitignore coverage..."

# Check if .gitignore has proper patterns
REQUIRED_PATTERNS=(
    "\.env$"
    "\.env\.local"
    "\.env\.development"
    "\.env\.test"
    "\.env\.backup"
    "\.zencoder"
)

for pattern in "${REQUIRED_PATTERNS[@]}"; do
    if ! grep -q "$pattern" .gitignore; then
        print_warning "Missing pattern in .gitignore: $pattern"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

if [ $ISSUES_FOUND -eq 0 ]; then
    print_status ".gitignore has proper coverage"
fi

echo ""
print_info "4. Checking for sensitive files in working directory..."

# Check for sensitive files that exist but aren't tracked
SENSITIVE_FILES=$(find . -name "*.env" -not -path "./.git/*" -not -name "*.env.example" -not -name "*.env.production")

if [ -n "$SENSITIVE_FILES" ]; then
    print_info "Found local environment files (should not be committed):"
    echo "$SENSITIVE_FILES" | while read file; do
        if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            print_error "  - $file (TRACKED - REMOVE FROM GIT!)"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        else
            print_status "  - $file (not tracked - good)"
        fi
    done
else
    print_status "No local environment files found"
fi

echo ""
print_info "5. Checking for other sensitive patterns..."

# Check for other sensitive patterns
OTHER_PATTERNS=(
    "password.*=.*[^example]"
    "secret.*=.*[^your-]"
    "token.*=.*[^your-]"
    "key.*=.*[^your-]"
)

for pattern in "${OTHER_PATTERNS[@]}"; do
    MATCHES=$(git ls-files -z | xargs -0 grep -i -l "$pattern" 2>/dev/null | grep -v -E "\.md$|security-audit\.sh$|\.example$" || true)
    if [ -n "$MATCHES" ]; then
        print_warning "Found potential secrets matching pattern '$pattern':"
        echo "$MATCHES" | while read file; do
            echo "  - $file"
        done
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        echo ""
    fi
done

echo ""
echo "🔒 Security Audit Summary"
echo "========================"

if [ $ISSUES_FOUND -eq 0 ]; then
    print_status "No security issues found! ✨"
    print_info "Your repository is safe to push to GitHub"
else
    print_error "Found $ISSUES_FOUND potential security issues"
    print_warning "Please review and fix these issues before pushing to GitHub"
    echo ""
    print_info "Quick fixes:"
    echo "1. Remove sensitive files from Git: git rm --cached <filename>"
    echo "2. Update .gitignore to include sensitive patterns"
    echo "3. Use only template files (.env.example, .env.production) in Git"
    echo "4. Keep real credentials in local .env files only"
fi

echo ""
print_info "Safe files to commit:"
echo "✅ .env.example (template with placeholder values)"
echo "✅ .env.production (template with placeholder values)"
echo "❌ .env (contains real credentials)"
echo "❌ .env.development (contains real credentials)"
echo "❌ .env.test (contains real credentials)"
echo "❌ .env.backup (contains real credentials)"

exit $ISSUES_FOUND