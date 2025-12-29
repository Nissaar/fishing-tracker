import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Fish, TrendingUp, Calendar, Loader } from 'lucide-react';

const BrowseLocation = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationStats, setLocationStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/fishing/locations`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setLocations(response.data.locations);
    } catch (error) {
      console.error('Failed to load locations');
    }
  };

  const loadLocationStats = async (locationId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/fishing/location-stats/${locationId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSelectedLocation(response.data.location);
      setLocationStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load location stats');
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">🗺️ Browse Fishing Locations</h2>
        <p className="text-blue-100">
          Explore fishing data for different locations around Mauritius
        </p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {filteredLocations.map(location => (
          <button
            key={location.id}
            onClick={() => loadLocationStats(location.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedLocation?.id === location.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <MapPin className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-800">{location.name}</h3>
            <p className="text-xs text-gray-500">{location.region} • {location.type}</p>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {selectedLocation && locationStats && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedLocation.name}
            </h2>
            <p className="text-gray-600">
              {selectedLocation.region} • {selectedLocation.type}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-blue-700">{locationStats.totalTrips}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <Fish className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Total Fish</p>
              <p className="text-2xl font-bold text-green-700">{locationStats.totalFish}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm text-gray-600">Best Bait</p>
              <p className="text-lg font-bold text-purple-700">{locationStats.bestBait}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <Fish className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-sm text-gray-600">Most Caught</p>
              <p className="text-lg font-bold text-orange-700">{locationStats.mostCaughtFish}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Best Fishing Type</h3>
            <div className="bg-cyan-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-cyan-700">{locationStats.bestFishingType}</p>
              <p className="text-sm text-gray-600 mt-2">Most successful fishing method at this location</p>
            </div>
          </div>

          {locationStats.recentLogs && locationStats.recentLogs.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Catches</h3>
              <div className="space-y-3">
                {locationStats.recentLogs.map((log, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {log.fishCount} fish - {log.fishTypes?.join(', ')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Bait: {log.bait} • Type: {log.fishingType}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedLocation && !locationStats && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-gray-700">No fishing data available for this location yet.</p>
          <p className="text-sm text-gray-600 mt-2">Be the first to log a catch here!</p>
        </div>
      )}
    </div>
  );
};

export default BrowseLocation;
