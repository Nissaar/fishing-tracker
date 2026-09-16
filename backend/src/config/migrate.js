const fs = require('fs').promises;
const path = require('path');
const pool = require('./database');
const logger = require('./logger');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

// Migrations are plain idempotent .sql files applied in filename order.
// Applied filenames are recorded so a restart does not replay them.
const runMigrations = async () => {
  let files;
  try {
    files = (await fs.readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort();
  } catch (error) {
    logger.warn(`Migrations directory not found at ${MIGRATIONS_DIR}, skipping migrations`);
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map(r => r.filename));

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info(`Migration applied: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${error.message}`);
    } finally {
      client.release();
    }
  }
};

module.exports = { runMigrations };
