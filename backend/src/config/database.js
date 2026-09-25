const { Pool } = require('pg');
const logger = require('./logger');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 12000,
  query_timeout: 12000,
  keepAlive: true,
});

pool.on('error', (err) => {
  // Logged but not rethrown, so an idle client dropping doesn't crash the app
  logger.error(`Database pool error: ${err.message}`);
});

module.exports = pool;
