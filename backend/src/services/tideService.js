const axios = require('axios');
const { getMauritiusTides } = require('./mauritiusTideService');

async function getWorldTidesData(lat, lon, date) {
  try {
    // First try Mauritius-specific tides
    if (lat < -19 && lat > -21 && lon > 56 && lon < 58) {
      return await getMauritiusTides(date);
    }
    
    // Then try WorldTides API if key provided
    if (process.env.WORLDTIDES_API_KEY && 
        process.env.WORLDTIDES_API_KEY !== 'your-worldtides-api-key' &&
        process.env.WORLDTIDES_API_KEY !== 'using-free-fallback-calculations') {
      
      const dateObj = new Date(date);
      const timestamp = Math.floor(dateObj.getTime() / 1000);
      
      const response = await axios.get('https://www.worldtides.info/api/v3', {
        params: {
          extremes: true,
          heights: true,
          lat: lat,
          lon: lon,
          start: timestamp,
          length: 86400,
          key: process.env.WORLDTIDES_API_KEY,
          datum: 'LAT'
        },
        timeout: 5000
      });

      // Process WorldTides response...
      return processWorldTidesResponse(response.data, timestamp);
    }
    
    // Fallback to Mauritius calculation
    return await getMauritiusTides(date);
  } catch (error) {
    console.log('Tide API error, using Mauritius calculation');
    return await getMauritiusTides(date);
  }
}

function processWorldTidesResponse(data, currentTime) {

async function getWorldTidesData(lat, lon, date) {
  try {
    if (!process.env.WORLDTIDES_API_KEY || process.env.WORLDTIDES_API_KEY === 'your-worldtides-api-key') {
      return calculateFallbackTide(date);
    }

    const dateObj = new Date(date);
    const timestamp = Math.floor(dateObj.getTime() / 1000);
    
    const response = await axios.get('https://www.worldtides.info/api/v3', {
      params: {
        extremes: true,
        heights: true,
        lat: lat,
        lon: lon,
        start: timestamp,
        length: 86400,
        key: process.env.WORLDTIDES_API_KEY,
        datum: 'LAT'
      },
      timeout: 5000
    });

    const data = response.data;
    const currentTime = timestamp;
    let currentHeight = 0;
    
    if (data.heights && data.heights.length > 0) {
      const closest = data.heights.reduce((prev, curr) => {
        return Math.abs(curr.dt - currentTime) < Math.abs(prev.dt - currentTime) ? curr : prev;
      });
      currentHeight = closest.height;
    }

    const extremes = data.extremes || [];
    const nextHigh = extremes.find(e => e.type === 'High' && e.dt > currentTime);
    const nextLow = extremes.find(e => e.type === 'Low' && e.dt > currentTime);

    let level, description;
    if (currentHeight > 1.5) {
      level = 'High';
      description = 'High tide - excellent for shore fishing';
    } else if (currentHeight > 1.0) {
      level = 'Medium-High';
      description = 'Rising tide - active feeding period';
    } else if (currentHeight > 0.5) {
      level = 'Medium';
      description = 'Moderate conditions';
    } else {
      level = 'Low';
      description = 'Low tide - reef fishing favorable';
    }

    return {
      level,
      height: currentHeight.toFixed(2),
      description,
      unit: 'meters',
      nextHigh: nextHigh ? new Date(nextHigh.dt * 1000).toISOString() : null,
      nextLow: nextLow ? new Date(nextLow.dt * 1000).toISOString() : null,
      extremes: extremes.slice(0, 4).map(e => ({
        type: e.type,
        time: new Date(e.dt * 1000).toISOString(),
        height: e.height.toFixed(2)
      })),
      source: 'WorldTides API'
    };
  } catch (error) {
    console.log('WorldTides API unavailable, using calculation');
    return calculateFallbackTide(date);
  }
}

function calculateFallbackTide(dateStr) {
  const date = new Date(dateStr);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  const time = hour + minute / 60;
  const solarComponent = Math.sin((time / 12.4) * 2 * Math.PI);
  const lunarComponent = Math.sin((dayOfYear / 29.53) * 2 * Math.PI);
  
  const tideHeight = 1.6 + (solarComponent * 0.4) + (lunarComponent * 0.3);
  
  let level, description;
  
  if (tideHeight > 1.8) {
    level = 'High';
    description = 'High tide - good for shore fishing';
  } else if (tideHeight > 1.4) {
    level = 'Medium-High';
    description = 'Rising tide - active feeding';
  } else if (tideHeight > 1.0) {
    level = 'Medium';
    description = 'Moderate conditions';
  } else {
    level = 'Low';
    description = 'Low tide - reef fishing favorable';
  }
  
  return {
    level,
    height: tideHeight.toFixed(2),
    description,
    unit: 'meters',
    source: 'Calculated (Mauritius)'
  };
}
}

module.exports = { getWorldTidesData };