const express = require('express');
const fs = require('fs').promises;
const path = require('path');
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

const router = express.Router();

// Get list of available log files
router.get('/files', authMiddleware, isAdmin, async (req, res) => {
  try {
    const logDir = path.join(__dirname, '../../logs');
    const files = await fs.readdir(logDir);
    
    // Filter and get file stats
    const logFiles = await Promise.all(
      files
        .filter(file => file.endsWith('.log'))
        .map(async (file) => {
          const filePath = path.join(logDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            modified: stats.mtime,
            sizeFormatted: formatBytes(stats.size)
          };
        })
    );

    // Sort by modified date (newest first)
    logFiles.sort((a, b) => b.modified - a.modified);

    res.json({ files: logFiles });
  } catch (error) {
    console.error('Error reading log files:', error);
    res.status(500).json({ error: 'Failed to read log files' });
  }
});

// Get content of a specific log file
router.get('/content/:filename', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const { lines = 100, search = '' } = req.query;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const logDir = path.join(__dirname, '../../logs');
    const filePath = path.join(logDir, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Log file not found' });
    }

    // Read file content
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Parse JSON logs
    const logLines = content.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, level: 'info', timestamp: '' };
        }
      });

    // Filter by search term if provided
    let filteredLogs = logLines;
    if (search) {
      filteredLogs = logLines.filter(log => 
        JSON.stringify(log).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get last N lines
    const recentLogs = filteredLogs.slice(-parseInt(lines));

    res.json({
      filename,
      totalLines: logLines.length,
      filteredLines: filteredLogs.length,
      logs: recentLogs.reverse() // Newest first
    });
  } catch (error) {
    console.error('Error reading log file:', error);
    res.status(500).json({ error: 'Failed to read log file' });
  }
});

// Delete old log files
router.delete('/cleanup', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    const logDir = path.join(__dirname, '../../logs');
    const files = await fs.readdir(logDir);
    
    const now = Date.now();
    const cutoffTime = now - (daysOld * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffTime) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    res.json({ 
      message: `Deleted ${deletedCount} log files older than ${daysOld} days`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ error: 'Failed to cleanup logs' });
  }
});

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = router;
