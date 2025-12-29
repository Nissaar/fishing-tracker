import React, { useState, useEffect } from 'react';
import { fishingAPI } from '../../services/api';
import axios from 'axios';
import { Moon, Waves, Fish, Calendar, TrendingUp, Activity, Users } from 'lucide-react';

const Predictions = () => {
  const [predictions, setPredictions] = useState(null);
  const [todayConditions, setTodayConditions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [predResponse, condResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/fishing/global-predictions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/public/conditions`)
      ]);
      
      setPredictions(predResponse.data);
      setTodayConditions(condResponse.data);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const compareWithToday = (best, today) => {
    if (!today) return 'unknown';
    const bestLower = best.toLowerCase();
    const todayLower = today.toLowerCase();
    
    if (todayLower.includes(bestLower) || bestLower.includes(todayLower)) {
      return 'match';
    }
    return 'different';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Community Fishing Insights</h2>
        </div>
        <p className="text-blue-100">
          {predictions?.message || 'Based on community data from all fishermen'}
        </p>
      </div>

      {/* Today vs Best Conditions */}
      {todayConditions && predictions?.predictions && (
        <div className="bg-white p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🎯 Today's Conditions vs Best Conditions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Today */}
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-gray-700 border-b pb-2">Today</h4>
              
              <div className="flex items-center gap-3">
                <Moon className="w-6 h-6 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Moon Phase</p>
                  <p className="font-bold text-gray-800">
                    {todayConditions.moon.emoji} {todayConditions.moon.phase}
                  </p>
                </div>
                {compareWithToday(predictions.predictions.bestMoonPhase, todayConditions.moon.phase) === 'match' && (
                  <span className="text-green-600 font-bold">✓ BEST</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Waves className="w-6 h-6 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Tide Level</p>
                  <p className="font-bold text-gray-800">
                    {todayConditions.tide.icon} {todayConditions.tide.level}
                  </p>
                </div>
                {compareWithToday(predictions.predictions.bestSeaLevel, todayConditions.tide.level) === 'match' && (
                  <span className="text-green-600 font-bold">✓ BEST</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Weather</p>
                  <p className="font-bold text-gray-800">
                    {todayConditions.weather.icon} {todayConditions.weather.temperature}°C
                  </p>
                </div>
              </div>
            </div>

            {/* Best */}
            <div className="space-y-4 bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-lg text-green-700 border-b border-green-200 pb-2">
                Best Conditions (Community Data)
              </h4>
              
              <div className="flex items-center gap-3">
                <Moon className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Best Moon Phase</p>
                  <p className="font-bold text-gray-800">
                    {predictions.predictions.bestMoonPhase}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Waves className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Best Tide Level</p>
                  <p className="font-bold text-gray-800">
                    {predictions.predictions.bestSeaLevel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Fish className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Best Bait</p>
                  <p className="font-bold text-gray-800">
                    {predictions.predictions.bestBait}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {predictions?.predictions && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-xl border border-purple-200">
              <Moon className="w-10 h-10 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Best Moon Phase</h3>
              <p className="text-3xl font-bold text-purple-700 mb-2">
                {predictions.predictions.bestMoonPhase}
              </p>
              <p className="text-sm text-purple-600">Most productive fishing during this phase</p>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-xl border border-blue-200">
              <Waves className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Best Tide Level</h3>
              <p className="text-3xl font-bold text-blue-700 mb-2">
                {predictions.predictions.bestSeaLevel}
              </p>
              <p className="text-sm text-blue-600">Optimal tide conditions for catches</p>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl border border-green-200">
              <Fish className="w-10 h-10 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Most Effective Bait</h3>
              <p className="text-3xl font-bold text-green-700 mb-2">
                {predictions.predictions.bestBait}
              </p>
              <p className="text-sm text-green-600">Highest success rate with this bait</p>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-xl border border-orange-200">
              <Calendar className="w-10 h-10 text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Best Month</h3>
              <p className="text-3xl font-bold text-orange-700 mb-2">
                {predictions.predictions.bestMonth}
              </p>
              <p className="text-sm text-orange-600">Peak fishing season</p>
            </div>

            <div className="bg-gradient-to-br from-pink-100 to-pink-50 p-6 rounded-xl border border-pink-200">
              <TrendingUp className="w-10 h-10 text-pink-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Top Location</h3>
              <p className="text-3xl font-bold text-pink-700 mb-2">
                {predictions.predictions.bestLocation}
              </p>
              <p className="text-sm text-pink-600">Most productive fishing spot</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-6 rounded-xl border border-cyan-200">
              <Activity className="w-10 h-10 text-cyan-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Community Data</h3>
              <p className="text-3xl font-bold text-cyan-700 mb-2">
                {predictions.dataPoints}
              </p>
              <p className="text-sm text-cyan-600">Successful fishing trips logged</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📊 Community Statistics
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Fish Caught</p>
                <p className="text-4xl font-bold text-blue-600">
                  {predictions.predictions.totalFish}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Average Per Trip</p>
                <p className="text-4xl font-bold text-green-600">
                  {predictions.predictions.avgPerTrip}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Trips</p>
                <p className="text-4xl font-bold text-purple-600">
                  {predictions.dataPoints}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {predictions?.message && !predictions?.predictions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <Activity className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-700 text-lg">{predictions.message}</p>
        </div>
      )}
    </div>
  );
};

export default Predictions;