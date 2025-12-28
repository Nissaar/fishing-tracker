const express = require('express');
const { calculateMoonPhase } = require('../utils/moonPhase');
const { getMauritiusTides } = require('../services/mauritiusTideService');
const { getCurrentWeather } = require('../services/weatherService');

const router = express.Router();

// Public endpoint for current conditions (no auth required)
router.get('/conditions', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Port Louis coordinates
    const lat = -20.1609;
    const lon = 57.5012;
    
    const [moonData, tideData, weatherData] = await Promise.all([
      Promise.resolve(calculateMoonPhase(today)),
      getMauritiusTides(today),
      getCurrentWeather(lat, lon)
    ]);
    
    res.json({
      moon: moonData,
      tide: tideData,
      weather: weatherData,
      location: {
        name: 'Port Louis',
        lat,
        lon
      }
    });
  } catch (error) {
    console.error('Public conditions error:', error);
    res.status(500).json({ error: 'Failed to get conditions' });
  }
});

module.exports = router;