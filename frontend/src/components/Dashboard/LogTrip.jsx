import React, { useState, useEffect } from 'react';
import { fishingAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Fish, Moon, Waves, Sun, Loader } from 'lucide-react';

const LogTrip = () => {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    caughtFish: 'no',
    fishCount: 0,
    fishTypes: [],
    hookSetup: '',
    bait: '',
    notes: ''
  });
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEnv, setLoadingEnv] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (formData.location && formData.date) {
      loadEnvironmentalData();
    }
  }, [formData.location, formData.date]);

  const loadLocations = async () => {
    try {
      const response = await fishingAPI.getLocations();
      setLocations(response.data.locations);
    } catch (error) {
      toast.error('Failed to load locations');
    }
  };

  const loadEnvironmentalData = async () => {
    setLoadingEnv(true);
    try {
      const response = await fishingAPI.getEnvironmentalData(formData.date, formData.location);
      setEnvironmentalData(response.data);
    } catch (error) {
      console.error('Failed to load environmental data');
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.location) {
      toast.error('Please select a location');
      return;
    }

    if (!environmentalData) {
      toast.error('Please wait for environmental data to load');
      return;
    }

    setLoading(true);
    try {
      const logData = {
        ...formData,
        moonPhase: `${environmentalData.moon.emoji} ${environmentalData.moon.phase}`,
        seaLevel: `${environmentalData.tide.level} (${environmentalData.tide.height}m)`,
        tideData: environmentalData.tide,
        weatherData: environmentalData.weather
      };

      await fishingAPI.createLog(logData);
      toast.success('Fishing trip logged successfully! 🎣');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        location: '',
        caughtFish: 'no',
        fishCount: 0,
        fishTypes: [],
        hookSetup: '',
        bait: '',
        notes: ''
      });
      setEnvironmentalData(null);
    } catch (error) {
      toast.error('Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  const groupedLocations = locations.reduce((acc, loc) => {
    if (!acc[loc.region]) acc[loc.region] = [];
    acc[loc.region].push(loc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <select
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a location...</option>
            {Object.entries(groupedLocations).map(([region, locs]) => (
              <optgroup key={region} label={region}>
                {locs.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {loadingEnv && (
        <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-blue-700">Loading conditions...</span>
        </div>
      )}

      {environmentalData && !loadingEnv && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <Moon className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Moon Phase</p>
            <p className="text-xl font-bold text-purple-700">
              {environmentalData.moon.emoji} {environmentalData.moon.phase}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {environmentalData.moon.illumination}% illuminated
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Waves className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Tide Level</p>
            <p className="text-xl font-bold text-blue-700">
              {environmentalData.tide.level}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {environmentalData.tide.height}m - {environmentalData.tide.description}
            </p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <Sun className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Weather</p>
            <p className="text-xl font-bold text-orange-700">
              {environmentalData.weather.temperature}°C
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {environmentalData.weather.description} • {environmentalData.weather.conditions.rating}
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Fish className="w-4 h-4 inline mr-1" />
          Did you catch fish?
        </label>
        <select
          value={formData.caughtFish}
          onChange={(e) => setFormData({ ...formData, caughtFish: e.target.value, fishCount: 0, fishTypes: [] })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      {formData.caughtFish === 'yes' && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              How many fish?
            </label>
            <input
              type="number"
              min="1"
              value={formData.fishCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                setFormData({
                  ...formData,
                  fishCount: count,
                  fishTypes: Array(count).fill('')
                });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {formData.fishCount > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                What fish did you catch?
              </label>
              {Array.from({ length: formData.fishCount }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Fish ${index + 1} (e.g., Marlin, Tuna, Dorado)`}
                  value={formData.fishTypes[index] || ''}
                  onChange={(e) => {
                    const newTypes = [...formData.fishTypes];
                    newTypes[index] = e.target.value;
                    setFormData({ ...formData, fishTypes: newTypes });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hook Setup
          </label>
          <input
            type="text"
            value={formData.hookSetup}
            onChange={(e) => setFormData({ ...formData, hookSetup: e.target.value })}
            placeholder="e.g., Circle hook size 8/0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bait Used
          </label>
          <input
            type="text"
            value={formData.bait}
            onChange={(e) => setFormData({ ...formData, bait: e.target.value })}
            placeholder="e.g., Live bait, lures, squid"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes about your trip..."
          rows="3"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || loadingEnv || !environmentalData}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Fishing Log'}
      </button>
    </div>
  );
};

export default LogTrip;