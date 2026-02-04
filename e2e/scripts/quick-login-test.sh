#!/bin/bash
set -e

PROJECT_ROOT="/home/mushir/fishing-tracker/fishing-tracker"
cd "$PROJECT_ROOT"

echo "=== Quick Login Test ==="

# Cleanup
docker stop e2e-test-postgres 2>/dev/null || true
docker rm e2e-test-postgres 2>/dev/null || true
pkill -f 'node src/server.js' 2>/dev/null || true

# Start PostgreSQL
echo "Starting PostgreSQL..."
docker run --name e2e-test-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=testpassword \
    -e POSTGRES_DB=fishing_tracker \
    -p 5434:5432 -d postgres:15-alpine

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec e2e-test-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        break
    fi
    echo "  Attempt $i/30..."
    sleep 1
done

# Initialize schema
echo "Initializing schema..."
cat init.sql | docker exec -i e2e-test-postgres psql -U postgres -d fishing_tracker

# Create test user
echo "Creating test user..."
docker exec -i e2e-test-postgres psql -U postgres -d fishing_tracker -c \
    "INSERT INTO users (username, email, password_hash, is_admin) VALUES ('Test', 'e2etest@fishingtracker.mu', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', false);"

# Verify .env
echo ""
echo "=== Backend .env ==="
cat backend/.env

# Start backend
echo ""
echo "Starting backend..."
cd backend
nohup npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 5

# Test login
echo ""
echo "=== Testing Login ==="
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"e2etest@fishingtracker.mu","password":"password"}')
echo "$RESPONSE"

# Check if token is in response
if echo "$RESPONSE" | grep -q '"token"'; then
    echo ""
    echo "✅ LOGIN SUCCESSFUL! JWT token received."
else
    echo ""
    echo "❌ LOGIN FAILED!"
    echo ""
    echo "=== Backend Logs ==="
    cat /tmp/backend.log
fi

# Cleanup
echo ""
echo "Cleaning up..."
kill $BACKEND_PID 2>/dev/null || true
docker stop e2e-test-postgres && docker rm e2e-test-postgres

echo "Done!"
