-- Bumped whenever a user's password changes. Tokens carry the version they
-- were issued under, so changing the password signs out every other session.
-- Existing tokens have no version and count as 0, matching the default, so
-- nobody is signed out by this migration.
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
