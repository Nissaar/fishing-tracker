const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const mailgun = require('mailgun-js');
const logger = require('../config/logger');

const router = express.Router();

// Initialize Mailgun (optional - only if credentials provided)
let mg;
if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
  mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  });
}

// Submit contact form (public route)
router.post(
  '/submit',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('subject').trim().isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    try {
      // Save to database
      const result = await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, status)
         VALUES ($1, $2, $3, $4, 'unread')
         RETURNING id, created_at`,
        [name, email, subject, message]
      );

      logger.info('New contact message received', {
        messageId: result.rows[0].id,
        email,
        subject
      });

      // Send email via Mailgun if configured
      if (mg && process.env.CONTACT_EMAIL) {
        const emailData = {
          from: `Fishing Tracker <noreply@${process.env.MAILGUN_DOMAIN}>`,
          to: process.env.CONTACT_EMAIL,
          subject: `Contact Form: ${subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p><em>Received at: ${new Date(result.rows[0].created_at).toLocaleString()}</em></p>
          `
        };

        mg.messages().send(emailData, (error, body) => {
          if (error) {
            logger.error('Failed to send contact email', { error: error.message });
          } else {
            logger.info('Contact email sent successfully', { messageId: body.id });
          }
        });
      }

      res.status(201).json({
        message: 'Your message has been sent successfully! We will get back to you soon.',
        messageId: result.rows[0].id
      });
    } catch (error) {
      logger.error('Error saving contact message', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }
  }
);

// Get all contact messages (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM contact_messages';
    let params = [];

    if (status && ['unread', 'read', 'replied'].includes(status)) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = status
      ? 'SELECT COUNT(*) FROM contact_messages WHERE status = $1'
      : 'SELECT COUNT(*) FROM contact_messages';
    const countResult = await pool.query(countQuery, status ? [status] : []);

    res.json({
      messages: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching contact messages', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

// Get single contact message (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM contact_messages WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read if it was unread
    if (result.rows[0].status === 'unread') {
      await pool.query(
        'UPDATE contact_messages SET status = $1 WHERE id = $2',
        ['read', id]
      );
      result.rows[0].status = 'read';
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching contact message', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Update contact message status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE contact_messages 
       SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, adminNotes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    logger.info('Contact message status updated', { messageId: id, status });

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating contact message', { error: error.message });
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete contact message (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    logger.info('Contact message deleted', { messageId: id });

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    logger.error('Error deleting contact message', { error: error.message });
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get contact message statistics (admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'unread') as unread,
        COUNT(*) FILTER (WHERE status = 'read') as read,
        COUNT(*) FILTER (WHERE status = 'replied') as replied,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days
      FROM contact_messages
    `);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching contact stats', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
