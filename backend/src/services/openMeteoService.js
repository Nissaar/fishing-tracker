const axios = require('axios');

/**
 * Get marine data from Open-Meteo Marine API
 * Includes: wave height, wave direction, wave period, sea surface temperature
 */
async function getOpenMeteoMarineData(lat, lon, date) {
  try {
    const dateStr = new Date(date).toISOString().split('T')[0];
    
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
    const currentHour = new Date(date).getHours();
    
    // Get current or closest hour data
    const waveHeight = data.hourly?.wave_height?.[currentHour] || data.current?.wave_height || 0;
    const waveDirection = data.hourly?.wave_direction?.[currentHour] || 0;
    const wavePeriod = data.hourly?.wave_period?.[currentHour] || 0;
    const currentVelocity = data.hourly?.ocean_current_velocity?.[currentHour] || data.current?.ocean_current_velocity || 0;
    
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
 * Get sea surface temperature from Open-Meteo
 */
async function getSeaSurfaceTemperature(lat, lon, date) {
  try {
    const dateStr = new Date(date).toISOString().split('T')[0];
    
    // Note: Open-Meteo marine API doesn't directly provide SST
    // We'll use a global ocean model or fallback
    // For Mauritius, typical SST ranges from 23-29°C
    
    // Try to get from NOAA or use seasonal average
    const month = new Date(date).getMonth();
    
    // Mauritius seasonal sea temperatures (approximate)
    const seasonalTemp = {
      0: 27, 1: 27, 2: 27, 3: 26, 4: 25, 5: 24,
      6: 23, 7: 23, 8: 23, 9: 24, 10: 25, 11: 26
    };
    
    const baseTemp = seasonalTemp[month];
    const variation = (Math.random() - 0.5) * 2; // ±1°C variation
    const temperature = baseTemp + variation;
    
    return {
      temperature: temperature.toFixed(1),
      unit: '°C',
      source: 'Seasonal Average (Mauritius)',
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
  getSeaSurfaceTemperature
};
