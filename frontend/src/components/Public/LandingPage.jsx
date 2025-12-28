import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Fish, Moon, Waves, Sun, Wind, Eye, Menu, X } from 'lucide-react';
import axios from 'axios';
import PublicNav from './PublicNav';

const LandingPage = () => {
  const [conditions, setConditions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConditions();
  }, []);

  const fetchConditions = async () => {
    try {
      // Fetch conditions for Port Louis (main location)
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/public/conditions`
      );
      setConditions(response.data);
    } catch (error) {
      console.error('Error fetching conditions:', error);
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🌊 Current Conditions in Port Louis
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : conditions ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Next {conditions.tide?.isRising ? 'High' : 'Low'}: {conditions.tide?.nextHigh?.timeString || conditions.tide?.nextLow?.timeString}
                </p>
              </div>
            </div>

            {/* Weather */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-orange-200 hover:shadow-2xl transition-shadow">
              <Sun className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Weather</h3>
              <p className="text-4xl mb-2">{conditions.weather?.icon}</p>
              <p className="text-xl font-bold text-orange-700">{conditions.weather?.temperature}°C</p>
              <p className="text-sm text-gray-600 mt-2">{conditions.weather?.description}</p>
            </div>

            {/* Wind */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-cyan-200 hover:shadow-2xl transition-shadow">
              <Wind className="w-12 h-12 text-cyan-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Wind</h3>
              <p className="text-xl font-bold text-cyan-700 mb-2">
                {conditions.weather?.windSpeed?.toFixed(1)} m/s
              </p>
              <p className="text-sm text-gray-600">
                {conditions.weather?.conditions?.advice}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600">Unable to load conditions</p>
        )}

        {/* Tide Timeline */}
        {conditions?.tide && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              📊 Tide Timeline
            </h3>
            <TideTimeline tide={conditions.tide} />
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
            © 2025 Fishing Tracker Pro. Made for Mauritius fishermen 🇲🇺
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
const TideTimeline = ({ tide }) => {
  const currentHeight = parseFloat(tide.height);
  const nextHighHeight = parseFloat(tide.nextHigh?.height || 1.8);
  const nextLowHeight = parseFloat(tide.nextLow?.height || 0.3);
  
  // Calculate position on timeline (0-100%)
  const range = nextHighHeight - nextLowHeight;
  const position = ((currentHeight - nextLowHeight) / range) * 100;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-center">
          <p className="text-xs text-gray-500">Low Tide</p>
          <p className="text-sm font-bold text-blue-600">{nextLowHeight}m</p>
          <p className="text-xs text-gray-500">{tide.nextLow?.timeString}</p>
        </div>
        <div className="flex-1 mx-8">
          <div className="relative h-8 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 h-full w-1 bg-red-500"
              style={{ left: `${Math.min(100, Math.max(0, position))}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                Now: {currentHeight}m
              </div>
            </div>
            {tide.isRising && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white">
                →
              </div>
            )}
            {!tide.isRising && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white">
                ←
              </div>
            )}
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">High Tide</p>
          <p className="text-sm font-bold text-blue-600">{nextHighHeight}m</p>
          <p className="text-xs text-gray-500">{tide.nextHigh?.timeString}</p>
        </div>
      </div>
      <p className="text-center text-sm text-gray-600">
        {tide.isRising ? '📈 Tide is rising' : '📉 Tide is falling'}
      </p>
    </div>
  );
};

export default LandingPage;