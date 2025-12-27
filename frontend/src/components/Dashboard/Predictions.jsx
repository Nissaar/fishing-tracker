import React, { useState, useEffect } from 'react';
import { fishingAPI } from '../../services/api';
import { Moon, Waves, Fish, Calendar, TrendingUp, Activity } from 'lucide-react';

const Predictions = () => {
  const [logs, setLogs] = useState([]);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const response = await fishingAPI.getLogs(100);
      const logsData = response.data.logs;
      setLogs(logsData);
      generatePredictions(logsData);
    } catch (error) {
      console.error('Failed to load predictions');
    }
  };

  const generatePredictions = (logsData) => {
    const successfulTrips = logsData.filter((log) => log.caught_fish);

    if (successfulTrips.length === 0) {
      setPredictions({ message: 'Not enough data yet. Log more fishing trips!' });
      return;
    }

    const moonPhaseCount = {};
    const seaLevelCount = {};
    const baitCount = {};
    const locationCount = {};
    const monthCount = {};

    successfulTrips.forEach((log) => {
      const phase = log.moon_phase?.split(' ')[1] || 'Unknown';
      moonPhaseCount[phase] = (moonPhaseCount[phase] || 0) + log.fish_count;

      const level = log.sea_level?.split(' ')[0] || 'Unknown';
      seaLevelCount[level] = (seaLevelCount[level] || 0) + log.fish_count;

      if (log.bait) {
        baitCount[log.bait] = (baitCount[log.bait] || 0) + log.fish_count;
      }

      if (log.location_name) {
        locationCount[log.location_name] = (locationCount[log.location_name] || 0) + log.fish_count;
      }

      const month = new Date(log.log_date).toLocaleString('default', { month: 'long' });
      monthCount[month] = (monthCount[month] || 0) + log.fish_count;
    });

    const bestMoonPhase = Object.keys(moonPhaseCount).reduce((a, b) =>
      moonPhaseCount[a] > moonPhaseCount[b] ? a : b
    );
    const bestSeaLevel = Object.keys(seaLevelCount).reduce((a, b) =>
      seaLevelCount[a] > seaLevelCount[b] ? a : b
    );
    const bestBait = Object.keys(baitCount).reduce((a, b) =>
      baitCount[a] > baitCount[b] ? a : b
    );
    const bestLocation = Object.keys(locationCount).reduce((a, b) =>
      locationCount[a] > locationCount[b] ? a : b
    );
    const bestMonth = Object.keys(monthCount).reduce((a, b) =>
      monthCount[a] > monthCount[b] ? a : b
    );

    setPredictions({
      bestMoonPhase,
      bestSeaLevel,
      bestBait,
      bestLocation,
      bestMonth,
      successRate: ((successfulTrips.length / logsData.length) * 100).toFixed(1),
      totalFish: successfulTrips.reduce((sum, log) => sum + log.fish_count, 0),
      avgPerTrip: (
        successfulTrips.reduce((sum, log) => sum + log.fish_count, 0) /
        successfulTrips.length
      ).toFixed(1)
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">Fishing Predictions & Insights</h2>
        <p className="text-blue-100">
          Based on {logs.length} fishing trips in Mauritius waters
        </p>
      </div>

      {predictions && !predictions.message ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-xl border border-purple-200">
              <Moon className="w-10 h-10 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Best Moon Phase</h3>
              <p className="text-3xl font-bold text-purple-700 mb-2">
                {predictions.bestMoonPhase}
              </p>
              <p className="text-sm text-purple-600">
                Most productive fishing during this phase
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-xl border border-blue-200">
              <Waves className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Best Tide Level</h3>
              <p className="text-3xl font-bold text-blue-700 mb-2">
                {predictions.bestSeaLevel}
              </p>
              <p className="text-sm text-blue-600">Optimal tide conditions for catches</p>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl border border-green-200">
              <Fish className="w-10 h-10 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Most Effective Bait</h3>
              <p className="text-3xl font-bold text-green-700 mb-2">
                {predictions.bestBait}
              </p>
              <p className="text-sm text-green-600">Highest success rate with this bait</p>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-xl border border-orange-200">
              <Calendar className="w-10 h-10 text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Best Month</h3>
              <p className="text-3xl font-bold text-orange-700 mb-2">
                {predictions.bestMonth}
              </p>
              <p className="text-sm text-orange-600">Peak fishing season in Mauritius</p>
            </div>

            <div className="bg-gradient-to-br from-pink-100 to-pink-50 p-6 rounded-xl border border-pink-200">
              <TrendingUp className="w-10 h-10 text-pink-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Top Location</h3>
              <p className="text-3xl font-bold text-pink-700 mb-2">
                {predictions.bestLocation}
              </p>
              <p className="text-sm text-pink-600">Most productive fishing spot</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-6 rounded-xl border border-cyan-200">
              <Activity className="w-10 h-10 text-cyan-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Success Rate</h3>
              <p className="text-3xl font-bold text-cyan-700 mb-2">
                {predictions.successRate}%
              </p>
              <p className="text-sm text-cyan-600">Overall catch success rate</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📊 Performance Metrics
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Fish Caught</p>
                <p className="text-4xl font-bold text-blue-600">
                  {predictions.totalFish}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Average Per Trip</p>
                <p className="text-4xl font-bold text-green-600">
                  {predictions.avgPerTrip}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Trips</p>
                <p className="text-4xl font-bold text-purple-600">{logs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              🎯 Recommendations for Your Next Trip
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Fish during <strong>{predictions.bestMoonPhase}</strong> moon phase
                  for best results
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Target <strong>{predictions.bestSeaLevel}</strong> tide conditions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Use <strong>{predictions.bestBait}</strong> as your primary bait
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Visit <strong>{predictions.bestLocation}</strong> - your most
                  productive spot
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Plan trips during <strong>{predictions.bestMonth}</strong> for peak
                  season
                </span>
              </li>
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <Activity className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-700 text-lg">
            {predictions?.message ||
              'Start logging your fishing trips to get personalized predictions!'}
          </p>
          <p className="text-gray-600 mt-2">
            We need at least 3-5 successful trips to generate accurate predictions.
          </p>
        </div>
      )}
    </div>
  );
};

export default Predictions;