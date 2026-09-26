const { spawn } = require('child_process');
const path = require('path');

/**
 * Service to fetch accurate sunrise, sunset, moonrise, and moonset data
 * from Meteo Mauritius website using Python meteomoris library
 */

const SCRAPE_TIMEOUT_MS = 15 * 1000;
const SUCCESS_CACHE_MS = 24 * 60 * 60 * 1000;
// While metservice is down, don't spawn two Python processes on every request
const FAILURE_CACHE_MS = 10 * 60 * 1000;

const TIME_PATTERN = /^\d{1,2}:\d{2}$/;

class MeteoMauritiusService {
  constructor() {
    // Per command: { data, fetchedAt, failedAt, inFlight }
    this.cache = {};
  }

  /**
   * Execute Python script to get data from meteomoris
   * @param {string} command - The meteomoris command to run
   * @returns {Promise<object>}
   */
  executePython(command) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'meteo_mauritius_scraper.py');
      const python = spawn('python3', [pythonScript, command]);

      let dataString = '';
      let errorString = '';
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      };

      // A hung scrape would otherwise hold the request open forever
      const timer = setTimeout(() => {
        python.kill('SIGKILL');
        finish(reject, new Error(`Python script timed out after ${SCRAPE_TIMEOUT_MS / 1000}s`));
      }, SCRAPE_TIMEOUT_MS);

      // Without this, a missing python3 binary emits an unhandled 'error'
      // event and takes the whole API down
      python.on('error', (error) => finish(reject, new Error(`Could not start Python: ${error.message}`)));

      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          finish(reject, new Error(`Python script failed: ${errorString}`));
          return;
        }
        try {
          finish(resolve, JSON.parse(dataString));
        } catch (error) {
          finish(reject, new Error(`Failed to parse Python output: ${error.message}`));
        }
      });
    });
  }

  /**
   * Scrape once per day per command, share one in-flight scrape between
   * concurrent requests, and back off after a failure. Resolves to null when
   * no data is available so callers fall back to approximations.
   */
  async getScrapedData(command) {
    const entry = this.cache[command] || (this.cache[command] = {});
    const now = Date.now();

    if (entry.data && now - entry.fetchedAt < SUCCESS_CACHE_MS) return entry.data;
    if (entry.failedAt && now - entry.failedAt < FAILURE_CACHE_MS) return null;
    if (entry.inFlight) return entry.inFlight;

    entry.inFlight = this.executePython(command)
      .then((data) => {
        // An empty result is a failed scrape, not a day's worth of data
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
          throw new Error('Scraper returned no data');
        }
        Object.assign(entry, { data, fetchedAt: Date.now(), failedAt: null });
        return data;
      })
      .catch((error) => {
        console.error(`Failed to fetch ${command} data:`, error.message);
        entry.failedAt = Date.now();
        return null;
      })
      .finally(() => {
        entry.inFlight = null;
      });

    return entry.inFlight;
  }

  /**
   * Get sunrise and sunset times for a specific date
   * @param {Date} date - The date to get times for
   * @returns {Promise<{sunrise: string, sunset: string}>}
   */
  async getSunriseSunset(date) {
    const data = await this.getScrapedData('sunrisemu');
    return data ? this.getSunTimesForDate(date, data) : this.getApproximateSunTimes(date);
  }

  /**
   * Get moonrise and moonset times for a specific date
   * @param {Date} date - The date to get times for
   * @returns {Promise<{moonrise: string, moonset: string}>}
   */
  async getMoonriseMoonset(date) {
    const data = await this.getScrapedData('moonrisemu');
    return data ? this.getMoonTimesForDate(date, data) : this.getApproximateMoonTimes(date);
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
      // A few days a month the moon doesn't rise or set; the scraper reports
      // 'N/A' then, which turned solunar periods into "NaN:NaN". Fall back to
      // the approximation for just that field.
      const { rise, set } = moonData[month][day];
      const approx = (TIME_PATTERN.test(rise) && TIME_PATTERN.test(set)) ? null : this.getApproximateMoonTimes(date);
      return {
        moonrise: TIME_PATTERN.test(rise) ? rise : approx.moonrise,
        moonset: TIME_PATTERN.test(set) ? set : approx.moonset
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
