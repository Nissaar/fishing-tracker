const axios = require('axios');
const { toMauritiusParts, mauritiusToday, isValidDateStr, fromMauritiusLocal } = require('../utils/mauritiusTime');

/**
 * The Mauritius-local date and hour a request is about. Open-Meteo is asked
 * for that local day (timezone=Indian/Mauritius), so hourly arrays are
 * indexed by local hour 0-23.
 *
 * - With a reference instant (the frontend sends UTC ISO), use its local
 *   date and hour: 02:00 on the 25th is 2026-09-24T22:00Z, and taking the
 *   date from the UTC string used to fetch the 24th.
 * - With only a date, use the current hour if it is today, otherwise midday.
 */
function resolveLocalTarget(dateOrRef, referenceTime) {
  const ref = referenceTime || (typeof dateOrRef === 'string' && dateOrRef.includes('T') ? dateOrRef : null);
  if (ref) {
    const parts = toMauritiusParts(ref);
    return { dateStr: parts.dateStr, hour: parts.hour, instant: new Date(ref) };
  }

  const dateStr = isValidDateStr(dateOrRef) ? dateOrRef : mauritiusToday();
  const hour = dateStr === mauritiusToday() ? toMauritiusParts(new Date()).hour : 12;
  return { dateStr, hour, instant: fromMauritiusLocal(dateStr, `${String(hour).padStart(2, '0')}:00`) };
}

/**
 * Get marine data from Open-Meteo Marine API
 * Includes: wave height, wave direction, wave period, sea surface temperature
 */
async function getOpenMeteoMarineData(lat, lon, dateOrRef, referenceTime) {
  try {
    const { dateStr, hour: mauritiusHour } = resolveLocalTarget(dateOrRef, referenceTime);

    const response = await axios.get('https://marine-api.open-meteo.com/v1/marine', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction',
        daily: 'wave_height_max,wave_direction_dominant,wave_period_max',
        current: 'wave_height,ocean_current_velocity',
        timezone: 'Indian/Mauritius',
        start_date: dateStr,
        end_date: dateStr
      },
      timeout: 5000
    });

    const data = response.data;

    const waveHeight = data.hourly?.wave_height?.[mauritiusHour] || data.current?.wave_height || 0;
    const waveDirection = data.hourly?.wave_direction?.[mauritiusHour] || 0;
    const wavePeriod = data.hourly?.wave_period?.[mauritiusHour] || 0;
    const currentVelocity = data.hourly?.ocean_current_velocity?.[mauritiusHour] || data.current?.ocean_current_velocity || 0;
    
    // Get daily max for reference
    const maxWaveHeight = data.daily?.wave_height_max?.[0] || waveHeight;
    
    // Categorize wave conditions
    let waveCondition, waveAdvice, waveIcon;
    if (waveHeight > 3.0) {
      waveCondition = 'Very Rough';
      waveAdvice = '🚫 Dangerous - Not recommended';
      waveIcon = '🌊🌊🌊';
    } else if (waveHeight > 2.0) {
      waveCondition = 'Rough';
      waveAdvice = '⚠️ Rough seas - Experienced only';
      waveIcon = '🌊🌊';
    } else if (waveHeight > 1.0) {
      waveCondition = 'Moderate';
      waveAdvice = '✅ Moderate - Good for boats';
      waveIcon = '🌊';
    } else if (waveHeight > 0.5) {
      waveCondition = 'Calm';
      waveAdvice = '✅ Calm - Perfect conditions';
      waveIcon = '〰️';
    } else {
      waveCondition = 'Very Calm';
      waveAdvice = '✅ Excellent - Ideal fishing';
      waveIcon = '⬜';
    }
    
    return {
      waveHeight: waveHeight.toFixed(2),
      waveHeightMax: maxWaveHeight.toFixed(2),
      waveDirection,
      wavePeriod,
      currentVelocity: currentVelocity.toFixed(2),
      condition: waveCondition,
      advice: waveAdvice,
      icon: waveIcon,
      unit: 'meters',
      source: 'Open-Meteo Marine'
    };
  } catch (error) {
    console.log('Open-Meteo Marine API error:', error.message);
    return getFallbackWaveData();
  }
}

/**
 * Get hourly weather (temperature, wind) for a specific reference time using Open-Meteo Forecast API
 */
async function getWeatherForReference(lat, lon, referenceTime) {
  try {
    const { dateStr, hour: mauritiusHour } = resolveLocalTarget(null, referenceTime);

    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,windspeed_10m,winddirection_10m,precipitation,cloudcover',
        timezone: 'Indian/Mauritius',
        start_date: dateStr,
        end_date: dateStr
      },
      timeout: 5000
    });

    const data = response.data;
    const temps = data.hourly?.temperature_2m || [];
    const winds = data.hourly?.windspeed_10m || [];
    const windDirs = data.hourly?.winddirection_10m || [];
    const clouds = data.hourly?.cloudcover || [];
    const precip = data.hourly?.precipitation || [];

    const temperature = typeof temps[mauritiusHour] === 'number' ? temps[mauritiusHour] : (temps[0] || 26);
    const windSpeed = typeof winds[mauritiusHour] === 'number' ? winds[mauritiusHour] / 3.6 : (winds[0] ? winds[0] / 3.6 : 5); // convert km/h to m/s
    const windDirection = typeof windDirs[mauritiusHour] === 'number' ? windDirs[mauritiusHour] : 0;
    const cloud = typeof clouds[mauritiusHour] === 'number' ? clouds[mauritiusHour] : 50;
    const rain = typeof precip[mauritiusHour] === 'number' ? precip[mauritiusHour] : 0;

    // Simple description
    let description = 'Clear';
    if (rain > 0.5) description = 'Rain';
    else if (cloud > 70) description = 'Cloudy';
    else if (cloud > 30) description = 'Partly Cloudy';

    // Simple rating logic similar to weatherService
    let rating = 'good';
    let advice = '✅ Good fishing conditions';
    if (windSpeed > 15 || rain > 10) { rating = 'poor'; advice = '❌ Not recommended - dangerous conditions'; }
    else if (windSpeed > 10 || rain > 5) { rating = 'poor'; advice = '⚠️ Poor conditions - stay ashore'; }
    else if (windSpeed > 7 || rain > 2 || cloud > 85) { rating = 'fair'; advice = '⚠️ Fair - experienced anglers only'; }
    else if (windSpeed < 5 && cloud < 40 && rain === 0) { rating = 'excellent'; advice = '✅ Excellent - perfect fishing weather!'; }

    return {
      temperature: Number(temperature).toFixed(1),
      windSpeed: Number(windSpeed).toFixed(1),
      windDirection,
      clouds: cloud,
      description,
      icon: description === 'Rain' ? '🌧️' : cloud > 70 ? '☁️' : '☀️',
      conditions: { rating, advice, description },
      source: 'Open-Meteo Forecast'
    };
  } catch (err) {
    console.log('Open-Meteo weather error:', err.message);
    return {
      temperature: '26.0',
      windSpeed: '5.0',
      windDirection: 90,
      clouds: 50,
      description: 'Typical Mauritius weather',
      icon: '⛅',
      conditions: { rating: 'good', advice: '✅ Generally good fishing conditions', description: 'Typical Mauritius weather' },
      source: 'Default'
    };
  }
}

/**
 * Get tide height from Open-Meteo Marine API
 */
async function getTideHeight(lat, lon, date, referenceTimeOverride) {
  try {
    const { dateStr, hour: targetHour } = resolveLocalTarget(date, referenceTimeOverride);
    const response = await axios.get('https://marine-api.open-meteo.com/v1/marine', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'sea_level_height_msl',
        current: 'sea_level_height_msl',
        timezone: 'Indian/Mauritius',
        start_date: dateStr,
        end_date: dateStr
      },
      timeout: 5000
    });
    const data = response.data;

    // Helper: parse Open-Meteo time strings as Mauritius local time (GMT+4)
    function parseMauritiusTime(ts) {
      if (!ts) return null;
      // If string already has timezone info (Z or +hh:mm/-hh:mm), parse directly
      if (/Z|[+\-]\d{2}:\d{2}$/.test(ts)) return new Date(ts);
      // Append +04:00 (Mauritius) so Date parses the correct instant
      return new Date(ts + '+04:00');
    }

    const times = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
    const heights = Array.isArray(data.hourly?.sea_level_height_msl) ? data.hourly.sea_level_height_msl : [];
    const timesMs = times.map(t => {
      const d = parseMauritiusTime(t);
      return d ? d.getTime() : NaN;
    });

    // Reference time: prefer override, then API-provided current.time (Mauritius local), else use now (instant)
    const referenceTime = referenceTimeOverride ? new Date(referenceTimeOverride) : (data.current?.time ? parseMauritiusTime(data.current.time) : new Date());
    const refMs = referenceTime ? referenceTime.getTime() : Date.now();

    // Find index i such that timesMs[i] <= refMs < timesMs[i+1]
    let currentIndex = -1;
    for (let i = 0; i < timesMs.length - 1; i++) {
      if (!isNaN(timesMs[i]) && !isNaN(timesMs[i + 1]) && timesMs[i] <= refMs && refMs < timesMs[i + 1]) {
        currentIndex = i;
        break;
      }
    }
    if (currentIndex === -1 && timesMs.length) {
      // if ref before first, set to 0; if after last, set to last-1
      if (refMs < timesMs[0]) currentIndex = 0;
      else currentIndex = Math.max(0, timesMs.length - 2);
    }

    // Interpolate height at arbitrary timestamp (ms)
    function interpolateAt(targetMs) {
      if (!timesMs.length || !heights.length) return NaN;
      if (targetMs <= timesMs[0]) return heights[0];
      const lastIdx = timesMs.length - 1;
      if (targetMs >= timesMs[lastIdx]) return heights[lastIdx];
      // find bracketing index
      let idx = -1;
      for (let i = 0; i < lastIdx; i++) {
        if (timesMs[i] <= targetMs && targetMs <= timesMs[i + 1]) { idx = i; break; }
      }
      if (idx === -1) return NaN;
      const t0 = timesMs[idx], t1 = timesMs[idx + 1];
      const h0 = heights[idx], h1 = heights[idx + 1];
      if (typeof h0 !== 'number' || typeof h1 !== 'number' || t1 === t0) return isNaN(h0) ? h1 : h0;
      const ratio = (targetMs - t0) / (t1 - t0);
      return h0 + ratio * (h1 - h0);
    }

    // Compute current height
    // If referenceTimeOverride is provided, fetch the hourly value for that specific hour
    let currentHeight;
    if (referenceTimeOverride) {
      currentHeight = typeof heights[targetHour] === 'number' ? heights[targetHour] : interpolateAt(refMs);
    } else {
      // For current conditions, prefer API current value, else interpolate
      currentHeight = typeof data.current?.sea_level_height_msl === 'number'
        ? data.current.sea_level_height_msl
        : interpolateAt(refMs);
    }
    
    const { level, description } = classifyTideLevel(currentHeight, heights);
    
    // Determine if tide is rising by comparing interpolated heights (current vs +2 hours)
    let isRising = null;
    let nextHigh = null;
    let nextLow = null;
    let series = [];
    try {
      const timesArr = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
      const heightsArr = Array.isArray(data.hourly?.sea_level_height_msl) ? data.hourly.sea_level_height_msl : [];

      // Debug logging
      console.log(`Tide analysis - refMs: ${refMs}, currentIndex: ${currentIndex}, interpolatedCurrent: ${currentHeight}, points: ${heightsArr.length}`);

      const twoHoursMs = 2 * 60 * 60 * 1000;
      const futureMs = refMs + twoHoursMs;

      const currentInterpolated = Number.isFinite(currentHeight) ? currentHeight : interpolateAt(refMs);
      const futureInterpolated = interpolateAt(futureMs);

      if (typeof currentInterpolated === 'number' && !isNaN(currentInterpolated) && typeof futureInterpolated === 'number' && !isNaN(futureInterpolated)) {
        isRising = futureInterpolated > currentInterpolated;
        console.log(`Interpolated comparison: current=${currentInterpolated}, future=${futureInterpolated}, isRising=${isRising}`);
      }

      // Find next high/low in the next 24 hours using hourly points (simple scan)
      if (heightsArr.length > 0 && currentIndex >= 0) {
        let maxVal = currentInterpolated;
        let minVal = currentInterpolated;
        let maxIdx = currentIndex;
        let minIdx = currentIndex;
        const endIdx = Math.min(currentIndex + 24, heightsArr.length);
        for (let i = currentIndex + 1; i < endIdx; i++) {
          const h = heightsArr[i];
          if (typeof h === 'number') {
            if (h > maxVal) { maxVal = h; maxIdx = i; }
            if (h < minVal) { minVal = h; minIdx = i; }
          }
        }
        if (maxIdx > currentIndex) nextHigh = { time: timesArr[maxIdx], height: maxVal };
        if (minIdx > currentIndex) nextLow = { time: timesArr[minIdx], height: minVal };
      }

      // Build full-day hourly series for frontend display (time, timeString, height)
      series = [];
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const h = heights[i];
        if (typeof h === 'number' && t) {
          const dt = parseMauritiusTime(t);
          const timeString = dt
            ? dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Indian/Mauritius' })
            : t;
          series.push({ time: t, timeString, height: Number.isFinite(h) ? h.toFixed(2) : null });
        }
      }
    } catch (err) {
      console.log('Tide calculation error:', err.message);
      isRising = null;
    }

    return {
      height: Number.isFinite(currentHeight) ? currentHeight.toFixed(2) : '0.00',
      level,
      description,
      unit: 'meters',
      source: 'Open-Meteo Marine API',
      isRising: typeof isRising === 'boolean' ? isRising : null,
      trend: isRising ? 'rising' : isRising === false ? 'falling' : null,
      nextHigh: nextHigh ? {
        time: nextHigh.time,
        timeString: parseMauritiusTime(nextHigh.time)?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Indian/Mauritius' }),
        height: Number.isFinite(nextHigh.height) ? nextHigh.height.toFixed(2) : null
      } : null,
      nextLow: nextLow ? {
        time: nextLow.time,
        timeString: parseMauritiusTime(nextLow.time)?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Indian/Mauritius' }),
        height: Number.isFinite(nextLow.height) ? nextLow.height.toFixed(2) : null
      } : null,
      series: series || [],
      referenceTime: referenceTime ? referenceTime.toISOString() : null,
      referenceTimeString: referenceTime ? (referenceTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Indian/Mauritius' })) : null
    };
  } catch (error) {
    console.log('Tide height error:', error.message);
    return {
      height: null,
      level: null,
      description: 'Tide data unavailable',
      unit: 'meters',
      source: 'Default'
    };
  }
}

/**
 * Label a tide height by where it sits in that day's range. Fixed metre
 * thresholds don't work here: Open-Meteo heights for Mauritius stay between
 * roughly 0.1 m and 1.1 m, so the old "> 1.5 m = High" could never happen.
 * Levels are relative to the day, not comparable in metres across days.
 */
function classifyTideLevel(height, dayHeights) {
  const valid = dayHeights.filter(h => typeof h === 'number' && Number.isFinite(h));
  if (!Number.isFinite(height) || valid.length === 0) {
    return { level: null, description: 'Tide data unavailable' };
  }
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const position = max > min ? (height - min) / (max - min) : 0.5;

  if (position >= 0.75) return { level: 'High', description: 'High tide - excellent for shore fishing' };
  if (position >= 0.5) return { level: 'Medium-High', description: 'Upper tide - active feeding period' };
  if (position >= 0.25) return { level: 'Medium', description: 'Moderate conditions' };
  return { level: 'Low', description: 'Low tide - reef fishing favorable' };
}

/**
 * Get sea surface temperature from Open-Meteo Marine API
 */
async function getSeaSurfaceTemperature(lat, lon, dateOrRef, referenceTime) {
  try {
    // Ask for the requested local day; without a date the API returned today's
    // value even for trips logged in the past
    const { dateStr, hour } = resolveLocalTarget(dateOrRef, referenceTime);

    const response = await axios.get('https://marine-api.open-meteo.com/v1/marine', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'sea_surface_temperature',
        timezone: 'Indian/Mauritius',
        start_date: dateStr,
        end_date: dateStr
      },
      timeout: 5000
    });

    const hourlyValue = response.data.hourly?.sea_surface_temperature?.[hour];
    const temperature = typeof hourlyValue === 'number' ? hourlyValue : 26;
    
    return {
      temperature: temperature.toFixed(1),
      unit: '°C',
      source: 'Open-Meteo Marine API',
      description: getTemperatureDescription(temperature)
    };
  } catch (error) {
    console.log('Sea temperature error:', error.message);
    return {
      temperature: '26.0',
      unit: '°C',
      source: 'Default',
      description: 'Typical for Mauritius'
    };
  }
}

function getTemperatureDescription(temp) {
  if (temp >= 28) return 'Warm - Great for fishing';
  if (temp >= 25) return 'Comfortable - Good conditions';
  if (temp >= 22) return 'Cool - Active fish';
  return 'Cold - Less active';
}

function getFallbackWaveData() {
  return {
    waveHeight: '1.2',
    waveHeightMax: '1.5',
    condition: 'Moderate',
    advice: '✅ Generally good conditions',
    icon: '🌊',
    unit: 'meters',
    source: 'Estimated'
  };
}

module.exports = {
  getOpenMeteoMarineData,
  getSeaSurfaceTemperature,
  getTideHeight,
  getWeatherForReference
};
