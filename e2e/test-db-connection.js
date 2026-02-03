const pool = require('../backend/src/config/database');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    // Test database connection
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['e2etest@fishingtracker.mu']);
    console.log('User found:', result.rows[0]);
    
    if (result.rows[0]) {
      const user = result.rows[0];
      const isValid = await bcrypt.compare('password', user.password_hash);
      console.log('Password valid:', isValid);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

test();
