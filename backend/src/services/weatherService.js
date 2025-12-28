const axios = require('axios');

function getWeatherIcon(description, isDay = true) {
  const desc = description.toLowerCase();
  
  // Weather icon mapping
  if (desc.includes('clear') || desc.includes('sunny')) {
    return isDay ? '☀️' : '🌙';
  } else if (desc.includes('partly cloudy') || desc.includes('few clouds')) {
    return isDay ? '⛅' : '🌙';
  } else if (desc.includes('cloudy') || desc.includes('overcast')) {
    return '☁️';
  } else if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
    return '🌧️';
  } else if (desc.includes('thunder') || desc.includes('storm')) {
    return '⛈️';
  } else if (desc.includes('snow')) {
    return '❄️';
  } else if (desc.includes('mist') || desc.includes('fog') || desc.includes('haze')) {
    return '🌫️';
  } else if (desc.includes('wind')) {
    return '💨';
  }
  
  return '🌤️';
}

function categorizeFishingConditions(weatherData) {
  const windSpeed = weatherData.wind.speed;
  const clouds = weatherData.clouds?.all || 50;
  const rain = weatherData.rain ? weatherData.rain['3h'] || 0 : 0;
  const description = weatherData.weather?.[0]?.description || '';
  
  let rating, advice;
  
  // More detailed conditions
  if (windSpeed > 15 || rain > 10) {
    rating = 'poor';
    advice = '❌ Not recommended - dangerous conditions';
  } else if (windSpeed > 10 || rain > 5) {
    rating = 'poor';
    advice = '⚠️ Poor conditions - stay ashore';
  } else if (windSpeed > 7 || rain > 2 || clouds > 85) {
    rating = 'fair';
    advice = '⚠️ Fair - experienced anglers only';
  } else if (windSpeed < 5 && clouds < 40 && rain === 0) {
    rating = 'excellent';
    advice = '✅ Excellent - perfect fishing weather!';
  } else {
    rating = 'good';
    advice = '✅ Good fishing conditions';
  }
  
  return { rating, advice, description };
}

async function getCurrentWeather(lat, lon) {
  try {
    // Try WeatherAPI first (best free tier)
    if (process.env.WEATHERAPI_KEY && 
        process.env.WEATHERAPI_KEY !== 'your-weatherapi-key') {
      return await getWeatherAPIData(lat, lon);
    }
    
    // Fallback to OpenWeatherMap
    if (process.env.OPENWEATHER_API_KEY && 
        process.env.OPENWEATHER_API_KEY !== 'your-openweather-api-key') {
      return await getOpenWeatherMapData(lat, lon);
    }
    
    return getFallbackWeather();
  } catch (error) {
    console.log('Weather API error:', error.message);
    return getFallbackWeather();
  }
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
  const isDay = data.current.is_day === 1;
  const description = data.current.condition.text;

  return {
    temperature: data.current.temp_c,
    feelsLike: data.current.feelslike_c,
    humidity: data.current.humidity,
    windSpeed: data.current.wind_kph / 3.6, // Convert to m/s
    windDirection: data.current.wind_degree,
    windGust: data.current.gust_kph / 3.6,
    clouds: data.current.cloud,
    description: description,
    icon: getWeatherIcon(description, isDay),
    iconUrl: `https:${data.current.condition.icon}`,
    visibility: data.current.vis_km,
    pressure: data.current.pressure_mb,
    uv: data.current.uv,
    conditions: categorizeFishingConditions({
      wind: { speed: data.current.wind_kph / 3.6 },
      clouds: { all: data.current.cloud },
      rain: data.current.precip_mm > 0 ? { '3h': data.current.precip_mm } : null,
      weather: [{ description }]
    }),
    isDay,
    source: 'WeatherAPI.com'
  };
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
  const description = data.weather[0].description;
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;

  return {
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    windDirection: data.wind.deg,
    windGust: data.wind.gust || data.wind.speed * 1.5,
    clouds: data.clouds.all,
    description: description,
    icon: getWeatherIcon(description, isDay),
    iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    visibility: data.visibility / 1000,
    conditions: categorizeFishingConditions(data),
    isDay,
    source: 'OpenWeatherMap'
  };
}

function getFallbackWeather() {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  
  return {
    temperature: 26,
    feelsLike: 28,
    humidity: 75,
    windSpeed: 5,
    windDirection: 90,
    clouds: 50,
    description: 'Typical Mauritius weather',
    icon: isDay ? '⛅' : '🌙',
    conditions: { 
      rating: 'good', 
      advice: '✅ Generally good fishing conditions',
      description: 'Typical Mauritius weather'
    },
    isDay,
    source: 'Default (Mauritius average)'
  };
}

module.exports = { getCurrentWeather };