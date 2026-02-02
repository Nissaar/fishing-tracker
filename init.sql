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

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'replied'
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created ON contact_messages(created_at);

CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create custom_fish_requests table (for "Other" fish entries)
CREATE TABLE IF NOT EXISTS custom_fish_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    fish_name VARCHAR(200) NOT NULL,
    fishing_log_id INTEGER REFERENCES fishing_logs(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_fish_requests_status ON custom_fish_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_fish_requests_user ON custom_fish_requests(user_id);

CREATE TRIGGER update_custom_fish_requests_updated_at BEFORE UPDATE ON custom_fish_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== DROPDOWN MANAGEMENT TABLES ====================

-- Fishing types table
CREATE TABLE IF NOT EXISTS fishing_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fishing_types_updated_at BEFORE UPDATE ON fishing_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fishing methods table
CREATE TABLE IF NOT EXISTS fishing_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fishing_methods_updated_at BEFORE UPDATE ON fishing_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fishing baits table (linked to fishing types)
CREATE TABLE IF NOT EXISTS fishing_baits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    fishing_type_id INTEGER REFERENCES fishing_types(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fishing_baits_type ON fishing_baits(fishing_type_id);

CREATE TRIGGER update_fishing_baits_updated_at BEFORE UPDATE ON fishing_baits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fish species table (with local, english, and scientific names)
CREATE TABLE IF NOT EXISTS fish_species (
    id SERIAL PRIMARY KEY,
    local_name VARCHAR(100),
    english_name VARCHAR(100),
    scientific_name VARCHAR(150),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fish_species_updated_at BEFORE UPDATE ON fish_species
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fishing locations table (managed by admin)
CREATE TABLE IF NOT EXISTS fishing_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    region VARCHAR(100),
    type VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fishing_locations_updated_at BEFORE UPDATE ON fishing_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Custom dropdown submissions table (for user-submitted custom options)
CREATE TABLE IF NOT EXISTS custom_dropdown_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_type VARCHAR(50) NOT NULL,
    submitted_value VARCHAR(200) NOT NULL,
    description TEXT,
    fishing_type_id INTEGER REFERENCES fishing_types(id) ON DELETE SET NULL,
    local_name VARCHAR(100),
    english_name VARCHAR(100),
    scientific_name VARCHAR(150),
    fishing_log_id INTEGER REFERENCES fishing_logs(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_submissions_status ON custom_dropdown_submissions(status);
CREATE INDEX IF NOT EXISTS idx_custom_submissions_user ON custom_dropdown_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_submissions_type ON custom_dropdown_submissions(submission_type);

CREATE TRIGGER update_custom_submissions_updated_at BEFORE UPDATE ON custom_dropdown_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at);

-- Insert default fishing types
INSERT INTO fishing_types (name, description) VALUES
    ('Casting', 'Shore or surf casting technique'),
    ('Jigging', 'Vertical jigging technique'),
    ('Lapess Couler/Couler', 'Traditional bait fishing technique'),
    ('Dropshot', 'Dropshot rig fishing'),
    ('Trolling', 'Boat trolling technique'),
    ('Bottom Fishing', 'Bottom fishing from boat or shore')
ON CONFLICT (name) DO NOTHING;

-- Insert default fishing methods
INSERT INTO fishing_methods (name, description) VALUES
    ('Land', 'Fishing from shore, beach, or rocks'),
    ('Boat', 'Fishing from a boat')
ON CONFLICT (name) DO NOTHING;

-- Insert default baits
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Calamar', id FROM fishing_types WHERE name = 'Lapess Couler/Couler'
ON CONFLICT DO NOTHING;
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Baby calamar', id FROM fishing_types WHERE name = 'Lapess Couler/Couler'
ON CONFLICT DO NOTHING;
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Shrimp/Crevette', id FROM fishing_types WHERE name = 'Lapess Couler/Couler'
ON CONFLICT DO NOTHING;
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Macro', id FROM fishing_types WHERE name = 'Lapess Couler/Couler'
ON CONFLICT DO NOTHING;
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Bonit', id FROM fishing_types WHERE name = 'Lapess Couler/Couler'
ON CONFLICT DO NOTHING;
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Tidelures', id FROM fishing_types WHERE name = 'Casting'
ON CONFLICT DO NOTHING;
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Ti Tracer', id FROM fishing_types WHERE name = 'Casting'
ON CONFLICT DO NOTHING;
INSERT INTO fishing_baits (name, fishing_type_id) 
SELECT 'Ton Zorz', id FROM fishing_types WHERE name = 'Casting'
ON CONFLICT DO NOTHING;

-- Exit
\q
