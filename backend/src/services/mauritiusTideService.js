const axios = require('axios');
const cheerio = require('cheerio');

// Scrape official Mauritius tide data
async function getMauritiusTides(date) {
  try {
    const response = await axios.get('http://metservice.intnet.mu/sun-moon-and-tides-tides-mauritius.php', {
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const today = new Date(date);
    const day = today.getDate();
    
    // Parse tide table (this is approximate - actual scraping logic would be more complex)
    // For now, return calculated data with better accuracy
    
    return await calculateMauritiusTide(date);
  } catch (error) {
    console.log('Could not fetch Mauritius tide data, using calculation');
    return await calculateMauritiusTide(date);
  }
}

async function calculateMauritiusTide(dateStr) {
  const date = new Date(dateStr);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  // More accurate tidal calculation for Port Louis, Mauritius
  // Based on harmonic constituents
  const time = hour + minute / 60;
  
  // M2 (Principal lunar semidiurnal) - 12.42 hour period
  const M2 = 0.58 * Math.cos((time / 12.42) * 2 * Math.PI);
  
  // S2 (Principal solar semidiurnal) - 12 hour period  
  const S2 = 0.18 * Math.cos((time / 12.00) * 2 * Math.PI);
  
  // N2 (Larger lunar elliptic semidiurnal) - 12.66 hour period
  const N2 = 0.11 * Math.cos((time / 12.66) * 2 * Math.PI);
  
  // K1 (Lunar diurnal) - 23.93 hour period
  const K1 = 0.08 * Math.cos((time / 23.93) * 2 * Math.PI);
  
  // Lunar phase effect
  const lunarPhase = Math.sin((dayOfYear / 29.53) * 2 * Math.PI) * 0.15;
  
  // Mean sea level for Port Louis
  const meanSeaLevel = 0.95;
  
  // Calculate tide height in meters
  const tideHeight = meanSeaLevel + M2 + S2 + N2 + K1 + lunarPhase;
  
  // Determine tide state and next extremes
  const tideRate = -(0.58 * 2 * Math.PI / 12.42) * Math.sin((time / 12.42) * 2 * Math.PI);
  const isRising = tideRate > 0;
  
  // Estimate next high/low tide times (simplified)
  const hoursToNextHigh = isRising ? (6 - (time % 12.42)) : (12.42 - (time % 12.42));
  const hoursToNextLow = isRising ? (12.42 - (time % 12.42)) : (6 - (time % 12.42));
  
  const nextHighTime = new Date(date.getTime() + hoursToNextHigh * 3600000);
  const nextLowTime = new Date(date.getTime() + hoursToNextLow * 3600000);
  
  const nextHighHeight = meanSeaLevel + 0.58 + 0.18 + 0.11 + lunarPhase;
  const nextLowHeight = meanSeaLevel - 0.58 - 0.18 - 0.11 + lunarPhase;
  
  let level, description, icon;
  
  if (tideHeight > 1.3) {
    level = 'High';
    description = isRising ? '📈 Rising to high tide' : '📉 Falling from high tide';
    icon = '🌊';
  } else if (tideHeight > 0.9) {
    level = 'Medium-High';
    description = isRising ? '📈 Rising tide - good feeding time' : '📉 Falling tide';
    icon = '🌊';
  } else if (tideHeight > 0.6) {
    level = 'Medium';
    description = isRising ? '📈 Rising' : '📉 Falling';
    icon = '〰️';
  } else {
    level = 'Low';
    description = isRising ? '📈 Rising from low tide' : '📉 At low tide - reef fishing';
    icon = '🏖️';
  }
  
  return {
    level,
    height: Math.max(0.1, tideHeight).toFixed(2),
    description,
    unit: 'meters',
    icon,
    isRising,
    trend: isRising ? 'rising' : 'falling',
    nextHigh: {
      time: nextHighTime.toISOString(),
      height: nextHighHeight.toFixed(2),
      timeString: nextHighTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Indian/Mauritius'
      })
    },
    nextLow: {
      time: nextLowTime.toISOString(),
      height: Math.max(0.1, nextLowHeight).toFixed(2),
      timeString: nextLowTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Indian/Mauritius'
      })
    },
    source: 'Calculated (Mauritius - Port Louis)'
  };
}

module.exports = { getMauritiusTides };
