const { spawn } = require('child_process');
const path = require('path');

/**
 * Service to fetch accurate sunrise, sunset, moonrise, and moonset data
 * from Meteo Mauritius website using Python meteomoris library
 */

class MeteoMauritiusService {
  constructor() {
    this.cache = {
      sunrise: null,
      moonrise: null,
      lastFetch: null
    };
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Execute Python script to get data from meteomoris
   * @param {string} command - The meteomoris command to run
   * @returns {Promise<object>}
   */
  async executePython(command) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'meteo_mauritius_scraper.py');
      const python = spawn('python3', [pythonScript, command]);

      let dataString = '';
      let errorString = '';

      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${errorString}`));
        } else {
          try {
            const result = JSON.parse(dataString);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}`));
          }
        }
      });
    });
  }

  /**
   * Get sunrise and sunset times for a specific date
   * @param {Date} date - The date to get times for
   * @returns {Promise<{sunrise: string, sunset: string}>}
   */
  async getSunriseSunset(date) {
    const now = Date.now();
    
    // Check cache
    if (this.cache.sunrise && this.cache.lastFetch && (now - this.cache.lastFetch) < this.cacheDuration) {
      return this.getSunTimesForDate(date, this.cache.sunrise);
    }

    try {
      // Fetch new data from Meteo Mauritius
      const data = await this.executePython('sunrisemu');
      this.cache.sunrise = data;
      this.cache.lastFetch = now;
      
      return this.getSunTimesForDate(date, data);
    } catch (error) {
      console.error('Failed to fetch sunrise/sunset data:', error);
      // Fallback to approximation if scraping fails
      return this.getApproximateSunTimes(date);
    }
  }

  /**
   * Get moonrise and moonset times for a specific date
   * @param {Date} date - The date to get times for
   * @returns {Promise<{moonrise: string, moonset: string}>}
   */
  async getMoonriseMoonset(date) {
    const now = Date.now();
    
    // Check cache
    if (this.cache.moonrise && this.cache.lastFetch && (now - this.cache.lastFetch) < this.cacheDuration) {
      return this.getMoonTimesForDate(date, this.cache.moonrise);
    }

    try {
      // Fetch new data from Meteo Mauritius
      const data = await this.executePython('moonrisemu');
      this.cache.moonrise = data;
      this.cache.lastFetch = now;
      
      return this.getMoonTimesForDate(date, data);
    } catch (error) {
      console.error('Failed to fetch moonrise/moonset data:', error);
      // Fallback to approximation if scraping fails
      return this.getApproximateMoonTimes(date);
    }
  }

  /**
   * Extract sun times for a specific date from cached data
   * @param {Date} date
   * @param {object} sunData - Data structure from meteomoris
   * @returns {{sunrise: string, sunset: string}}
   */
  getSunTimesForDate(date, sunData) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate());

    if (sunData[month] && sunData[month][day]) {
      return {
        sunrise: sunData[month][day].rise,
        sunset: sunData[month][day].set
      };
    }

    // Fallback
    return this.getApproximateSunTimes(date);
  }

  /**
   * Extract moon times for a specific date from cached data
   * @param {Date} date
   * @param {object} moonData - Data structure from meteomoris moonrise data
   * @returns {{moonrise: string, moonset: string}}
   */
  getMoonTimesForDate(date, moonData) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate());

    if (moonData[month] && moonData[month][day]) {
      return {
        moonrise: moonData[month][day].rise || 'N/A',
        moonset: moonData[month][day].set || 'N/A'
      };
    }

    // Fallback
    return this.getApproximateMoonTimes(date);
  }

  /**
   * Fallback: Approximate sun times (existing logic)
   */
  getApproximateSunTimes(date) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const sunriseMinutes = 5.5 * 60 + Math.sin((dayOfYear / 365) * 2 * Math.PI) * 30;
    const sunsetMinutes = 18.5 * 60 + Math.sin((dayOfYear / 365) * 2 * Math.PI) * 30;

    return {
      sunrise: this.formatTime(sunriseMinutes),
      sunset: this.formatTime(sunsetMinutes)
    };
  }

  /**
   * Fallback: Approximate moon times (existing logic)
   */
  getApproximateMoonTimes(date) {
    const daysSinceNewMoon = (Date.parse(date) - Date.parse('2000-01-06')) / (1000 * 60 * 60 * 24);
    const moonAge = (daysSinceNewMoon % 29.53058867);
    const moonRiseDelay = moonAge * 50;
    const baseRiseTime = 6 * 60;
    const moonriseMinutes = (baseRiseTime + moonRiseDelay) % (24 * 60);
    const moonsetMinutes = (moonriseMinutes + 12 * 60) % (24 * 60);

    return {
      moonrise: this.formatTime(moonriseMinutes),
      moonset: this.formatTime(moonsetMinutes)
    };
  }

  /**
   * Format minutes since midnight to HH:MM
   */
  formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Get all sun and moon times for a specific date
   * @param {Date} date
   * @returns {Promise<{sunrise, sunset, moonrise, moonset}>}
   */
  async getAllTimes(date) {
    try {
      const [sunTimes, moonTimes] = await Promise.all([
        this.getSunriseSunset(date),
        this.getMoonriseMoonset(date)
      ]);

      return {
        ...sunTimes,
        ...moonTimes
      };
    } catch (error) {
      console.error('Failed to fetch sun/moon times:', error);
      // Return approximations as fallback
      return {
        ...this.getApproximateSunTimes(date),
        ...this.getApproximateMoonTimes(date)
      };
    }
  }
}

module.exports = new MeteoMauritiusService();
