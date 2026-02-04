#!/bin/bash

# =============================================================================
# E2E Test Runner Script
# Fishing Tracker Pro - Comprehensive End-to-End Testing
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
E2E_DIR="$PROJECT_ROOT/e2e"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Fishing Tracker Pro - E2E Test Runner    ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Functions
print_step() {
    echo -e "${YELLOW}► $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        exit 1
    fi
}

# Parse arguments
USE_DOCKER=false
HEADED=false
DEBUG=false
CLEANUP_ONLY=false
GENERATE_REPORT=false
PROJECT=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --docker) USE_DOCKER=true ;;
        --headed) HEADED=true ;;
        --debug) DEBUG=true ;;
        --cleanup) CLEANUP_ONLY=true ;;
        --report) GENERATE_REPORT=true ;;
        --project) PROJECT="$2"; shift ;;
        -h|--help) 
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --docker     Run tests in Docker containers"
            echo "  --headed     Run tests with browser visible"
            echo "  --debug      Run tests in debug mode"
            echo "  --cleanup    Only run cleanup (no tests)"
            echo "  --report     Generate HTML report after tests"
            echo "  --project    Run specific project (chromium, firefox, mobile-chrome, admin-tests)"
            echo "  -h, --help   Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Cleanup only mode
if [ "$CLEANUP_ONLY" = true ]; then
    print_step "Running cleanup..."
    cd "$E2E_DIR"
    node scripts/cleanup.js
    print_success "Cleanup completed"
    exit 0
fi

# Check dependencies
print_step "Checking dependencies..."
check_command "node"
check_command "npm"

if [ "$USE_DOCKER" = true ]; then
    check_command "docker"
    check_command "docker-compose"
fi

print_success "All dependencies available"

# Install E2E dependencies if needed
if [ ! -d "$E2E_DIR/node_modules" ]; then
    print_step "Installing E2E dependencies..."
    cd "$E2E_DIR"
    npm install
    print_success "Dependencies installed"
fi

# Install Playwright browsers if needed
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    print_step "Installing Playwright browsers..."
    cd "$E2E_DIR"
    npx playwright install --with-deps chromium firefox
    print_success "Browsers installed"
fi

# Run tests
cd "$E2E_DIR"

if [ "$USE_DOCKER" = true ]; then
    # Docker-based testing
    print_step "Starting Docker test environment..."
    docker-compose -f docker-compose.test.yml up -d test-postgres test-backend test-frontend
    
    print_step "Waiting for services to be healthy..."
    sleep 30
    
    print_step "Running tests in Docker..."
    docker-compose -f docker-compose.test.yml run --rm playwright
    
    TEST_EXIT_CODE=$?
    
    print_step "Copying test results..."
    docker cp fishing-tracker-playwright:/e2e/playwright-report ./playwright-report 2>/dev/null || true
    docker cp fishing-tracker-playwright:/e2e/test-results ./test-results 2>/dev/null || true
    
    print_step "Stopping Docker environment..."
    docker-compose -f docker-compose.test.yml down
    
else
    # Local testing
    print_step "Running tests locally..."
    
    # Build test command
    TEST_CMD="npx playwright test"
    
    if [ -n "$PROJECT" ]; then
        TEST_CMD="$TEST_CMD --project=$PROJECT"
    fi
    
    if [ "$HEADED" = true ]; then
        TEST_CMD="$TEST_CMD --headed"
    fi
    
    if [ "$DEBUG" = true ]; then
        TEST_CMD="$TEST_CMD --debug"
    fi
    
    # Run tests
    echo "Executing: $TEST_CMD"
    $TEST_CMD
    
    TEST_EXIT_CODE=$?
fi

# Generate custom report if requested
if [ "$GENERATE_REPORT" = true ]; then
    print_step "Generating HTML report..."
    node scripts/generate-report.js
    print_success "Report generated: test-results/report.html"
fi

# Summary
echo ""
echo -e "${BLUE}============================================${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All tests completed successfully!"
else
    print_error "Some tests failed (exit code: $TEST_EXIT_CODE)"
fi
echo -e "${BLUE}============================================${NC}"

# Open report
if [ -f "playwright-report/index.html" ] && [ "$USE_DOCKER" = false ]; then
    echo ""
    echo "View the test report:"
    echo "  npx playwright show-report"
fi

exit $TEST_EXIT_CODE
