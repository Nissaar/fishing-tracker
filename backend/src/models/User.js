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

  static async findById(id) {
    const query = 'SELECT id, username, email, avatar_url, is_admin, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;