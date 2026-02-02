-- Initialize test users for E2E testing
-- This runs after the main init.sql

-- Wait for users table to be created (handled by docker-entrypoint)

-- Create E2E test user with bcrypt hash for 'E2ETestPassword123!'
INSERT INTO users (username, email, password_hash, is_admin, created_at)
VALUES (
  'E2E Test User',
  'e2etest@fishingtracker.mu',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  false,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  is_admin = false;

-- Create admin test user with bcrypt hash for 'AdminPassword123!'
INSERT INTO users (username, email, password_hash, is_admin, created_at)
VALUES (
  'Admin User',
  'admin@fishingtracker.mu',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  true,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  is_admin = true;

-- Add some sample dropdown data for testing
INSERT INTO fishing_types (name, description, is_active) VALUES
  ('Casting', 'Shore casting with lures or bait', true),
  ('Jigging', 'Vertical jigging technique', true),
  ('Bottom Fishing', 'Traditional bottom fishing', true),
  ('Trolling', 'Moving boat fishing', true),
  ('Other', 'Other fishing methods', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO fishing_methods (name, description, is_active) VALUES
  ('land', 'Fishing from shore', true),
  ('boat', 'Fishing from a boat', true),
  ('kayak', 'Fishing from a kayak', true),
  ('Other', 'Other methods', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO fishing_baits (name, description, fishing_type_id, is_active) VALUES
  ('Live Shrimp', 'Fresh live shrimp', 1, true),
  ('Cut Bait', 'Cut fish bait', 3, true),
  ('Lures', 'Artificial lures', 1, true),
  ('Jigs', 'Metal jigs for jigging', 2, true),
  ('Soft Plastics', 'Soft plastic lures', 1, true),
  ('Other', 'Other baits', NULL, true)
ON CONFLICT DO NOTHING;

INSERT INTO fish_species (local_name, english_name, scientific_name, is_active) VALUES
  ('Carangue', 'Giant Trevally', 'Caranx ignobilis', true),
  ('Dame Berri', 'Bluefin Trevally', 'Caranx melampygus', true),
  ('Bonite', 'Bonito', 'Sarda sarda', true),
  ('Sacre Chien', 'Dogtooth Tuna', 'Gymnosarda unicolor', true),
  ('Vieille Rouge', 'Red Snapper', 'Lutjanus campechanus', true),
  ('Other', 'Other Species', 'Unknown', true)
ON CONFLICT DO NOTHING;

-- Log that test setup is complete
DO $$
BEGIN
  RAISE NOTICE 'E2E test users and sample data created successfully';
END $$;
