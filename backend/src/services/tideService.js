const axios = require('axios');
const { getTideHeight } = require('./openMeteoService');

async function getWorldTidesData(lat, lon, date) {
  try {
    // Use OpenMeteo as primary source for tide data
    return await getTideHeight(lat, lon, date);
  } catch (error) {
    console.log('Tide API error:', error.message);
    return {
      level: 'Medium',
      height: '1.1',
      description: 'Moderate conditions',
      unit: 'meters',
      source: 'Fallback'
    };
  }
}

module.exports = { getWorldTidesData };
