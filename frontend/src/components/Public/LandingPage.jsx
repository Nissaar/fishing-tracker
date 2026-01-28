import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Fish, Moon, Waves, Sun, Wind, Eye, Menu, X, Thermometer, ChevronLeft, ChevronRight, Activity, Sunrise, Sunset } from 'lucide-react';
import axios from 'axios';
import PublicNav from './PublicNav';

const LandingPage = () => {
  const [conditions, setConditions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchConditions(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchConditions = async (dateObj) => {
    try {
      setLoading(true);
      // Fetch conditions for Port Louis (main location). Optionally include date query param.
      const base = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/public/conditions`;
      let url = base;
      if (dateObj) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateOnly = `${yyyy}-${mm}-${dd}`;
        const ref = encodeURIComponent(dateObj.toISOString());
        url = `${base}?date=${dateOnly}&referenceTime=${ref}`;
      }
      const response = await axios.get(url);
      setConditions(response.data);
    } catch (error) {
      console.error('Error fetching conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeSelectedDate = (days) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  };

  const getFishingRating = () => {
    if (!conditions) return { rating: 'unknown', color: 'gray', text: 'Loading...' };
    
    const weather = conditions.weather?.conditions?.rating || 'good';
    const tide = conditions.tide?.trend || 'rising';
    
    if (weather === 'excellent' && tide === 'rising') {
      return { rating: 'excellent', color: 'green', text: '🎣 Excellent Fishing!' };
    } else if (weather === 'good' || weather === 'excellent') {
      return { rating: 'good', color: 'blue', text: '✅ Good Conditions' };
    } else if (weather === 'fair') {
      return { rating: 'fair', color: 'yellow', text: '⚠️ Fair Conditions' };
    } else {
      return { rating: 'poor', color: 'red', text: '❌ Poor Conditions' };
    }
  };

  const rating = getFishingRating();

  const formatNumber = (v, decimals = 1) => {
    if (v === null || v === undefined) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n)) return '—';
    return n.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <PublicNav />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <Fish className="w-20 h-20 text-blue-600 mx-auto mb-6 animate-bounce" />
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
              Fishing Tracker Pro
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-8">
              Track Your Catches in Mauritius Waters 🇲🇺
            </p>
            
            {/* Today's Fishing Rating */}
            <div className={`inline-block bg-${rating.color}-100 border-2 border-${rating.color}-300 rounded-2xl px-8 py-4 mb-8`}>
              <p className="text-3xl font-bold text-gray-800">{rating.text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Conditions */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
          🌊 Conditions in Port Louis
        </h2>

        {/* Date navigation controls (move here so date changes update all cards) */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => changeSelectedDate(-1)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-800 font-medium cursor-pointer hover:bg-gray-100"
          />

          <button
            onClick={() => changeSelectedDate(1)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : conditions ? (
          <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Moon Phase */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-200 hover:shadow-2xl transition-shadow">
              <Moon className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Moon Phase</h3>
              <p className="text-4xl mb-2">{conditions.moon?.emoji}</p>
              <p className="text-xl font-bold text-purple-700">{conditions.moon?.phase}</p>
              <p className="text-sm text-gray-600 mt-2">{conditions.moon?.illumination}% illuminated</p>
            </div>

            {/* Tide */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-200 hover:shadow-2xl transition-shadow">
              <Waves className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Tide Level</h3>
              <p className="text-4xl mb-2">{conditions.tide?.icon}</p>
              <p className="text-xl font-bold text-blue-700">{conditions.tide?.level}</p>
              <p className="text-sm text-gray-600 mt-2">{conditions.tide?.height}m - {conditions.tide?.trend}</p>
            </div>

            {/* Weather */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-orange-200 hover:shadow-2xl transition-shadow">
              <Sun className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Weather</h3>
              <p className="text-4xl mb-2">{conditions.weather?.icon}</p>
              <p className="text-xl font-bold text-orange-700">{conditions.weather?.temperature}°C</p>
              <p className="text-sm text-gray-600 mt-2">{conditions.weather?.description}</p>
            </div>

            {/* Fish Activity (Solunar) */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-200 hover:shadow-2xl transition-shadow">
              <Activity className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Fish Activity</h3>
              <div className="flex items-center gap-2 mb-3">
                {conditions.solunar?.currentActivity?.level === 'average' && (
                  <>
                    <Fish className="w-8 h-8 text-yellow-600 fill-current" />
                    <Fish className="w-8 h-8 text-yellow-600 fill-current" />
                    <Fish className="w-8 h-8 text-gray-300 fill-current" />
                  </>
                )}
                {conditions.solunar?.currentActivity?.level === 'low' && (
                  <>
                    <Fish className="w-8 h-8 text-gray-400 fill-current" />
                    <Fish className="w-8 h-8 text-gray-300 fill-current" />
                    <Fish className="w-8 h-8 text-gray-300 fill-current" />
                  </>
                )}
                {(!conditions.solunar?.currentActivity?.level || conditions.solunar?.currentActivity?.level === 'none') && (
                  <>
                    <Fish className="w-8 h-8 text-gray-300 fill-current" />
                    <Fish className="w-8 h-8 text-gray-300 fill-current" />
                    <Fish className="w-8 h-8 text-gray-300 fill-current" />
                  </>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-700 capitalize">
                {conditions.solunar?.currentActivity?.level || 'Low'} Activity
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {conditions.solunar?.currentActivity?.description || 'Based on solunar theory'}
              </p>
            </div>

          </div>

          {/* Second Row - 4 Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Sun & Moon Times */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-amber-200 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Sunrise className="w-6 h-6 text-amber-600" />
                <Sunset className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Sun & Moon</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">☀️ Sunrise:</span>
                  <span className="font-semibold text-gray-800">{conditions.solunar?.sunrise || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">🌅 Sunset:</span>
                  <span className="font-semibold text-gray-800">{conditions.solunar?.sunset || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">🌙 Moonrise:</span>
                  <span className="font-semibold text-gray-800">{conditions.solunar?.moonrise || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">🌑 Moonset:</span>
                  <span className="font-semibold text-gray-800">{conditions.solunar?.moonset || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Sea Temperature */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-200 hover:shadow-2xl transition-shadow">
              <Thermometer className="w-12 h-12 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Sea Temperature</h3>
              <p className="text-xl font-bold text-teal-700">
                {conditions.seaTemperature?.temperature}°C
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {conditions.seaTemperature?.description}
              </p>
            </div>

            {/* Wave Height */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-cyan-200 hover:shadow-2xl transition-shadow">
              <Waves className="w-12 h-12 text-cyan-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Wave Height</h3>
              <p className="text-4xl mb-2">{conditions.marine?.icon}</p>
              <p className="text-xl font-bold text-cyan-700">{conditions.marine?.waveHeight}m</p>
              <p className="text-sm text-gray-600 mt-2">{conditions.marine?.condition}</p>
            </div>

            {/* Wind */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-cyan-200 hover:shadow-2xl transition-shadow">
              <Wind className="w-12 h-12 text-cyan-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Wind</h3>
              <p className="text-xl font-bold text-cyan-700 mb-2">
                {formatNumber(conditions.weather?.windSpeed, 1)} m/s
              </p>
              <p className="text-sm text-gray-600">
                {conditions.weather?.conditions?.advice}
              </p>
            </div>
          </div>
          </>
        ) : (
          <p className="text-center text-gray-600">Unable to load conditions</p>
        )}

        {/* Solunar Periods - Best Times to Fish */}
        {conditions?.solunar && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              🎣 The best times of day for fishing are:
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Major Periods */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">MAJOR PERIODS</h4>
                <div className="space-y-6">
                  {conditions.solunar.majorPeriods.map((period, index) => (
                    <div key={index} className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Moon className="w-8 h-8 text-yellow-900" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-lg font-bold text-yellow-900">AVERAGE ACTIVITY</p>
                            <div className="flex gap-1">
                              <Fish className="w-5 h-5 text-yellow-600 fill-current" />
                              <Fish className="w-5 h-5 text-yellow-600 fill-current" />
                              <Fish className="w-5 h-5 text-gray-300 fill-current" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">from <span className="font-bold">{period.start}h</span> to <span className="font-bold">{period.end}h</span></p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{period.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minor Periods */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">MINOR PERIODS</h4>
                <div className="space-y-6">
                  {conditions.solunar.minorPeriods.map((period, index) => (
                    <div key={index} className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center">
                          <Moon className="w-8 h-8 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-lg font-bold text-gray-700">LOW ACTIVITY</p>
                            <div className="flex gap-1">
                              <Fish className="w-5 h-5 text-gray-400 fill-current" />
                              <Fish className="w-5 h-5 text-gray-300 fill-current" />
                              <Fish className="w-5 h-5 text-gray-300 fill-current" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">from <span className="font-bold">{period.start}h</span> to <span className="font-bold">{period.end}h</span></p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{period.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tide Timeline */}
        {conditions?.tide && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              📊 Tide Timeline
            </h3>

            {/* Date navigation controls for Tide Timeline */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => changeSelectedDate(-1)}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-800 font-medium cursor-pointer hover:bg-gray-100"
              />

              <button
                onClick={() => changeSelectedDate(1)}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <TideTimeline tide={conditions.tide} solunar={conditions.solunar} />
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Tracking Your Catches</h2>
          <p className="text-xl mb-8">
            Log your fishing trips, analyze patterns, and get AI-powered predictions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Fishing Tracker Pro?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fish className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Track Every Catch</h3>
              <p className="text-gray-600">
                Log fish species, location, conditions, and more for every fishing trip
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Accurate Data</h3>
              <p className="text-gray-600">
                Real moon phases, tides, and weather specific to Mauritius waters
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">AI Predictions</h3>
              <p className="text-gray-600">
                Get insights on the best times and conditions for fishing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Fishing Tracker Pro. Made for Mauritius Anglers 🇲🇺
          </p>
          <div className="mt-4 space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/about" className="text-gray-400 hover:text-white">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Tide Timeline Component
const TideTimeline = ({ tide, solunar }) => {
  const series = Array.isArray(tide.series) ? tide.series : [];
  if (!series.length) return null;

  // map series to numeric values
  const points = series.map(s => ({
    time: s.time,
    timeString: s.timeString,
    height: parseFloat(s.height)
  }));

  const heights = points.map(p => p.height).filter(h => Number.isFinite(h));
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);

  const width = 800; const height = 180; const padding = 20;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2 - 30; // Extra space for fish activity indicators

  const n = points.length;
  const getX = (i) => padding + (i / Math.max(1, n - 1)) * plotWidth;
  const getY = (h) => padding + 30 + (1 - (h - minH) / Math.max(1e-6, (maxH - minH))) * plotHeight;

  const polyPoints = points.map((p, i) => `${getX(i)},${getY(p.height)}`).join(' ');

  // Convert time string HH:MM to x position
  const timeToX = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const dayMinutes = 24 * 60;
    const fraction = totalMinutes / dayMinutes;
    return padding + fraction * plotWidth;
  };

  // Determine 'now' position using referenceTime if available
  let nowX = null;
  if (tide.referenceTime) {
    const refMs = new Date(tide.referenceTime).getTime();
    let bestIdx = 0; let bestDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const tMs = new Date(points[i].time + '+04:00').getTime();
      const diff = Math.abs(tMs - refMs);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    nowX = getX(bestIdx);
  }

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {/* Fish Activity Indicators (at top) */}
        {solunar && (
          <>
            {/* Major Periods */}
            {solunar.majorPeriods?.map((period, idx) => {
              const startX = timeToX(period.start);
              const endX = timeToX(period.end);
              return (
                <g key={`major-${idx}`}>
                  <rect
                    x={startX}
                    y={5}
                    width={Math.max(2, endX - startX)}
                    height={20}
                    fill="#fbbf24"
                    opacity={0.6}
                    rx={2}
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#78350f"
                    fontWeight="bold"
                  >
                    🐟🐟
                  </text>
                </g>
              );
            })}
            
            {/* Minor Periods */}
            {solunar.minorPeriods?.map((period, idx) => {
              const startX = timeToX(period.start);
              const endX = timeToX(period.end);
              return (
                <g key={`minor-${idx}`}>
                  <rect
                    x={startX}
                    y={5}
                    width={Math.max(2, endX - startX)}
                    height={20}
                    fill="#d1d5db"
                    opacity={0.6}
                    rx={2}
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#374151"
                  >
                    🐟
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* grid lines */}
        {[0,0.25,0.5,0.75,1].map((g, idx) => (
          <line key={idx} x1={padding} x2={width - padding} y1={padding + 30 + g * plotHeight} y2={padding + 30 + g * plotHeight} stroke="#e6eef9" strokeWidth="1" />
        ))}

        {/* polyline tide */}
        <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={polyPoints} strokeLinecap="round" strokeLinejoin="round" />

        {/* points */}
        {points.map((p, i) => (
          <circle key={p.time} cx={getX(i)} cy={getY(p.height)} r={2} fill="#4f46e5" />
        ))}

        {/* now marker */}
        {nowX !== null && (
          <g>
            <line x1={nowX} x2={nowX} y1={padding + 30} y2={height - padding} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" />
            <rect x={nowX - 30} y={padding + 12} rx={4} ry={4} width={60} height={16} fill="#ef4444" />
            <text x={nowX} y={padding + 24} textAnchor="middle" fontSize="10" fill="#fff">Now</text>
          </g>
        )}
      {/* axis labels inside main SVG: y ticks (heights) on right and x ticks (times) on bottom */}
      {/* y ticks */}
      {[0,1,2,3,4].map((i) => {
        const g = i / 4;
        const y = padding + 30 + g * plotHeight;
        const value = (maxH - g * (maxH - minH)).toFixed(2);
        return (
          <text key={`y-${i}`} x={width - padding + 8} y={y + 4} fontSize={11} fill="#64748b">{value}m</text>
        );
      })}

      {/* x ticks - show up to ~8 labels evenly along bottom */}
      {points.map((p, i) => {
        const step = Math.max(1, Math.floor(points.length / 8));
        if (i % step !== 0) return null;
        const x = getX(i);
        return (
          <text key={`x-${p.time}`} x={x} y={height - 6} textAnchor="middle" fontSize="11" fill="#64748b">{p.timeString}</text>
        );
      })}
      </svg>
    </div>
  );
};

export default LandingPage;
