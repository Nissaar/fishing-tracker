import React from 'react';
import { Link } from 'react-router-dom';
import PublicNav from './PublicNav';
import { Database, Cloud, Moon, Waves, Wind, Fish, Sun, Thermometer, Activity, GitBranch } from 'lucide-react';

const DataSources = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <PublicNav />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Data Sources & Calculations</h1>
          <p className="text-lg text-gray-600">
            Learn how we collect, calculate, and present fishing conditions data
          </p>
        </div>

        {/* Moon Phase */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Moon Phase & Illumination</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>Calculation Method:</strong> Julian Date astronomical calculations</p>
            <p><strong>Formula:</strong> Phase illumination = (1 - cos(phase × 2π)) × 50</p>
            <p><strong>Accuracy:</strong> ±1% compared to official sources</p>
            <p className="text-sm text-gray-600">
              We calculate the moon's current phase and illumination percentage using the Julian Date system, 
              which tracks days since January 1, 4713 BC. The lunar cycle of 29.53 days is used to determine 
              the current moon phase (New, Waxing Crescent, First Quarter, Waxing Gibbous, Full, Waning Gibbous, 
              Last Quarter, Waning Crescent).
            </p>
          </div>
        </div>

        {/* Tide Data */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <Waves className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tide Levels & Timeline</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>API Source:</strong> Open-Meteo Marine API</p>
            <p><strong>Data Point:</strong> Sea Level Height (MSL - Mean Sea Level)</p>
            <p><strong>Update Frequency:</strong> Hourly data points with real-time interpolation</p>
            <p><strong>Coverage:</strong> Global coverage including all Mauritius coastal locations</p>
            <div className="bg-blue-50 p-4 rounded-lg mt-3">
              <p className="font-semibold mb-2">Tide Timeline Features:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>24-hour tide predictions with smooth interpolation between hourly data points</li>
                <li>Fish activity overlay based on solunar periods</li>
                <li>High/Low tide detection from sea level height data</li>
                <li>Current tide level indicator with real-time updates</li>
                <li>Timezone conversion for accurate Mauritius local times (UTC+4)</li>
              </ul>
            </div>
            <div className="mt-4">
              <p className="font-semibold mb-1">API Documentation:</p>
              <a 
                href="https://open-meteo.com/en/docs/marine-weather-api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                Open-Meteo Marine API - Sea Level Height <GitBranch className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Weather Data */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-8 h-8 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Weather Conditions</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>API Source:</strong> Open-Meteo Weather API</p>
            <p><strong>Data Points:</strong> Temperature, Wind Speed, Weather Codes</p>
            <p><strong>Update Frequency:</strong> Hourly forecasts</p>
            <p><strong>Resolution:</strong> High-resolution weather models (ECMWF, GFS)</p>
            <div className="bg-orange-50 p-4 rounded-lg mt-3">
              <p className="text-sm">
                Open-Meteo is a free, open-source weather API that aggregates data from national 
                weather services worldwide. It provides high-accuracy forecasts without requiring 
                API keys or registration.
              </p>
            </div>
            <div className="mt-4">
              <p className="font-semibold mb-1">API Documentation:</p>
              <a 
                href="https://open-meteo.com/en/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                Open-Meteo API Docs <GitBranch className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Fish Activity - Solunar Theory */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-4">
            <Fish className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Fish Activity Predictions</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>Theory:</strong> Solunar Theory by John Alden Knight (1926)</p>
            <p><strong>Calculation Method:</strong> Multi-factor scoring system</p>
            <p><strong>Activity Levels:</strong> High (🐟🐟🐟), Average (🐟🐟), Low (🐟), Very Low (no activity)</p>
            <div className="bg-green-50 p-4 rounded-lg mt-3">
              <p className="font-semibold mb-2">How Fish Activity is Calculated:</p>
              <p className="text-sm mb-3">
                Fish activity isn't just about major vs minor periods. We use a sophisticated scoring 
                system that combines multiple factors:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Period Type:</strong> Major periods (lunar transit) start with 2 points, 
                minor periods (moonrise/moonset) start with 1 point</li>
                <li><strong>Moon Phase Bonus:</strong> Full moon or new moon adds +1 point (best tidal movement), 
                nearly full/new adds +0.5 points</li>
                <li><strong>Dawn/Dusk Bonus:</strong> Periods overlapping sunrise/sunset ±1 hour add +0.5 points 
                (fish are most active during twilight)</li>
              </ul>
              <p className="text-sm mt-3 font-semibold">Scoring Results:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>High (3+ points):</strong> Major period + full/new moon + dawn/dusk = optimal conditions</li>
                <li><strong>Average (2-2.9 points):</strong> Major period alone, or minor period with moon bonus</li>
                <li><strong>Low (1-1.9 points):</strong> Minor periods without significant bonuses</li>
                <li><strong>Very Low (&lt;1 point):</strong> Outside all solunar periods</li>
              </ul>
              <p className="text-sm mt-3 italic text-gray-600">
                This means a minor period during a full moon at dawn could rate as "High", while a 
                major period during a quarter moon might only be "Average".
              </p>
            </div>
              <p className="font-semibold mb-2">How Solunar Theory Works:</p>
              <p className="text-sm mb-3">
                Solunar theory suggests that fish and wildlife are most active during specific 
                periods related to the moon's position. These periods occur daily:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Major Periods (2 hours):</strong> When the moon is directly overhead (lunar transit) 
                or underfoot (opposing transit). These are the best times for fishing.</li>
                <li><strong>Minor Periods (1 hour):</strong> During moonrise and moonset. 
                These offer moderate fishing opportunities.</li>
              </ul>
              <p className="text-sm mt-3">
                The theory also considers moon phase, with full and new moons creating stronger 
                tidal movements and increased fish activity.
              </p>
            </div>
            <div className="mt-4">
              <p className="font-semibold mb-1">Learn More:</p>
              <a 
                href="https://en.wikipedia.org/wiki/Solunar_theory" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                Solunar Theory - Wikipedia <GitBranch className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Sun & Moon Times */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-8 h-8 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-900">Sunrise, Sunset, Moonrise, Moonset</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>Primary Source:</strong> Meteo Mauritius Official Data (via web scraping)</p>
            <p><strong>Library:</strong> meteomoris Python library</p>
            <p><strong>Fallback:</strong> Astronomical calculations based on latitude/longitude</p>
            <p><strong>Update Frequency:</strong> Monthly (cached for 24 hours)</p>
            <div className="bg-amber-50 p-4 rounded-lg mt-3">
              <p className="text-sm mb-2">
                We fetch official sunrise, sunset, moonrise, and moonset times from the 
                Mauritius Meteorological Services website. The data is scraped using the 
                meteomoris library and cached locally to minimize server load.
              </p>
              <p className="text-sm">
                If the official source is unavailable, we fall back to astronomical calculations 
                using Julian Date formulas, which provide accuracy within ±15 minutes.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <p className="font-semibold mb-1">Data Source:</p>
                <a 
                  href="https://metservice.intnet.mu/sun-moon-and-tides-sunrise-sunset-mauritius.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  Meteo Mauritius - Sunrise/Sunset <GitBranch className="w-4 h-4" />
                </a>
              </div>
              <div>
                <p className="font-semibold mb-1">Library Used:</p>
                <a 
                  href="https://github.com/Abdur-rahmaanJ/meteomoris" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  meteomoris - GitHub Repository <GitBranch className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sea Temperature */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-teal-500">
          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="w-8 h-8 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Sea Surface Temperature</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>API Source:</strong> Open-Meteo Marine API</p>
            <p><strong>Data Provider:</strong> NOAA and Copernicus Marine Service</p>
            <p><strong>Update Frequency:</strong> Daily updates</p>
            <p><strong>Resolution:</strong> 0.083° (~9km grid)</p>
            <div className="bg-teal-50 p-4 rounded-lg mt-3">
              <p className="text-sm">
                Sea surface temperature data comes from satellite observations and ocean buoys. 
                Temperature significantly affects fish behavior, with most species preferring 
                specific temperature ranges.
              </p>
            </div>
            <div className="mt-4">
              <p className="font-semibold mb-1">API Documentation:</p>
              <a 
                href="https://open-meteo.com/en/docs/marine-weather-api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                Open-Meteo Marine API <GitBranch className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Wave Height & Wind */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-cyan-500">
          <div className="flex items-center gap-3 mb-4">
            <Wind className="w-8 h-8 text-cyan-600" />
            <h2 className="text-2xl font-bold text-gray-900">Wave Height & Wind Conditions</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>API Source:</strong> Open-Meteo Marine & Weather APIs</p>
            <p><strong>Wave Data:</strong> Significant wave height from wave models</p>
            <p><strong>Wind Data:</strong> 10m wind speed and direction</p>
            <p><strong>Update Frequency:</strong> Hourly forecasts</p>
            <div className="bg-cyan-50 p-4 rounded-lg mt-3">
              <p className="text-sm mb-2">
                Wave height and wind conditions are critical for fishing safety and success. 
                Our data includes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Significant wave height (average of highest 1/3 of waves)</li>
                <li>Wind speed at 10 meters above sea level</li>
                <li>Wind direction and gusts</li>
                <li>Safety recommendations based on conditions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 mb-8 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Technical Implementation</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>Backend:</strong> Node.js with Express</p>
            <p><strong>Database:</strong> PostgreSQL</p>
            <p><strong>Caching:</strong> In-memory cache with 24-hour expiration</p>
            <p><strong>Data Processing:</strong> Real-time calculations and API aggregation</p>
            <div className="bg-white p-4 rounded-lg mt-3">
              <p className="font-semibold mb-2">Architecture:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Python microservice for Meteo Mauritius data scraping (Docker container)</li>
                <li>RESTful API endpoints for frontend data consumption</li>
                <li>Automatic fallback mechanisms when external APIs are unavailable</li>
                <li>Timezone conversion for accurate Mauritius local times (UTC+4)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Credits & Acknowledgments */}
        <div className="bg-gray-900 text-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Credits & Acknowledgments</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Data Providers</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• <a href="http://metservice.intnet.mu" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Mauritius Meteorological Services</a> - Official weather, tide, and astronomical data</li>
                <li>• <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Open-Meteo</a> - Free weather and marine API</li>
                <li>• NOAA - Sea surface temperature satellite data</li>
                <li>• Copernicus Marine Service - Ocean data products</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Open Source Libraries</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• <a href="https://github.com/Abdur-rahmaanJ/meteomoris" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">meteomoris</a> by Abdur-rahmaanJ - Meteo Mauritius data scraper</li>
                <li>• React.js - Frontend framework</li>
                <li>• Node.js & Express - Backend server</li>
                <li>• PostgreSQL - Database</li>
                <li>• Tailwind CSS - UI styling</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Scientific References</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• John Alden Knight - Solunar Theory (1926)</li>
                <li>• Astronomical Algorithms by Jean Meeus</li>
                <li>• NOAA Tide Predictions Methodology</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link 
            to="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DataSources;
