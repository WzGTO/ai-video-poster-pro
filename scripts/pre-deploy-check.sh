#!/bin/bash

# ====================================
# Pre-Deployment Check Script
# AI Video Poster Pro - Thai Edition
# ====================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Start
echo ""
echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════════════════╗"
echo "  ║   🚀 Pre-Deployment Checks                        ║"
echo "  ║   AI Video Poster Pro - Thai Edition              ║"
echo "  ╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ====================================
# 1. Check Node Version
# ====================================
print_header "1. Checking Node.js Version"

NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
if [[ "$NODE_VERSION" == "not installed" ]]; then
    print_error "Node.js is not installed!"
    exit 1
fi

NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -ge 20 ]; then
    print_success "Node.js version: $NODE_VERSION (required: >= 20)"
else
    print_error "Node.js version $NODE_VERSION is too old. Required: >= 20"
    exit 1
fi

# ====================================
# 2. Check npm Version
# ====================================
print_header "2. Checking npm Version"

NPM_VERSION=$(npm -v 2>/dev/null || echo "not installed")
if [[ "$NPM_VERSION" == "not installed" ]]; then
    print_error "npm is not installed!"
    exit 1
fi
print_success "npm version: $NPM_VERSION"

# ====================================
# 3. Install Dependencies
# ====================================
print_header "3. Installing Dependencies"

if [ -f "package-lock.json" ]; then
    print_info "Using npm ci for clean install..."
    if npm ci --silent 2>/dev/null; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_info "No package-lock.json found, using npm install..."
    if npm install --silent 2>/dev/null; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# ====================================
# 4. Check Environment Variables
# ====================================
print_header "4. Checking Environment Variables"

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

OPTIONAL_VARS=(
    "TIKTOK_CLIENT_KEY"
    "TIKTOK_CLIENT_SECRET"
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
    "GEMINI_API_KEY"
    "CRON_SECRET"
)

# Check if .env.local exists
if [ -f ".env.local" ]; then
    print_success ".env.local file exists"
    source .env.local 2>/dev/null || true
else
    print_warning ".env.local file not found"
fi

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        print_success "$var is set"
    else
        print_error "$var is NOT set (required)"
    fi
done

# Check optional variables
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        print_success "$var is set"
    else
        print_warning "$var is not set (optional)"
    fi
done

# ====================================
# 5. Run Linter
# ====================================
print_header "5. Running ESLint"

if npm run lint 2>&1; then
    print_success "Linting passed - no errors"
else
    print_error "Linting failed!"
    exit 1
fi

# ====================================
# 6. Run Type Check
# ====================================
print_header "6. Running TypeScript Type Check"

if npm run type-check 2>&1; then
    print_success "Type check passed - no errors"
else
    print_error "Type check failed!"
    exit 1
fi

# ====================================
# 7. Run Tests
# ====================================
print_header "7. Running Tests"

if npm test 2>&1; then
    print_success "All tests passed"
else
    print_error "Tests failed!"
    exit 1
fi

# ====================================
# 8. Build Project
# ====================================
print_header "8. Building Project"

if npm run build 2>&1; then
    print_success "Build completed successfully"
else
    print_error "Build failed!"
    exit 1
fi

# ====================================
# 9. Check Bundle Size
# ====================================
print_header "9. Checking Bundle Size"

if [ -d ".next" ]; then
    # Get First Load JS size for main page
    if [ -f ".next/build-manifest.json" ]; then
        BUNDLE_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
        print_info "Total .next folder size: $BUNDLE_SIZE"
        
        # Check if there's a analyze script
        if grep -q '"analyze"' package.json 2>/dev/null; then
            print_info "Bundle analyzer available: npm run analyze"
        fi
        
        print_success "Bundle size check completed"
    else
        print_warning "Could not determine bundle size"
    fi
else
    print_error ".next folder not found - build may have failed"
fi

# ====================================
# 10. Check for Common Issues
# ====================================
print_header "10. Checking for Common Issues"

# Check for console.log in production code
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" app/ components/ lib/ 2>/dev/null | grep -v "// " | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    print_warning "Found $CONSOLE_LOGS console.log statements (consider removing for production)"
else
    print_success "No console.log statements found"
fi

# Check for TODO/FIXME comments
TODOS=$(grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" app/ components/ lib/ 2>/dev/null | wc -l || echo "0")
if [ "$TODOS" -gt 0 ]; then
    print_warning "Found $TODOS TODO/FIXME comments"
else
    print_success "No TODO/FIXME comments found"
fi

# Check for hardcoded localhost
LOCALHOST=$(grep -r "localhost" --include="*.ts" --include="*.tsx" app/ components/ lib/ 2>/dev/null | grep -v "// " | wc -l || echo "0")
if [ "$LOCALHOST" -gt 0 ]; then
    print_warning "Found $LOCALHOST references to localhost"
else
    print_success "No hardcoded localhost references"
fi

# Check for .env files in git
if git ls-files | grep -q "^\.env$\|^\.env\.local$"; then
    print_error ".env file is tracked in git! Remove it immediately!"
else
    print_success ".env files are not tracked in git"
fi

# ====================================
# Summary
# ====================================
print_header "Summary"

echo ""
echo -e "  ${GREEN}✅ Passed:   $PASSED${NC}"
echo -e "  ${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "  ${RED}❌ Failed:   $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ❌ PRE-DEPLOYMENT CHECKS FAILED                  ${NC}"
    echo -e "${RED}  Please fix the errors above before deploying.    ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  ⚠️  PRE-DEPLOYMENT CHECKS PASSED WITH WARNINGS  ${NC}"
    echo -e "${YELLOW}  Consider fixing warnings before deploying.      ${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}  🚀 Ready to deploy (with warnings)${NC}"
    echo ""
    echo "  Deploy commands:"
    echo "    Preview:    vercel"
    echo "    Production: vercel --prod"
    exit 0
else
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ ALL PRE-DEPLOYMENT CHECKS PASSED!            ${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}  🚀 Ready to deploy!${NC}"
    echo ""
    echo "  Deploy commands:"
    echo "    Preview:    vercel"
    echo "    Production: vercel --prod"
    exit 0
fi
