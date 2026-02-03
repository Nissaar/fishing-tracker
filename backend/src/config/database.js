const { Pool } = require('pg');
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
  // Pool errors are logged but don't crash the app to allow reconnection
});

module.exports = pool;
