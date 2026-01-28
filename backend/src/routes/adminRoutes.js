const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/database');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Server error during admin verification' });
  }
};

// Get admin statistics
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Get total users count
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get total fishing logs count
    const logsResult = await pool.query('SELECT COUNT(*) as count FROM fishing_logs');
    const totalLogs = parseInt(logsResult.rows[0].count);

    // Get logs from last 30 days
    const recentLogsResult = await pool.query(
      'SELECT COUNT(*) as count FROM fishing_logs WHERE created_at >= NOW() - INTERVAL \'30 days\''
    );
    const recentLogs = parseInt(recentLogsResult.rows[0].count);

    // Get users who joined in last 30 days
    const recentUsersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\''
    );
    const recentUsers = parseInt(recentUsersResult.rows[0].count);

    // Get most active users (top 5)
    const activeUsersResult = await pool.query(`
      SELECT u.username, u.email, COUNT(fl.id) as log_count
      FROM users u
      LEFT JOIN fishing_logs fl ON u.id = fl.user_id
      GROUP BY u.id, u.username, u.email
      ORDER BY log_count DESC
      LIMIT 5
    `);

    // Get most popular locations (top 5)
    const popularLocationsResult = await pool.query(`
      SELECT location_name, COUNT(*) as visit_count
      FROM fishing_logs
      WHERE location_name IS NOT NULL
      GROUP BY location_name
      ORDER BY visit_count DESC
      LIMIT 5
    `);

    // Get most caught fish species (top 5)
    const popularFishResult = await pool.query(`
      SELECT 
        jsonb_array_elements_text(fish_types) as fish_species,
        COUNT(*) as catch_count
      FROM fishing_logs
      WHERE fish_types IS NOT NULL AND jsonb_array_length(fish_types) > 0
      GROUP BY fish_species
      ORDER BY catch_count DESC
      LIMIT 5
    `);

    // Get fishing success rate (logs with caught fish vs total)
    const successRateResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN caught_fish = 'yes' THEN 1 END) as successful_trips,
        COUNT(*) as total_trips
      FROM fishing_logs
    `);
    const successRate = successRateResult.rows[0].total_trips > 0
      ? Math.round((successRateResult.rows[0].successful_trips / successRateResult.rows[0].total_trips) * 100)
      : 0;

    // Get fishing method distribution
    const methodDistribution = await pool.query(`
      SELECT fishing_method, COUNT(*) as count
      FROM fishing_logs
      GROUP BY fishing_method
      ORDER BY count DESC
    `);

    res.json({
      overview: {
        totalUsers,
        totalLogs,
        recentUsers,
        recentLogs,
        successRate
      },
      topUsers: activeUsersResult.rows,
      topLocations: popularLocationsResult.rows,
      topFish: popularFishResult.rows,
      methodDistribution: methodDistribution.rows
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users (for admin management)
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_admin,
        u.created_at,
        COUNT(fl.id) as log_count
      FROM users u
      LEFT JOIN fishing_logs fl ON u.id = fl.user_id
      GROUP BY u.id, u.username, u.email, u.is_admin, u.created_at
      ORDER BY u.created_at DESC
    `);
    
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user fishing entries
router.get('/user-entries/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await pool.query(`
      SELECT * FROM fishing_logs
      WHERE user_id = $1
      ORDER BY log_date DESC, created_at DESC
    `, [userId]);
    
    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching user entries:', error);
    res.status(500).json({ error: 'Failed to fetch user entries' });
  }
});

module.exports = router;
