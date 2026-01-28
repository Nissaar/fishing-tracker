-- Create database
CREATE DATABASE fishing_tracker;

-- Connect to database
\c fishing_tracker;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fishing_logs table
CREATE TABLE fishing_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    location VARCHAR(100) NOT NULL,
    location_name VARCHAR(200),
    caught_fish BOOLEAN NOT NULL,
    fish_count INTEGER DEFAULT 0,
    fish_types JSONB,
    moon_phase VARCHAR(50),
    sea_level VARCHAR(50),
    tide_data JSONB,
    weather_data JSONB,
    fish_activity VARCHAR(50),
    solunar_data JSONB,
    hook_setup VARCHAR(200),
    bait VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_fishing_logs_user_id ON fishing_logs(user_id);
CREATE INDEX idx_fishing_logs_date ON fishing_logs(log_date);
CREATE INDEX idx_fishing_logs_location ON fishing_logs(location);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fishing_logs_updated_at BEFORE UPDATE ON fishing_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to fishing_logs table
ALTER TABLE fishing_logs ADD COLUMN IF NOT EXISTS fishing_type VARCHAR(100);
ALTER TABLE fishing_logs ADD COLUMN IF NOT EXISTS fishing_method VARCHAR(20); -- 'boat' or 'land'
ALTER TABLE fishing_logs ADD COLUMN IF NOT EXISTS sea_temperature DECIMAL(5,2);
ALTER TABLE fishing_logs ADD COLUMN IF NOT EXISTS wave_height DECIMAL(5,2);

-- If table doesn't exist yet, use this full schema:
CREATE TABLE IF NOT EXISTS fishing_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    location VARCHAR(100) NOT NULL,
    location_name VARCHAR(200),
    caught_fish BOOLEAN NOT NULL,
    fish_count INTEGER DEFAULT 0,
    fish_types JSONB,
    fishing_type VARCHAR(100),
    fishing_method VARCHAR(20),
    moon_phase VARCHAR(50),
    sea_level VARCHAR(50),
    sea_temperature DECIMAL(5,2),
    wave_height DECIMAL(5,2),
    tide_data JSONB,
    weather_data JSONB,
    hook_setup VARCHAR(200),
    bait VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns
ALTER TABLE fishing_logs ADD COLUMN IF NOT EXISTS tide_height DECIMAL(5,2);

-- Update existing records to have tide_height from tide_data
UPDATE fishing_logs 
SET tide_height = CAST((tide_data->>'height')::text AS DECIMAL(5,2))
WHERE tide_data IS NOT NULL;

-- Exit
\q
