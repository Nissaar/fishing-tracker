const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { normalizeEmail, emailLookupCandidates } = require('../utils/email');

class User {
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at
    `;
    const result = await pool.query(query, [username, normalizeEmail(email), hashedPassword]);
    return result.rows[0];
  }

  // Exact (case-insensitive) match wins over the legacy dotless Gmail spelling
  static async findByEmail(email) {
    const candidates = emailLookupCandidates(email);
    const query = `
      SELECT * FROM users
      WHERE lower(email) = ANY($1::text[])
      ORDER BY array_position($1::text[], lower(email::text))
      LIMIT 1
    `;
    const result = await pool.query(query, [candidates]);
    return result.rows[0];
  }

  // Every authenticated request goes through this. SELECT * rather than naming
  // token_version, so requests that arrive while migrations are still running
  // at boot don't fail and sign the user out.
  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      avatar_url: row.avatar_url,
      is_admin: row.is_admin,
      created_at: row.created_at,
      // Google accounts are stored with an empty password hash
      has_password: Boolean(row.password_hash),
      token_version: row.token_version || 0
    };
  }

  static async getPasswordHash(id) {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
    return result.rows[0]?.password_hash || null;
  }

  // Usernames are shown on the leaderboard, so two that differ only in case
  // would look like the same angler
  static async isUsernameTaken(username, exceptId) {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE lower(username) = lower($1) AND id <> $2 LIMIT 1',
      [username, exceptId]
    );
    return result.rows.length > 0;
  }

  static async updateProfile(id, { username, email }) {
    const query = `
      UPDATE users
      SET username = COALESCE($2, username), email = COALESCE($3, email)
      WHERE id = $1
    `;
    await pool.query(query, [id, username ?? null, email == null ? null : normalizeEmail(email)]);
    return User.findById(id);
  }

  // Bumping token_version revokes every token issued before the change
  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      UPDATE users
      SET password_hash = $2, token_version = token_version + 1
      WHERE id = $1
      RETURNING id, token_version
    `;
    const result = await pool.query(query, [id, hashedPassword]);
    return result.rows[0];
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;