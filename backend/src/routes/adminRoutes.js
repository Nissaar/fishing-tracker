const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/database');
const logger = require('../config/logger');
const { allLocations } = require('../data/mauritiusLocations');
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 admin requests per windowMs
});

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
router.get('/users', authMiddleware, isAdmin, adminLimiter, async (req, res) => {
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
router.get('/user-entries/:userId', authMiddleware, isAdmin, adminLimiter, async (req, res) => {
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

// ==================== USER MANAGEMENT ====================

// Update user admin status
router.patch('/users/:userId/admin', authMiddleware, isAdmin, adminLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin: makeAdmin } = req.body;

    // Prevent self-demotion
    if (parseInt(userId) === req.user.id && !makeAdmin) {
      return res.status(400).json({ error: 'You cannot remove your own admin privileges' });
    }

    const result = await pool.query(
      'UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, is_admin',
      [makeAdmin, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User ${userId} admin status updated to ${makeAdmin} by admin ${req.user.id}`);
    res.json({ user: result.rows[0], message: `Admin status ${makeAdmin ? 'granted' : 'revoked'} successfully` });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    res.status(500).json({ error: 'Failed to update user admin status' });
  }
});

// Delete user
router.delete('/users/:userId', authMiddleware, isAdmin, adminLimiter, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User ${userId} deleted by admin ${req.user.id}`);
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update user information (username, email)
router.patch('/users/:userId', authMiddleware, isAdmin, adminLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Validate username format and length
    if (username.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username must be alphanumeric with hyphens/underscores and no more than 50 characters' });
    }

    // Validate email format and length
    if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email must be a valid email address and no more than 100 characters' });
    }

    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Check if username is already taken by another user
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, userId]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already in use' });
    }

    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, is_admin',
      [username, email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User ${userId} information updated by admin ${req.user.id}`);
    res.json({ user: result.rows[0], message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ==================== FISHING LOG MANAGEMENT (ADMIN) ====================

// Update fishing log (admin)
router.patch('/fishing-logs/:logId', authMiddleware, adminLimiter, isAdmin, async (req, res) => {
  try {
    const { logId } = req.params;

    // Define which fields are allowed to be updated
    const updatableFields = [
      'log_date',
      'time_start',
      'time_end',
      'location_name',
      'location',
      'caught_fish',
      'fish_count',
      'fish_types',
      'fishing_type',
      'fishing_method',
      'bait',
      'moon_phase',
      'tide_phase',
      'tide_height',
      'sea_level',
      'fish_activity',
      'hook_setup',
      'notes'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    // Only update fields that are explicitly present in the request body.
    // This allows setting a field to NULL by sending `"field": null`.
    for (const field of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    // Always update the timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE fishing_logs
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *`;

    values.push(logId);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing log not found' });
    }

    logger.info(`Fishing log ${logId} updated by admin ${req.user.id}`);
    res.json({ log: result.rows[0], message: 'Fishing log updated successfully' });
  } catch (error) {
    console.error('Error updating fishing log:', error);
    res.status(500).json({ error: 'Failed to update fishing log' });
  }
});

// Delete fishing log (admin)
router.delete('/fishing-logs/:logId', authMiddleware, isAdmin, adminLimiter, async (req, res) => {
  try {
    const { logId } = req.params;

    const result = await pool.query(
      'DELETE FROM fishing_logs WHERE id = $1 RETURNING id, user_id, log_date',
      [logId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing log not found' });
    }

    logger.info(`Fishing log ${logId} deleted by admin ${req.user.id}`);
    res.json({ message: 'Fishing log deleted successfully', log: result.rows[0] });
  } catch (error) {
    console.error('Error deleting fishing log:', error);
    res.status(500).json({ error: 'Failed to delete fishing log' });
  }
});

// ==================== DROPDOWN MANAGEMENT ====================

// Helper function to check if a table exists
const tableExists = async (tableName) => {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
};

// Get all fishing types
router.get('/fishing-types', authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!(await tableExists('fishing_types'))) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM fishing_types ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fishing types:', error);
    res.status(500).json({ error: 'Failed to fetch fishing types' });
  }
});

// Create fishing type
router.post('/fishing-types', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO fishing_types (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    logger.info(`Fishing type "${name}" created by admin ${req.user.id}`);
    res.status(201).json({ fishingType: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Fishing type already exists' });
    }
    console.error('Error creating fishing type:', error);
    res.status(500).json({ error: 'Failed to create fishing type' });
  }
});

// Update fishing type
router.put('/fishing-types/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const result = await pool.query(
      'UPDATE fishing_types SET name = $1, description = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description, is_active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing type not found' });
    }
    res.json({ fishingType: result.rows[0] });
  } catch (error) {
    console.error('Error updating fishing type:', error);
    res.status(500).json({ error: 'Failed to update fishing type' });
  }
});

// Delete fishing type
router.delete('/fishing-types/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fishing_types WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing type not found' });
    }
    res.json({ message: 'Fishing type deleted successfully' });
  } catch (error) {
    console.error('Error deleting fishing type:', error);
    res.status(500).json({ error: 'Failed to delete fishing type' });
  }
});

// Get all fishing methods
router.get('/fishing-methods', authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!(await tableExists('fishing_methods'))) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM fishing_methods ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fishing methods:', error);
    res.status(500).json({ error: 'Failed to fetch fishing methods' });
  }
});

// Create fishing method
router.post('/fishing-methods', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO fishing_methods (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json({ fishingMethod: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Fishing method already exists' });
    }
    console.error('Error creating fishing method:', error);
    res.status(500).json({ error: 'Failed to create fishing method' });
  }
});

// Update fishing method
router.put('/fishing-methods/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const result = await pool.query(
      'UPDATE fishing_methods SET name = $1, description = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description, is_active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing method not found' });
    }
    res.json({ fishingMethod: result.rows[0] });
  } catch (error) {
    console.error('Error updating fishing method:', error);
    res.status(500).json({ error: 'Failed to update fishing method' });
  }
});

// Delete fishing method
router.delete('/fishing-methods/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fishing_methods WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing method not found' });
    }
    res.json({ message: 'Fishing method deleted successfully' });
  } catch (error) {
    console.error('Error deleting fishing method:', error);
    res.status(500).json({ error: 'Failed to delete fishing method' });
  }
});

// Get all fishing baits (with optional fishing_type filter)
router.get('/fishing-baits', authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!(await tableExists('fishing_baits'))) {
      return res.json([]);
    }
    const { fishingTypeId } = req.query;
    let query = `
      SELECT fb.*, ft.name as fishing_type_name 
      FROM fishing_baits fb 
      LEFT JOIN fishing_types ft ON fb.fishing_type_id = ft.id
    `;
    const params = [];
    
    if (fishingTypeId) {
      query += ' WHERE fb.fishing_type_id = $1';
      params.push(fishingTypeId);
    }
    query += ' ORDER BY fb.name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fishing baits:', error);
    res.status(500).json({ error: 'Failed to fetch fishing baits' });
  }
});

// Create fishing bait
router.post('/fishing-baits', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, description, fishing_type_id } = req.body;
    const result = await pool.query(
      'INSERT INTO fishing_baits (name, description, fishing_type_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, fishing_type_id]
    );
    res.status(201).json({ fishingBait: result.rows[0] });
  } catch (error) {
    console.error('Error creating fishing bait:', error);
    res.status(500).json({ error: 'Failed to create fishing bait' });
  }
});

// Update fishing bait
router.put('/fishing-baits/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, fishing_type_id, is_active } = req.body;
    const result = await pool.query(
      'UPDATE fishing_baits SET name = $1, description = $2, fishing_type_id = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, description, fishing_type_id, is_active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing bait not found' });
    }
    res.json({ fishingBait: result.rows[0] });
  } catch (error) {
    console.error('Error updating fishing bait:', error);
    res.status(500).json({ error: 'Failed to update fishing bait' });
  }
});

// Delete fishing bait
router.delete('/fishing-baits/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fishing_baits WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fishing bait not found' });
    }
    res.json({ message: 'Fishing bait deleted successfully' });
  } catch (error) {
    console.error('Error deleting fishing bait:', error);
    res.status(500).json({ error: 'Failed to delete fishing bait' });
  }
});

// Get all fish species
router.get('/fish-species', authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!(await tableExists('fish_species'))) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM fish_species ORDER BY local_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fish species:', error);
    res.status(500).json({ error: 'Failed to fetch fish species' });
  }
});

// Create fish species
router.post('/fish-species', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { local_name, english_name, scientific_name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO fish_species (local_name, english_name, scientific_name, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [local_name, english_name, scientific_name, description]
    );
    res.status(201).json({ fishSpecies: result.rows[0] });
  } catch (error) {
    console.error('Error creating fish species:', error);
    res.status(500).json({ error: 'Failed to create fish species' });
  }
});

// Update fish species
router.put('/fish-species/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { local_name, english_name, scientific_name, description, is_active } = req.body;
    const result = await pool.query(
      'UPDATE fish_species SET local_name = $1, english_name = $2, scientific_name = $3, description = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [local_name, english_name, scientific_name, description, is_active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fish species not found' });
    }
    res.json({ fishSpecies: result.rows[0] });
  } catch (error) {
    console.error('Error updating fish species:', error);
    res.status(500).json({ error: 'Failed to update fish species' });
  }
});

// Delete fish species
router.delete('/fish-species/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fish_species WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fish species not found' });
    }
    res.json({ message: 'Fish species deleted successfully' });
  } catch (error) {
    console.error('Error deleting fish species:', error);
    res.status(500).json({ error: 'Failed to delete fish species' });
  }
});

// Get all locations
router.get('/locations', authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!(await tableExists('fishing_locations'))) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM fishing_locations ORDER BY name');
    if (result.rows.length === 0 && allLocations.length > 0) {
      const insertValues = [];
      const placeholders = allLocations.map((loc, index) => {
        const base = index * 6;
        insertValues.push(loc.name, loc.region || null, loc.type || null, loc.lat || null, loc.lon || null, null);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      });

      await pool.query(
        `INSERT INTO fishing_locations (name, region, type, latitude, longitude, description)
         VALUES ${placeholders.join(', ')}`,
        insertValues
      );

      const refreshed = await pool.query('SELECT * FROM fishing_locations ORDER BY name');
      return res.json(refreshed.rows);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create location
router.post('/locations', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, region, type, latitude, longitude, description } = req.body;
    const result = await pool.query(
      'INSERT INTO fishing_locations (name, region, type, latitude, longitude, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, region, type, latitude, longitude, description]
    );
    res.status(201).json({ location: result.rows[0] });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update location
router.put('/locations/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region, type, latitude, longitude, description, is_active } = req.body;
    const result = await pool.query(
      'UPDATE fishing_locations SET name = $1, region = $2, type = $3, latitude = $4, longitude = $5, description = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [name, region, type, latitude, longitude, description, is_active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ location: result.rows[0] });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Delete location
router.delete('/locations/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fishing_locations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// ==================== CUSTOM SUBMISSIONS MANAGEMENT ====================

// Get all custom dropdown submissions from both custom_dropdown_submissions table and fishing_logs
router.get('/submissions', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Combined query that gets submissions from both sources
    const result = await pool.query(`
      -- From custom_dropdown_submissions table (from + button)
      SELECT 
        cds.id::text as id,
        cds.user_id,
        u.username,
        u.email,
        cds.submitted_value,
        cds.submission_type,
        cds.status,
        cds.reviewed_by,
        reviewer.username as reviewer_username,
        cds.reviewed_at,
        cds.created_at
      FROM custom_dropdown_submissions cds
      LEFT JOIN users u ON cds.user_id = u.id
      LEFT JOIN users reviewer ON cds.reviewed_by = reviewer.id
      
      UNION ALL
      
      -- From fishing_logs custom fields (from "other" selections)
      SELECT 
        CONCAT('fl_fishing_type_', fl.id)::text as id,
        fl.user_id,
        u.username,
        u.email,
        fl.fishing_type_other as submitted_value,
        'fishing_type' as submission_type,
        'pending' as status,
        NULL::INTEGER as reviewed_by,
        NULL as reviewer_username,
        NULL as reviewed_at,
        fl.created_at
      FROM fishing_logs fl
      LEFT JOIN users u ON fl.user_id = u.id
      WHERE fl.fishing_type_other IS NOT NULL AND fl.fishing_type_other != ''
      
      UNION ALL
      
      SELECT 
        CONCAT('fl_fishing_method_', fl.id)::text as id,
        fl.user_id,
        u.username,
        u.email,
        fl.fishing_method_other as submitted_value,
        'fishing_method' as submission_type,
        'pending' as status,
        NULL::INTEGER as reviewed_by,
        NULL as reviewer_username,
        NULL as reviewed_at,
        fl.created_at
      FROM fishing_logs fl
      LEFT JOIN users u ON fl.user_id = u.id
      WHERE fl.fishing_method_other IS NOT NULL AND fl.fishing_method_other != ''
      
      UNION ALL
      
      SELECT 
        CONCAT('fl_bait_', fl.id)::text as id,
        fl.user_id,
        u.username,
        u.email,
        fl.bait_other as submitted_value,
        'bait' as submission_type,
        'pending' as status,
        NULL::INTEGER as reviewed_by,
        NULL as reviewer_username,
        NULL as reviewed_at,
        fl.created_at
      FROM fishing_logs fl
      LEFT JOIN users u ON fl.user_id = u.id
      WHERE fl.bait_other IS NOT NULL AND fl.bait_other != ''
      
      ORDER BY created_at DESC
    `);

    // Get counts
    const countResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(*) as total
      FROM custom_dropdown_submissions
      
      UNION ALL
      
      SELECT
        COUNT(CASE WHEN fishing_type_other IS NOT NULL AND fishing_type_other != '' THEN 1 END) +
        COUNT(CASE WHEN fishing_method_other IS NOT NULL AND fishing_method_other != '' THEN 1 END) +
        COUNT(CASE WHEN bait_other IS NOT NULL AND bait_other != '' THEN 1 END) as pending,
        COUNT(CASE WHEN fishing_type_other IS NOT NULL AND fishing_type_other != '' THEN 1 END) +
        COUNT(CASE WHEN fishing_method_other IS NOT NULL AND fishing_method_other != '' THEN 1 END) +
        COUNT(CASE WHEN bait_other IS NOT NULL AND bait_other != '' THEN 1 END) as total
      FROM fishing_logs
    `);

    const counts = countResult.rows.reduce((acc, row) => ({
      pending: acc.pending + (parseInt(row.pending) || 0),
      total: acc.total + (parseInt(row.total) || 0)
    }), { pending: 0, total: 0 });

    res.json({ 
      submissions: result.rows,
      counts
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions', details: error.message });
  }
});

// Update submission status (approve/reject)
router.patch('/submissions/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use "approved" or "rejected"' });
    }

    const result = await pool.query(
      `UPDATE custom_dropdown_submissions 
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [status, admin_notes, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    logger.info(`Submission ${id} ${status} by admin ${req.user.id}`);
    res.json({ submission: result.rows[0], message: `Submission ${status} successfully` });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// ==================== SYSTEM LOGS ====================

// Get system logs
router.get('/system-logs', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Check if table exists
    if (!(await tableExists('system_logs'))) {
      return res.json({ logs: [], total: 0, limit: 100, offset: 0 });
    }

    const { level, limit = 100, offset = 0 } = req.query;
    let query = 'SELECT * FROM system_logs';
    const params = [];

    if (level) {
      query += ' WHERE level = $1';
      params.push(level);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    
    const countQuery = level 
      ? 'SELECT COUNT(*) FROM system_logs WHERE level = $1'
      : 'SELECT COUNT(*) FROM system_logs';
    const countResult = await pool.query(countQuery, level ? [level] : []);

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
});

// ==================== LOG FILES VIEWER ====================
const fs = require('fs');
const path = require('path');

// Get list of log files
router.get('/log-files', authMiddleware, isAdmin, async (req, res) => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    
    // Also check the project root logs folder
    const projectLogsDir = path.join(__dirname, '../../../logs');
    
    let files = [];
    
    // Try to read from both locations
    if (fs.existsSync(logsDir)) {
      const dirFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
      files = [...files, ...dirFiles];
    }
    
    if (fs.existsSync(projectLogsDir)) {
      const projectFiles = fs.readdirSync(projectLogsDir).filter(f => f.endsWith('.log'));
      files = [...files, ...projectFiles.map(f => `../logs/${f}`)];
    }

    // Add common log file names if they exist
    const commonLogs = ['combined.log', 'error.log', 'app.log', 'access.log'];
    
    // If no log files found, return sample list
    if (files.length === 0) {
      files = ['No log files found'];
    }

    res.json({ files: [...new Set(files)] });
  } catch (error) {
    console.error('Error listing log files:', error);
    res.status(500).json({ error: 'Failed to list log files', files: [] });
  }
});

// Get content of a specific log file
router.get('/log-files/:filename', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);
    
    // Security check - prevent directory traversal
    if (decodedFilename.includes('..') && !decodedFilename.startsWith('../logs/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    let logsDir = path.join(__dirname, '../../logs');
    let filePath = path.join(logsDir, decodedFilename);
    
    // Check project root logs folder if file not found
    if (!fs.existsSync(filePath)) {
      logsDir = path.join(__dirname, '../../../logs');
      filePath = path.join(logsDir, decodedFilename.replace('../logs/', ''));
    }

    if (!fs.existsSync(filePath)) {
      return res.json({ content: `Log file "${decodedFilename}" not found. Available log locations checked:\n- ${path.join(__dirname, '../../logs')}\n- ${path.join(__dirname, '../../../logs')}` });
    }

    // Read the last 1000 lines of the file (or entire file if smaller)
    const stats = fs.statSync(filePath);
    const maxBytes = 500 * 1024; // 500KB max
    
    let content;
    if (stats.size > maxBytes) {
      // Read last portion of file
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(maxBytes);
      fs.readSync(fd, buffer, 0, maxBytes, stats.size - maxBytes);
      fs.closeSync(fd);
      content = '... (showing last 500KB of file) ...\n\n' + buffer.toString('utf8');
    } else {
      content = fs.readFileSync(filePath, 'utf8');
    }

    res.json({ content, filename: decodedFilename, size: stats.size });
  } catch (error) {
    console.error('Error reading log file:', error);
    res.status(500).json({ error: 'Failed to read log file', content: '' });
  }
});

// ==================== CONTACT MESSAGES MANAGEMENT ====================

// Get all contact messages
router.get('/contact-messages', authMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM contact_messages 
      ORDER BY created_at DESC
    `);
    
    // Get stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'unread') as unread,
        COUNT(*) as total
      FROM contact_messages
    `);

    res.json({
      messages: result.rows,
      stats: statsResult.rows[0] || { unread: 0, total: 0 }
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

// Update contact message status
router.patch('/contact-messages/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE contact_messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete contact message
router.delete('/contact-messages/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM contact_messages WHERE id = $1', [id]);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
