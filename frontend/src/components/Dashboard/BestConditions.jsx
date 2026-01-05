import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Waves, MapPin, Calendar, TrendingUp, Filter } from 'lucide-react';

const BestConditions = () => {
  const [fishingTypes, setFishingTypes] = useState(['Casting', 'Jigging', 'Lapess Couler/Couler', 'Dropshot']);
  const [selectedType, setSelectedType] = useState('');
  const [selectedBait, setSelectedBait] = useState('');
  const [conditions, setConditions] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadConditions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType) params.fishingType = selectedType;
      if (selectedBait) params.bait = selectedBait;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/fishing/best-conditions`,
        {
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setConditions(response.data);
    } catch (error) {
      console.error('Failed to load conditions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConditions();
  }, [selectedType, selectedBait]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">🎯 Best Conditions Analyzer</h2>
        <p className="text-purple-100">
          Find the optimal conditions for different fishing types and baits
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-800">Filters</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fishing Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              {fishingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bait (Optional)
            </label>
            <input
              type="text"
              value={selectedBait}
              onChange={(e) => setSelectedBait(e.target.value)}
              placeholder="Enter bait name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      )}

      {conditions && conditions.conditions && !loading && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Analysis for: {conditions.fishingType}
              {conditions.bait && ` with ${conditions.bait}`}
            </h3>
            <p className="text-gray-600 mb-4">
              Based on {conditions.conditions.dataPoints} successful fishing trips ({conditions.conditions.totalFish} fish caught)
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <Moon className="w-8 h-8 text-purple-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Best Moon Phase</h4>
                <p className="text-2xl font-bold text-purple-700">
                  {conditions.conditions.bestMoonPhase}
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <Waves className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Best Tide</h4>
                <p className="text-2xl font-bold text-blue-700">
                  {conditions.conditions.bestTide}
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <MapPin className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Best Location</h4>
                <p className="text-xl font-bold text-green-700">
                  {conditions.conditions.bestLocation}
                </p>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <Calendar className="w-8 h-8 text-orange-600 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Best Month</h4>
                <p className="text-2xl font-bold text-orange-700">
                  {conditions.conditions.bestMonth}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-800">Recommendations</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Fish during <strong>{conditions.conditions.bestMoonPhase}</strong> moon phase for best results
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Target <strong>{conditions.conditions.bestTide}</strong> tide conditions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Visit <strong>{conditions.conditions.bestLocation}</strong> - most productive spot for this method
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  Plan trips during <strong>{conditions.conditions.bestMonth}</strong> for peak season
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {conditions && conditions.message && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-gray-700">{conditions.message}</p>
        </div>
      )}
    </div>
  );
};

export default BestConditions;
