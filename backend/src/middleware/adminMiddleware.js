const pool = require('../config/database');
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for admin routes
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 admin requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

/**
 * Middleware to check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Error during admin verification for user:', req.user && req.user.id, error);
    res.status(500).json({ error: 'Server error during admin verification' });
  }
};

module.exports = { isAdmin, adminLimiter };
