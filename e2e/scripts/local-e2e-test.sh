#!/bin/bash
# Local E2E Test Script - mimics GitHub Actions workflow
set -e

# Source NVM if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Add common node paths
export PATH="/usr/local/bin:/usr/bin:$HOME/.npm-global/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_DIR="$PROJECT_ROOT/e2e"

echo "========================================"
echo "🧪 Local E2E Test Runner"
echo "========================================"
echo "Project root: $PROJECT_ROOT"
echo ""

# Environment variables (same as GitHub Actions)
export TEST_USER_EMAIL="e2etest@fishingtracker.mu"
export TEST_USER_PASSWORD="password"
export TEST_ADMIN_EMAIL="admin@fishingtracker.mu"
export TEST_ADMIN_PASSWORD="password"
export TEST_BASE_URL="http://localhost:3000"
export TEST_API_URL="http://localhost:5000/api"
export NODE_ENV=test

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    
    # Kill background processes
    [ -f "$PROJECT_ROOT/backend/backend.pid" ] && kill $(cat "$PROJECT_ROOT/backend/backend.pid") 2>/dev/null || true
    [ -f "$PROJECT_ROOT/frontend/frontend.pid" ] && kill $(cat "$PROJECT_ROOT/frontend/frontend.pid") 2>/dev/null || true
    
    # Stop postgres container
    docker stop e2e-test-postgres 2>/dev/null || true
    docker rm e2e-test-postgres 2>/dev/null || true
    
    echo "✅ Cleanup complete"
}
trap cleanup EXIT

# Step 1: Start PostgreSQL
echo "📦 Step 1: Starting PostgreSQL..."
docker rm -f e2e-test-postgres 2>/dev/null || true
docker run -d \
    --name e2e-test-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=testpassword \
    -e POSTGRES_DB=fishing_tracker \
    -p 5434:5432 \
    postgres:15-alpine

echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec e2e-test-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

# Step 2: Initialize database schema
echo ""
echo "📦 Step 2: Initializing database schema..."
# Run init.sql (without CREATE DATABASE since Docker already created it)
docker exec -i e2e-test-postgres psql -U postgres -d fishing_tracker << 'EOSQL'
-- Create trigger function for updated_at timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fishing types table
CREATE TABLE IF NOT EXISTS fishing_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fish species table
CREATE TABLE IF NOT EXISTS fish_species (
    id SERIAL PRIMARY KEY,
    local_name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100),
    scientific_name VARCHAR(100) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bait types table
CREATE TABLE IF NOT EXISTS bait_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fishing methods table
CREATE TABLE IF NOT EXISTS fishing_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fishing logs table
CREATE TABLE IF NOT EXISTS fishing_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id),
    fishing_type_id INTEGER REFERENCES fishing_types(id),
    fish_species_id INTEGER REFERENCES fish_species(id),
    bait_type_id INTEGER REFERENCES bait_types(id),
    fishing_method_id INTEGER REFERENCES fishing_methods(id),
    quantity_caught INTEGER,
    weight_caught DECIMAL(10, 2),
    weather_condition VARCHAR(50),
    wind_speed DECIMAL(5, 2),
    water_temperature DECIMAL(5, 2),
    moon_phase VARCHAR(20),
    tide_status VARCHAR(20),
    date_caught DATE,
    time_start TIME,
    time_end TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom submissions table
CREATE TABLE IF NOT EXISTS custom_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_type VARCHAR(50),
    value VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOSQL

echo "✅ Database schema initialized"

# Step 3: Create test users
echo ""
echo "📦 Step 3: Creating test users..."
docker exec -i e2e-test-postgres psql -U postgres -d fishing_tracker << 'EOSQL'
-- Create test user with bcrypt hash for 'password'
INSERT INTO users (username, email, password_hash, is_admin)
VALUES (
    'E2E Test User',
    'e2etest@fishingtracker.mu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    false
) ON CONFLICT (email) DO NOTHING;

-- Create admin user
INSERT INTO users (username, email, password_hash, is_admin)
VALUES (
    'Admin User',
    'admin@fishingtracker.mu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    true
) ON CONFLICT (email) DO NOTHING;
EOSQL

echo "✅ Test users created"

# Verify users
echo ""
echo "📋 Verifying users in database:"
docker exec -i e2e-test-postgres psql -U postgres -d fishing_tracker -c "SELECT id, email, is_admin FROM users;"

# Step 4: Create backend .env
echo ""
echo "📦 Step 4: Creating backend .env..."
cat > "$PROJECT_ROOT/backend/.env" << EOF
NODE_ENV=test
PORT=5000
DB_HOST=localhost
DB_PORT=5434
DB_NAME=fishing_tracker
DB_USER=postgres
DB_PASSWORD=testpassword
JWT_SECRET=test-jwt-secret-for-e2e-testing
JWT_EXPIRE=7d
SESSION_SECRET=test-session-secret
CORS_ORIGIN=http://localhost:3000,http://localhost:80
EOF
echo "✅ Backend .env created"

# Step 5: Install and start backend
echo ""
echo "📦 Step 5: Installing backend dependencies..."
cd "$PROJECT_ROOT/backend"
npm install --legacy-peer-deps --no-optional 2>&1 | tail -5
echo ""
echo "🚀 Starting backend server..."
nohup npm start > backend.log 2>&1 &
echo $! > backend.pid
sleep 5

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in {1..30}; do
    response=$(curl -s http://localhost:5000/health 2>/dev/null)
    if echo "$response" | grep -q '"database":"connected"'; then
        echo "✅ Backend is ready and database is connected!"
        break
    elif echo "$response" | grep -q '"status":"OK"'; then
        echo "⚠️  Backend responded but database might not be connected"
        echo "Response: $response"
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to connect to database"
        echo "Backend logs:"
        cat backend.log
        exit 1
    fi
    sleep 2
done

# Step 6: Test login API directly
echo ""
echo "📦 Step 6: Testing login API..."
login_response=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"e2etest@fishingtracker.mu","password":"password"}')

echo "Login response: $login_response"

if echo "$login_response" | grep -q '"token"'; then
    echo "✅ Login API works! Got token."
else
    echo "❌ Login failed!"
    echo "Backend logs:"
    tail -50 backend.log
    exit 1
fi

# Step 7: Build and start frontend
echo ""
echo "📦 Step 7: Building frontend..."
cd "$PROJECT_ROOT/frontend"

# Create frontend .env
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF

npm install --legacy-peer-deps --no-optional 2>&1 | tail -5
CI=false npm run build 2>&1 | tail -10

if [ ! -d "build" ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built"
echo "🚀 Starting frontend server..."
npx serve -s build -l 3000 > frontend.log 2>&1 &
echo $! > frontend.pid
sleep 5

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..30}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    if [ "$response" = "200" ] || [ "$response" = "304" ]; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend failed to start"
        cat frontend.log
        exit 1
    fi
    sleep 2
done

# Step 8: Run Playwright tests
echo ""
echo "========================================"
echo "🧪 Step 8: Running Playwright E2E tests"
echo "========================================"
cd "$E2E_DIR"
npm install 2>&1 | tail -5
npx playwright install chromium --with-deps 2>&1 | tail -10

echo ""
echo "🎭 Running tests..."
npx playwright test --reporter=list --project=setup --project=chromium

test_exit_code=$?

if [ $test_exit_code -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ ALL E2E TESTS PASSED!"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "❌ E2E TESTS FAILED (exit code: $test_exit_code)"
    echo "========================================"
    echo ""
    echo "Backend logs:"
    tail -30 "$PROJECT_ROOT/backend/backend.log"
fi

exit $test_exit_code
