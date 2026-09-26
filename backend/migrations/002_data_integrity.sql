-- ==================== DATA INTEGRITY CONSTRAINTS ====================
-- Idempotent migration for a live database. Each check runs first and, if
-- any existing row breaks the new rule, raises an error listing the rows so
-- they can be fixed by hand. The whole migration runs in one transaction, so
-- a failure changes nothing and it is retried on the next boot.

-- Collect every problem before failing, so one run reports all of them
CREATE TEMP TABLE migration_002_problems (problem TEXT) ON COMMIT DROP;

-- ---------- users.email: unique regardless of case ----------
INSERT INTO migration_002_problems
SELECT 'users with the same email ignoring case (ids ' || string_agg(id::text, ', ' ORDER BY id) || '): ' || lower(email)
FROM users
GROUP BY lower(email)
HAVING COUNT(*) > 1;

-- ---------- users.is_admin: never NULL ----------
INSERT INTO migration_002_problems
SELECT 'users with is_admin NULL (ids ' || string_agg(id::text, ', ' ORDER BY id) || ')'
FROM users
WHERE is_admin IS NULL
HAVING COUNT(*) > 0;

-- ---------- fishing_logs.user_id: every log has an owner ----------
INSERT INTO migration_002_problems
SELECT 'fishing_logs with user_id NULL (ids ' || string_agg(id::text, ', ' ORDER BY id) || ')'
FROM fishing_logs
WHERE user_id IS NULL
HAVING COUNT(*) > 0;

-- ---------- fishing_logs.fish_count: 0 to 200 ----------
INSERT INTO migration_002_problems
SELECT 'fishing_logs with fish_count outside 0-200 (id=count: ' || string_agg(id || '=' || fish_count, ', ' ORDER BY id) || ')'
FROM fishing_logs
WHERE fish_count < 0 OR fish_count > 200
HAVING COUNT(*) > 0;

-- ---------- status columns: only values the app uses ----------
INSERT INTO migration_002_problems
SELECT 'contact_messages with unknown status (id=status: ' || string_agg(id || '=' || COALESCE(status, 'NULL'), ', ' ORDER BY id) || ')'
FROM contact_messages
WHERE status IS NULL OR status NOT IN ('unread', 'read', 'replied')
HAVING COUNT(*) > 0;

INSERT INTO migration_002_problems
SELECT 'custom_dropdown_submissions with unknown status (id=status: ' || string_agg(id || '=' || COALESCE(status, 'NULL'), ', ' ORDER BY id) || ')'
FROM custom_dropdown_submissions
WHERE status IS NULL OR status NOT IN ('pending', 'approved', 'rejected')
HAVING COUNT(*) > 0;

INSERT INTO migration_002_problems
SELECT 'custom_fish_requests with unknown status (id=status: ' || string_agg(id || '=' || COALESCE(status, 'NULL'), ', ' ORDER BY id) || ')'
FROM custom_fish_requests
WHERE status IS NULL OR status NOT IN ('pending', 'approved', 'rejected')
HAVING COUNT(*) > 0;

DO $$
DECLARE
  report TEXT;
BEGIN
  SELECT string_agg('  - ' || problem, E'\n') INTO report FROM migration_002_problems;
  IF report IS NOT NULL THEN
    RAISE EXCEPTION E'existing rows break the new constraints; fix them and restart:\n%', report;
  END IF;
END $$;

-- ---------- Apply the constraints ----------

-- Stored emails are left as they are; lookups compare lower(email), and new
-- ones are saved lowercase by the app
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
-- Redundant with the index Postgres already creates for UNIQUE (email)
DROP INDEX IF EXISTS idx_users_email;

ALTER TABLE users ALTER COLUMN is_admin SET DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN is_admin SET NOT NULL;

ALTER TABLE fishing_logs ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fishing_logs_fish_count_range') THEN
    ALTER TABLE fishing_logs ADD CONSTRAINT fishing_logs_fish_count_range CHECK (fish_count BETWEEN 0 AND 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_status_valid') THEN
    ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_status_valid CHECK (status IN ('unread', 'read', 'replied'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_dropdown_submissions_status_valid') THEN
    ALTER TABLE custom_dropdown_submissions ADD CONSTRAINT custom_dropdown_submissions_status_valid CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_fish_requests_status_valid') THEN
    ALTER TABLE custom_fish_requests ADD CONSTRAINT custom_fish_requests_status_valid CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

ALTER TABLE contact_messages ALTER COLUMN status SET NOT NULL;
ALTER TABLE custom_dropdown_submissions ALTER COLUMN status SET NOT NULL;
ALTER TABLE custom_fish_requests ALTER COLUMN status SET NOT NULL;
