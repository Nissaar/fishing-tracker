const axios = require('axios');

async function getCurrentWeather(lat, lon) {
  try {
    // Try OpenWeatherMap first
    if (process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'your-openweather-api-key') {
      return await getOpenWeatherMapData(lat, lon);
    }
    
    // Fallback to WeatherAPI
    if (process.env.WEATHERAPI_KEY && process.env.WEATHERAPI_KEY !== 'your-weatherapi-key') {
      return await getWeatherAPIData(lat, lon);
    }
    
    // Return calculated fallback
    return getFallbackWeather();
  } catch (error) {
    console.log('Weather API unavailable, using fallback');
    return getFallbackWeather();
  }
}

async function getOpenWeatherMapData(lat, lon) {
  const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: {
      lat: lat,
      lon: lon,
      appid: process.env.OPENWEATHER_API_KEY,
      units: 'metric'
    },
    timeout: 5000
  });

  const data = response.data;

  return {
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    windDirection: data.wind.deg,
    clouds: data.clouds.all,
    description: data.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    visibility: data.visibility / 1000,
    conditions: categorizeConditions({ wind: { speed: data.wind.speed }, rain: data.rain, clouds: data.clouds }),
    source: 'OpenWeatherMap'
  };
}

async function getWeatherAPIData(lat, lon) {
  const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
    params: {
      key: process.env.WEATHERAPI_KEY,
      q: `${lat},${lon}`,
      aqi: 'no'
    },
    timeout: 5000
  });

  const data = response.data;

  return {
    temperature: data.current.temp_c,
    feelsLike: data.current.feelslike_c,
    humidity: data.current.humidity,
    windSpeed: data.current.wind_kph / 3.6,
    windDirection: data.current.wind_degree,
    description: data.current.condition.text,
    icon: `https:${data.current.condition.icon}`,
    visibility: data.current.vis_km,
    conditions: categorizeConditions({ wind: { speed: data.current.wind_kph / 3.6 }, clouds: { all: data.current.cloud } }),
    source: 'WeatherAPI.com'
  };
}

function getFallbackWeather() {
  return {
    temperature: 26,
    feelsLike: 28,
    humidity: 75,
    windSpeed: 5,
    description: 'Typical Mauritius weather',
    conditions: { rating: 'good', advice: 'Generally good fishing conditions' },
    source: 'Default (Mauritius average)'
  };
}

function categorizeConditions(weatherData) {
  const windSpeed = weatherData.wind.speed;
  const clouds = weatherData.clouds?.all || 50;
  const rain = weatherData.rain ? weatherData.rain['3h'] || 0 : 0;
  
  let rating, advice;
  
  if (windSpeed > 10 || rain > 5) {
    rating = 'poor';
    advice = 'Not recommended - rough conditions';
  } else if (windSpeed > 6 || rain > 2 || clouds > 80) {
    rating = 'fair';
    advice = 'Moderate conditions - experienced anglers';
  } else if (windSpeed < 4 && clouds < 50) {
    rating = 'excellent';
    advice = 'Perfect fishing weather!';
  } else {
    rating = 'good';
    advice = 'Good fishing conditions';
  }
  
  return { rating, advice };
}

module.exports = { getCurrentWeather };