const { Pool } = require('pg');
require('dotenv').config();

console.log('📋 Database Configuration:');
console.log(`  Host: ${process.env.DB_HOST}`);
console.log(`  Port: ${process.env.DB_PORT}`);
console.log(`  Database: ${process.env.DB_NAME}`);
console.log(`  User: ${process.env.DB_USER}`);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // give pool longer to hand out a client during OAuth callbacks
  statement_timeout: 12000,
  query_timeout: 12000,
  keepAlive: true,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  // Don't exit immediately - allow the app to continue and handle reconnection
  // process.exit(-1);
});

module.exports = pool;
