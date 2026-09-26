/**
 * Solunar Theory Implementation
 * Based on John Alden Knight's solunar theory for predicting animal activity
 * Major periods occur when moon is overhead (transit) or underfoot (opposing transit)
 * Minor periods occur at moonrise and moonset
 * 
 * Updated to use accurate data from Meteo Mauritius when available
 */

const meteoMauritiusService = require('../services/meteoMauritiusService');

const DAY_MINUTES = 24 * 60;

// Keep minutes within one day, so a period around 00:20 becomes 23:20-01:20
// rather than being clipped to 00:00-01:20
const wrapMinutes = (minutes) => ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// True when a time falls in a period, including periods that cross midnight
const isWithinPeriod = (minutes, startStr, endStr) => {
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);
  return start <= end
    ? minutes >= start && minutes <= end
    : minutes >= start || minutes <= end;
};

async function calculateSolunarPeriods(dateStr, latitude, longitude) {
  const date = new Date(dateStr);
  
  // Calculate Julian Date
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + 
           Math.floor(y / 400) - 32045;
  
  jd = jd + (hour - 12) / 24 + minute / 1440;
  
  // Calculate moon age (days since new moon)
  const daysSince = jd - 2451550.1;
  const newMoons = daysSince / 29.53058867;
  const moonAge = (newMoons % 1) * 29.53058867;
  
  // Try to get accurate times from Meteo Mauritius
  let sunriseSunset, moonriseMoonset;
  try {
    const times = await meteoMauritiusService.getAllTimes(date);
    sunriseSunset = { sunrise: times.sunrise, sunset: times.sunset };
    moonriseMoonset = { moonrise: times.moonrise, moonset: times.moonset };
  } catch (error) {
    console.error('Failed to fetch Meteo Mauritius data, using approximations:', error);
    // Fallback to approximations
    sunriseSunset = getApproximateSunTimes(date, jd);
    moonriseMoonset = getApproximateMoonTimes(moonAge);
  }
  
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  const moonriseMinutes = timeToMinutes(moonriseMoonset.moonrise);
  const moonsetMinutes = timeToMinutes(moonriseMoonset.moonset);
  
  // Moon transit (overhead) is halfway between moonrise and moonset. The moon
  // is up for about 11 to 13.5 hours here, so the old "moonrise + 6h" was off
  // by up to 45 minutes. A set earlier than the rise is on the next day.
  const moonUpMinutes = wrapMinutes(moonsetMinutes - moonriseMinutes);
  const transitMinutes = wrapMinutes(moonriseMinutes + moonUpMinutes / 2);
  const opposingTransitMinutes = wrapMinutes(transitMinutes + 12 * 60);
  
  // Major periods: 2 hours centered on moon transit and opposing transit
  const major1Start = formatTime(wrapMinutes(transitMinutes - 60));
  const major1End = formatTime(wrapMinutes(transitMinutes + 60));
  
  const major2Start = formatTime(wrapMinutes(opposingTransitMinutes - 60));
  const major2End = formatTime(wrapMinutes(opposingTransitMinutes + 60));
  
  // Minor periods: 1 hour centered on moonrise and moonset
  const minor1Start = formatTime(wrapMinutes(moonriseMinutes - 30));
  const minor1End = formatTime(wrapMinutes(moonriseMinutes + 30));
  
  const minor2Start = formatTime(wrapMinutes(moonsetMinutes - 30));
  const minor2End = formatTime(wrapMinutes(moonsetMinutes + 30));
  
  // Calculate moon illumination for rating
  const illumination = Math.round((1 - Math.cos((newMoons % 1) * 2 * Math.PI)) * 50 * 10) / 10;
  
  // Rating based on moon phase (full moon and new moon are best)
  let rating;
  if (illumination > 90 || illumination < 10) {
    rating = 'best'; // Full or new moon
  } else if (illumination > 75 || illumination < 25) {
    rating = 'good';
  } else {
    rating = 'average';
  }
  
  /**
   * Calculate activity level based on multiple factors:
   * - Period type (major = more weight, minor = less weight)
   * - Moon phase (full/new moon = best)
   * - Time of day (dawn/dusk periods get bonus)
   */
  const calculateActivityLevel = (periodType, periodStartMinutes) => {
    let score = 0;
    
    // Base score for period type
    if (periodType === 'major') {
      score += 2; // Major periods start with 2 points
    } else {
      score += 1; // Minor periods start with 1 point
    }
    
    // Moon phase bonus (full moon or new moon)
    if (illumination > 90 || illumination < 10) {
      score += 1; // Full or new moon adds 1 point
    } else if (illumination > 75 || illumination < 25) {
      score += 0.5; // Nearly full/new adds 0.5 point
    }
    
    // Dawn/dusk bonus (if period overlaps with sunrise/sunset ±1 hour)
    const sunriseMinutes = timeToMinutes(sunriseSunset.sunrise);
    const sunsetMinutes = timeToMinutes(sunriseSunset.sunset);
    const dawnStart = Math.max(0, sunriseMinutes - 60);
    const dawnEnd = sunriseMinutes + 60;
    const duskStart = Math.max(0, sunsetMinutes - 60);
    const duskEnd = sunsetMinutes + 60;
    
    if ((periodStartMinutes >= dawnStart && periodStartMinutes <= dawnEnd) ||
        (periodStartMinutes >= duskStart && periodStartMinutes <= duskEnd)) {
      score += 0.5; // Dawn/dusk adds 0.5 point
    }
    
    // Convert score to activity level
    // High: 3+ points, Average: 2-2.9 points, Low: 1-1.9 points, Very Low: <1 point
    if (score >= 3) return 'high';
    if (score >= 2) return 'average';
    if (score >= 1) return 'low';
    return 'very low';
  };
  
  return {
    rating,
    majorPeriods: [
      {
        start: major1Start,
        end: major1End,
        type: 'major',
        description: 'Lunar transit (moon up)',
        activity: calculateActivityLevel('major', transitMinutes)
      },
      {
        start: major2Start,
        end: major2End,
        type: 'major',
        description: 'Opposing lunar transit (moon down)',
        activity: calculateActivityLevel('major', opposingTransitMinutes)
      }
    ],
    minorPeriods: [
      {
        start: minor1Start,
        end: minor1End,
        type: 'minor',
        description: 'Moonrise',
        activity: calculateActivityLevel('minor', moonriseMinutes)
      },
      {
        start: minor2Start,
        end: minor2End,
        type: 'minor',
        description: 'Moonset',
        activity: calculateActivityLevel('minor', moonsetMinutes)
      }
    ],
    moonrise: moonriseMoonset.moonrise,
    moonset: moonriseMoonset.moonset,
    moonTransit: formatTime(transitMinutes),
    sunrise: sunriseSunset.sunrise,
    sunset: sunriseSunset.sunset,
    illumination
  };
}

/**
 * Fallback: Get approximate sun times if Meteo Mauritius is unavailable
 */
function getApproximateSunTimes(date, jd) {
  const dayOfYear = Math.floor((jd - Math.floor(jd / 365.25) * 365.25));
  const sunriseMinutes = 5.5 * 60 + Math.sin((dayOfYear / 365) * 2 * Math.PI) * 30;
  const sunsetMinutes = 18.5 * 60 + Math.sin((dayOfYear / 365) * 2 * Math.PI) * 30;
  
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  return {
    sunrise: formatTime(sunriseMinutes),
    sunset: formatTime(sunsetMinutes)
  };
}

/**
 * Fallback: Get approximate moon times if Meteo Mauritius is unavailable
 */
function getApproximateMoonTimes(moonAge) {
  const moonRiseDelay = moonAge * 50;
  const baseRiseTime = 6 * 60;
  const moonriseMinutes = (baseRiseTime + moonRiseDelay) % (24 * 60);
  const moonsetMinutes = (moonriseMinutes + 12 * 60) % (24 * 60);
  
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  return {
    moonrise: formatTime(moonriseMinutes),
    moonset: formatTime(moonsetMinutes)
  };
}

/**
 * Get current activity level based on current time and solunar periods
 */
function getCurrentActivity(solunarData, currentTime) {
  const currentMinutes = timeToMinutes(currentTime);
  
  // Check if we're in a major period
  for (const period of solunarData.majorPeriods) {
    if (isWithinPeriod(currentMinutes, period.start, period.end)) {
      return { level: period.activity, period: 'major', description: period.description };
    }
  }
  
  // Check if we're in a minor period
  for (const period of solunarData.minorPeriods) {
    if (isWithinPeriod(currentMinutes, period.start, period.end)) {
      return { level: period.activity, period: 'minor', description: period.description };
    }
  }
  
  return { level: 'very low', period: 'none', description: 'Outside peak periods' };
}

module.exports = { 
  calculateSolunarPeriods,
  getCurrentActivity
};
