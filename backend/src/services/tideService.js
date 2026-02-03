const { getTideHeight } = require('./openMeteoService');

async function getWorldTidesData(lat, lon, date, referenceTime) {
  try {
    // Use OpenMeteo as primary source for tide data
    return await getTideHeight(lat, lon, date, referenceTime);
  } catch (error) {
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
