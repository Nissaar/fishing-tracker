-- ==================== EVENTS, LEADERBOARD & MULTI FISHING TYPES ====================
-- Idempotent migration. Safe to run repeatedly on an existing database.

-- ---------- Multiple fishing types per trip ----------
-- fishing_type (VARCHAR) is kept for backward compatibility and always holds the
-- primary (first) type. fishing_types holds the full list as a JSONB array.
ALTER TABLE fishing_logs ADD COLUMN IF NOT EXISTS fishing_types JSONB DEFAULT '[]'::jsonb;

-- Backfill existing rows: single type becomes a one-element array
UPDATE fishing_logs
SET fishing_types = to_jsonb(ARRAY[fishing_type])
WHERE fishing_type IS NOT NULL
  AND fishing_type <> ''
  AND (fishing_types IS NULL OR jsonb_array_length(fishing_types) = 0);

CREATE INDEX IF NOT EXISTS idx_fishing_logs_fishing_types ON fishing_logs USING GIN (fishing_types);
CREATE INDEX IF NOT EXISTS idx_fishing_logs_user_date ON fishing_logs(user_id, log_date);

-- ---------- Fishing events ----------
CREATE TABLE IF NOT EXISTS fishing_events (
    id SERIAL PRIMARY KEY,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    time_start TIME,
    time_end TIME,
    location VARCHAR(100) NOT NULL,
    location_name VARCHAR(200),
    region VARCHAR(100),
    fishing_types JSONB DEFAULT '[]'::jsonb,
    fishing_method VARCHAR(50),
    max_participants INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_event_status CHECK (status IN ('open', 'cancelled')),
    CONSTRAINT valid_max_participants CHECK (max_participants IS NULL OR max_participants > 0)
);

CREATE INDEX IF NOT EXISTS idx_fishing_events_date ON fishing_events(event_date);
CREATE INDEX IF NOT EXISTS idx_fishing_events_creator ON fishing_events(created_by);
CREATE INDEX IF NOT EXISTS idx_fishing_events_status ON fishing_events(status);

DROP TRIGGER IF EXISTS update_fishing_events_updated_at ON fishing_events;
CREATE TRIGGER update_fishing_events_updated_at BEFORE UPDATE ON fishing_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------- Event participants ----------
CREATE TABLE IF NOT EXISTS fishing_event_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES fishing_events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_participant UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON fishing_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON fishing_event_participants(user_id);
