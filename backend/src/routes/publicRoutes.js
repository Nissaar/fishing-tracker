const express = require('express');
const { calculateMoonPhase } = require('../utils/moonPhase');
const { getWorldTidesData } = require('../services/tideService');
const { getCurrentWeather } = require('../services/weatherService');
const { getOpenMeteoMarineData, getSeaSurfaceTemperature, getWeatherForReference } = require('../services/openMeteoService');

const router = express.Router();

router.get('/conditions', async (req, res) => {
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
      location: { name: 'Port Louis', lat, lon }
    });
  } catch (error) {
    console.error('Public conditions error:', error);
    res.status(500).json({ error: 'Failed to get conditions' });
  }
});

module.exports = router;