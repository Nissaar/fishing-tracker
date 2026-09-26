const express = require('express');
const { calculateMoonPhase } = require('../utils/moonPhase');
const { calculateSolunarPeriods, getCurrentActivity } = require('../utils/solunarTheory');
const { getWorldTidesData } = require('../services/tideService');
const { getCurrentWeather } = require('../services/weatherService');
const { getOpenMeteoMarineData, getSeaSurfaceTemperature, getWeatherForReference } = require('../services/openMeteoService');
const { getLeaderboardSummary } = require('../services/leaderboardService');
const pool = require('../config/database');
const logger = require('../config/logger');
const { publicConditionsLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/conditions', publicConditionsLimiter, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const date = req.query.date || today;
    const referenceTime = req.query.referenceTime || null;
    const lat = -20.1609;
    const lon = 57.5012;

    // If a referenceTime is provided, use Open-Meteo hourly weather for that instant; otherwise use current weather
    const weatherPromise = referenceTime
      ? getWeatherForReference(lat, lon, referenceTime)
      : getCurrentWeather(lat, lon);

    const [moonData, tideData, weatherData, marineData, seaTemp] = await Promise.all([
      Promise.resolve(calculateMoonPhase(date)),
      getWorldTidesData(lat, lon, date, referenceTime),
      weatherPromise,
      getOpenMeteoMarineData(lat, lon, referenceTime || date),
      getSeaSurfaceTemperature(lat, lon, referenceTime || date)
    ]);
    
    // Calculate solunar periods
    const solunarData = await calculateSolunarPeriods(date, lat, lon);
    // Get current time in Mauritius timezone (UTC+4)
    const refDate = new Date(referenceTime || date);
    const mauritiusOffset = 4 * 60; // UTC+4 in minutes
    const localOffset = refDate.getTimezoneOffset();
    const mauritiusTime = new Date(refDate.getTime() + (mauritiusOffset + localOffset) * 60000);
    const currentTime = mauritiusTime.toTimeString().substring(0, 5);
    const currentActivity = getCurrentActivity(solunarData, currentTime);
    
    // Normalize tide data for frontend: add human-readable times and trend
    const tide = tideData || {};
    const now = new Date();
    if (tide.nextHigh && tide.nextHigh.time) {
      tide.nextHigh.timeString = new Date(tide.nextHigh.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (tide.nextLow && tide.nextLow.time) {
      tide.nextLow.timeString = new Date(tide.nextLow.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Prefer isRising provided by the tide service (derived from hourly data);
    // fallback to next-event ordering if not present.
    if (typeof tide.isRising === 'boolean') {
      tide.trend = tide.isRising ? 'rising' : 'falling';
    } else {
      try {
        let nextEvent = null;
        if (tide.nextHigh && tide.nextLow) {
          const highTime = new Date(tide.nextHigh.time);
          const lowTime = new Date(tide.nextLow.time);
          nextEvent = highTime < lowTime ? 'high' : 'low';
        } else if (tide.nextHigh) {
          nextEvent = 'high';
        } else if (tide.nextLow) {
          nextEvent = 'low';
        }
        tide.isRising = nextEvent === 'high';
        tide.trend = tide.isRising ? 'rising' : 'falling';
      } catch (err) {
        tide.isRising = null;
        tide.trend = null;
      }
    }

    res.json({
      moon: moonData,
      tide,
      weather: weatherData,
      marine: marineData,
      seaTemperature: seaTemp,
      solunar: { ...solunarData, currentActivity },
      location: { name: 'Port Louis', lat, lon }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get conditions' });
  }
});

// ==================== COMMUNITY LEADERBOARD TEASER (public) ====================

// Counts only. The ranked names live behind auth at GET /api/fishing/leaderboard,
// so signed-out visitors can see that the community is active without the
// standings being readable from a URL.
router.get('/leaderboard/summary', async (req, res) => {
  try {
    const data = await getLeaderboardSummary(req.query.period || 'week');
    res.json(data);
  } catch (error) {
    logger.error(`Leaderboard summary error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get leaderboard summary' });
  }
});

// ==================== UPCOMING EVENTS TEASER (public) ====================

// Public visitors get a deliberately partial view: date, region and fishing
// types only. Exact spot, organiser and joining require an account.
router.get('/events/upcoming', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const { rows } = await pool.query(
      `SELECT
         e.id,
         to_char(e.event_date, 'YYYY-MM-DD') AS event_date,
         e.time_start,
         e.region,
         e.fishing_types,
         e.fishing_method,
         COALESCE(p.participant_count, 0) AS participant_count
       FROM fishing_events e
       LEFT JOIN (
         SELECT event_id, COUNT(*)::int AS participant_count
         FROM fishing_event_participants
         GROUP BY event_id
       ) p ON p.event_id = e.id
       WHERE e.status = 'open' AND e.event_date >= CURRENT_DATE
       ORDER BY e.event_date ASC, e.time_start ASC NULLS LAST
       LIMIT $1`,
      [limit]
    );

    const totals = await pool.query(
      `SELECT
         COUNT(*)::int AS upcoming_total,
         COUNT(*) FILTER (WHERE event_date <= CURRENT_DATE + 7)::int AS next_seven_days
       FROM fishing_events
       WHERE status = 'open' AND event_date >= CURRENT_DATE`
    );

    res.json({
      upcomingTotal: totals.rows[0].upcoming_total,
      nextSevenDays: totals.rows[0].next_seven_days,
      events: rows.map(row => ({
        id: row.id,
        eventDate: row.event_date,
        timeStart: row.time_start,
        region: row.region || 'Mauritius',
        fishingTypes: Array.isArray(row.fishing_types) ? row.fishing_types : [],
        fishingMethod: row.fishing_method,
        participantCount: Number(row.participant_count) || 0
      }))
    });
  } catch (error) {
    logger.error(`Public events teaser error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get upcoming events' });
  }
});

module.exports = router;
