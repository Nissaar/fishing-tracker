const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const logger = require('../config/logger');
const authMiddleware = require('../middleware/authMiddleware');
const { allLocations } = require('../data/mauritiusLocations');

const router = express.Router();

router.use(authMiddleware);

// Shared projection: event row + organiser + participant count + whether the
// requesting user has joined.
const EVENT_SELECT = `
  SELECT
    e.*,
    to_char(e.event_date, 'YYYY-MM-DD') AS event_date_text,
    u.username AS organiser_username,
    u.avatar_url AS organiser_avatar,
    COALESCE(p.participant_count, 0) AS participant_count,
    EXISTS (
      SELECT 1 FROM fishing_event_participants me
      WHERE me.event_id = e.id AND me.user_id = $1
    ) AS has_joined
  FROM fishing_events e
  JOIN users u ON u.id = e.created_by
  LEFT JOIN (
    SELECT event_id, COUNT(*)::int AS participant_count
    FROM fishing_event_participants
    GROUP BY event_id
  ) p ON p.event_id = e.id
`;

const formatEvent = (row, currentUserId) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  // Sent as plain YYYY-MM-DD: a date-only value must not shift with the
  // server's or the viewer's timezone
  eventDate: row.event_date_text,
  timeStart: row.time_start,
  timeEnd: row.time_end,
  location: row.location,
  locationName: row.location_name,
  region: row.region,
  fishingTypes: Array.isArray(row.fishing_types) ? row.fishing_types : [],
  fishingMethod: row.fishing_method,
  maxParticipants: row.max_participants,
  status: row.status,
  participantCount: Number(row.participant_count) || 0,
  hasJoined: row.has_joined === true,
  isOrganiser: row.created_by === currentUserId,
  organiser: {
    id: row.created_by,
    username: row.organiser_username,
    avatarUrl: row.organiser_avatar
  },
  createdAt: row.created_at
});

const normaliseFishingTypes = (value) => {
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(
    list
      .filter(t => typeof t === 'string' && t.trim() !== '')
      .map(t => t.trim())
  )].slice(0, 10);
};

// ==================== LIST ====================

// Upcoming events (today onwards). ?scope=mine limits to events the user
// organises or has joined; ?scope=past returns finished events.
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { scope } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    let filter = `WHERE e.status = 'open' AND e.event_date >= CURRENT_DATE`;
    let order = 'ORDER BY e.event_date ASC, e.time_start ASC NULLS LAST';

    if (scope === 'past') {
      filter = `WHERE e.event_date < CURRENT_DATE`;
      order = 'ORDER BY e.event_date DESC';
    } else if (scope === 'mine') {
      filter = `
        WHERE e.event_date >= CURRENT_DATE
          AND (
            e.created_by = $1
            OR EXISTS (
              SELECT 1 FROM fishing_event_participants fp
              WHERE fp.event_id = e.id AND fp.user_id = $1
            )
          )
      `;
    }

    const { rows } = await pool.query(
      `${EVENT_SELECT} ${filter} ${order} LIMIT ${limit}`,
      [userId]
    );

    res.json({ events: rows.map(row => formatEvent(row, userId)) });
  } catch (error) {
    logger.error(`Get events error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// ==================== DETAIL ====================

router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(`${EVENT_SELECT} WHERE e.id = $2`, [userId, req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const participants = await pool.query(
      `SELECT p.user_id, p.note, p.created_at, u.username, u.avatar_url
       FROM fishing_event_participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.event_id = $1
       ORDER BY p.created_at ASC`,
      [req.params.id]
    );

    res.json({
      event: {
        ...formatEvent(rows[0], userId),
        participants: participants.rows.map(p => ({
          userId: p.user_id,
          username: p.username,
          avatarUrl: p.avatar_url,
          note: p.note,
          joinedAt: p.created_at
        }))
      }
    });
  } catch (error) {
    logger.error(`Get event error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// ==================== CREATE ====================

const eventValidators = [
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('eventDate').isISO8601().withMessage('A valid date is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('maxParticipants').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 500 }).withMessage('Max participants must be between 1 and 500')
];

router.post('/', eventValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const {
      title, description, eventDate, timeStart, timeEnd,
      location, fishingTypes, fishingMethod, maxParticipants
    } = req.body;

    const locationObj = allLocations.find(loc => loc.id === location);
    if (!locationObj) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    // Events are for planning trips, so they cannot be created in the past
    const today = new Date().toISOString().split('T')[0];
    if (eventDate < today) {
      return res.status(400).json({ error: 'Event date cannot be in the past' });
    }

    const { rows } = await pool.query(
      `INSERT INTO fishing_events
         (created_by, title, description, event_date, time_start, time_end,
          location, location_name, region, fishing_types, fishing_method, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        userId,
        title.trim(),
        description ? description.trim() : null,
        eventDate,
        timeStart || null,
        timeEnd || null,
        locationObj.id,
        locationObj.name,
        locationObj.region,
        JSON.stringify(normaliseFishingTypes(fishingTypes)),
        fishingMethod || null,
        maxParticipants ? parseInt(maxParticipants, 10) : null
      ]
    );

    // The organiser is automatically the first participant
    await pool.query(
      `INSERT INTO fishing_event_participants (event_id, user_id)
       VALUES ($1, $2) ON CONFLICT (event_id, user_id) DO NOTHING`,
      [rows[0].id, userId]
    );

    const created = await pool.query(`${EVENT_SELECT} WHERE e.id = $2`, [userId, rows[0].id]);

    res.status(201).json({
      message: 'Event created successfully',
      event: formatEvent(created.rows[0], userId)
    });
  } catch (error) {
    logger.error(`Create event error: ${error.message}`);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ==================== UPDATE (organiser only) ====================

router.put('/:id', eventValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const {
      title, description, eventDate, timeStart, timeEnd,
      location, fishingTypes, fishingMethod, maxParticipants
    } = req.body;

    const locationObj = allLocations.find(loc => loc.id === location);
    if (!locationObj) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    const { rows } = await pool.query(
      `UPDATE fishing_events
       SET title = $3, description = $4, event_date = $5, time_start = $6, time_end = $7,
           location = $8, location_name = $9, region = $10, fishing_types = $11,
           fishing_method = $12, max_participants = $13
       WHERE id = $1 AND created_by = $2
       RETURNING id`,
      [
        req.params.id,
        userId,
        title.trim(),
        description ? description.trim() : null,
        eventDate,
        timeStart || null,
        timeEnd || null,
        locationObj.id,
        locationObj.name,
        locationObj.region,
        JSON.stringify(normaliseFishingTypes(fishingTypes)),
        fishingMethod || null,
        maxParticipants ? parseInt(maxParticipants, 10) : null
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or you are not the organiser' });
    }

    const updated = await pool.query(`${EVENT_SELECT} WHERE e.id = $2`, [userId, req.params.id]);
    res.json({ message: 'Event updated', event: formatEvent(updated.rows[0], userId) });
  } catch (error) {
    logger.error(`Update event error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// ==================== CANCEL / DELETE (organiser only) ====================

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM fishing_events WHERE id = $1 AND created_by = $2',
      [req.params.id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Event not found or you are not the organiser' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    logger.error(`Delete event error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ==================== JOIN / LEAVE ====================

router.post('/:id/join', async (req, res) => {
  let client;
  try {
    // Inside the try: when the pool is exhausted or the database restarts
    // this rejects, and outside it that became an unhandled rejection
    client = await pool.connect();
    const userId = req.user.id;
    const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 300) : null;

    await client.query('BEGIN');

    // Lock the event row so two concurrent joins cannot both pass the capacity check
    const { rows } = await client.query(
      'SELECT id, max_participants, status, event_date FROM fishing_events WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = rows[0];
    if (event.status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This event is no longer open' });
    }

    if (event.max_participants) {
      const { rows: countRows } = await client.query(
        'SELECT COUNT(*)::int AS count FROM fishing_event_participants WHERE event_id = $1',
        [req.params.id]
      );
      const alreadyJoined = await client.query(
        'SELECT 1 FROM fishing_event_participants WHERE event_id = $1 AND user_id = $2',
        [req.params.id, userId]
      );
      if (alreadyJoined.rowCount === 0 && countRows[0].count >= event.max_participants) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This event is full' });
      }
    }

    await client.query(
      `INSERT INTO fishing_event_participants (event_id, user_id, note)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET note = EXCLUDED.note`,
      [req.params.id, userId, note]
    );

    await client.query('COMMIT');
    res.json({ message: 'You joined this trip' });
  } catch (error) {
    // The connection may be the thing that failed; don't let ROLLBACK throw too
    if (client) await client.query('ROLLBACK').catch(() => {});
    logger.error(`Join event error: ${error.message}`);
    res.status(500).json({ error: 'Failed to join event' });
  } finally {
    if (client) client.release();
  }
});

router.delete('/:id/join', async (req, res) => {
  try {
    const userId = req.user.id;

    // The organiser stays attached to their own event
    const owned = await pool.query(
      'SELECT 1 FROM fishing_events WHERE id = $1 AND created_by = $2',
      [req.params.id, userId]
    );
    if (owned.rowCount > 0) {
      return res.status(400).json({ error: 'The organiser cannot leave their own event. Delete it instead.' });
    }

    await pool.query(
      'DELETE FROM fishing_event_participants WHERE event_id = $1 AND user_id = $2',
      [req.params.id, userId]
    );

    res.json({ message: 'You left this trip' });
  } catch (error) {
    logger.error(`Leave event error: ${error.message}`);
    res.status(500).json({ error: 'Failed to leave event' });
  }
});

module.exports = router;
