const axios = require('axios');
const { getTideHeight } = require('./openMeteoService');

async function getWorldTidesData(lat, lon, date, referenceTime) {
  try {
    // Use OpenMeteo as primary source for tide data; allow passing a referenceTime override
    return await getTideHeight(lat, lon, date, referenceTime);
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
