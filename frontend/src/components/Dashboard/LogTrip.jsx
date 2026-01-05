import React, { useState, useEffect, useRef } from 'react';
import { fishingAPI } from '../../services/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Fish, Moon, Waves, Sun, Loader, Thermometer, Wind } from 'lucide-react';

const LogTrip = () => {
  const [locations, setLocations] = useState([]);
  const [fishSpecies, setFishSpecies] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [filteredFish, setFilteredFish] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef(null);
  
  const fishingTypes = ['Casting', 'Jigging', 'Lapess Couler/Couler', 'Dropshot'];
  const fishingMethods = ['land', 'boat'];
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5), // HH:MM format
    location: '',
    locationName: '',
    fishingType: '',
    fishingMethod: 'land',
    caughtFish: 'no',
    fishCount: '',
    fishTypes: [],
    hookSetup: '',
    bait: '',
    baitOther: '',
    jighead: '',
    softbait: '',
    notes: ''
  });
  
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEnv, setLoadingEnv] = useState(false);

  useEffect(() => {
    loadData();
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.location && formData.date) {
      loadEnvironmentalData();
    }
  }, [formData.location, formData.date, formData.time]);

  useEffect(() => {
    if (locationSearch) {
      const filtered = locations.filter(loc =>
        loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
        loc.region.toLowerCase().includes(locationSearch.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowLocationDropdown(true);
    } else {
      setFilteredLocations(locations);
    }
  }, [locationSearch, locations]);

  const loadData = async () => {
    try {
      const [locsRes, fishRes] = await Promise.all([
        fishingAPI.getLocations(),
        axios.get(`${process.env.REACT_APP_API_URL}/fishing/fish-species`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      setLocations(locsRes.data.locations);
      setFilteredLocations(locsRes.data.locations);
      setFishSpecies(fishRes.data.species);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const loadEnvironmentalData = async () => {
    setLoadingEnv(true);
    try {
      const response = await fishingAPI.getEnvironmentalData(formData.date, formData.time, formData.location);
      setEnvironmentalData(response.data);
    } catch (error) {
      console.error('Failed to load environmental data');
    } finally {
      setLoadingEnv(false);
    }
  };

  const selectLocation = (location) => {
    setFormData({ 
      ...formData, 
      location: location.id,
      locationName: location.name 
    });
    setLocationSearch(location.name);
    setShowLocationDropdown(false);
  };

  const getBaitOptions = () => {
    switch (formData.fishingType) {
      case 'Lapess Couler/Couler':
        return ['Calamar', 'Baby calamar', 'Shrimp/Crevette', 'Macro', 'Bonit'];
      case 'Casting':
        return ['Tidelures', 'Ti Tracer', 'Ton Zorz', 'Others'];
      case 'Dropshot':
        return 'special'; // Special case with 2 inputs
      case 'Jigging':
        return 'input'; // Free input
      default:
        return [];
    }
  };

  const updateFishType = (index, value) => {
    const newFishTypes = [...formData.fishTypes];
    newFishTypes[index] = value;
    setFormData({ ...formData, fishTypes: newFishTypes });
  };

  const handleFishSearch = (index, searchValue) => {
    if (searchValue) {
      const filtered = fishSpecies.filter(fish =>
        fish.display.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredFish(filtered);
    } else {
      setFilteredFish([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.location) {
      toast.error('Please select a location');
      return;
    }

    if (!formData.fishingType) {
      toast.error('Please select fishing type');
      return;
    }

    if (!environmentalData) {
      toast.error('Please wait for environmental data to load');
      return;
    }

    // Determine final bait value
    let finalBait = formData.bait;
    if (formData.fishingType === 'Dropshot') {
      finalBait = `Jighead: ${formData.jighead}, Softbait: ${formData.softbait}`;
    } else if (formData.bait === 'Others') {
      finalBait = formData.baitOther;
    }

    setLoading(true);
    try {
      const logData = {
        ...formData,
        fishCount: parseInt(formData.fishCount, 10) || 0,
        bait: finalBait,
        moonPhase: `${environmentalData.moon.emoji} ${environmentalData.moon.phase}`,
        seaLevel: `${environmentalData.tide.level} (${environmentalData.tide.height}m)`,
        seaTemperature: parseFloat(environmentalData.seaTemperature?.temperature || 0),
        tideHeight: parseFloat(environmentalData.tideHeight?.height || 0),
        waveHeight: parseFloat(environmentalData.marine?.waveHeight || 0),
        tideData: environmentalData.tide,
        weatherData: environmentalData.weather
      };

      await fishingAPI.createLog(logData);
      toast.success('Fishing trip logged successfully! 🎣');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        location: '',
        locationName: '',
        fishingType: '',
        fishingMethod: 'land',
        caughtFish: 'no',
        fishCount: '',
        fishTypes: [],
        hookSetup: '',
        bait: '',
        baitOther: '',
        jighead: '',
        softbait: '',
        notes: ''
      });
      setLocationSearch('');
      setEnvironmentalData(null);
    } catch (error) {
      toast.error('Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  const baitOptions = getBaitOptions();

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
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
            <Calendar className="w-4 h-4 inline mr-1" />
            Time
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div ref={locationRef} className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            onFocus={() => setShowLocationDropdown(true)}
            placeholder="Start typing location..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {showLocationDropdown && filteredLocations.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">{location.name}</div>
                  <div className="text-xs text-gray-500">
                    {location.region} • {location.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type of Fishing
          </label>
          <select
            value={formData.fishingType}
            onChange={(e) => setFormData({ ...formData, fishingType: e.target.value, bait: '', baitOther: '', jighead: '', softbait: '' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select type...</option>
            {fishingTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fishing Method
          </label>
          <select
            value={formData.fishingMethod}
            onChange={(e) => setFormData({ ...formData, fishingMethod: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="land">🏖️ Land (Shore/Beach)</option>
            <option value="boat">🚤 Boat</option>
          </select>
        </div>
      </div>

      {/* Bait Selection */}
      {formData.fishingType && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bait Used
          </label>
          {baitOptions === 'input' ? (
            <input
              type="text"
              value={formData.bait}
              onChange={(e) => setFormData({ ...formData, bait: e.target.value })}
              placeholder="Enter bait..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : baitOptions === 'special' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.jighead}
                onChange={(e) => setFormData({ ...formData, jighead: e.target.value })}
                placeholder="Jighead..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={formData.softbait}
                onChange={(e) => setFormData({ ...formData, softbait: e.target.value })}
                placeholder="Softbait..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : Array.isArray(baitOptions) ? (
            <>
              <select
                value={formData.bait}
                onChange={(e) => setFormData({ ...formData, bait: e.target.value, baitOther: '' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select bait...</option>
                {baitOptions.map(bait => (
                  <option key={bait} value={bait}>{bait}</option>
                ))}
              </select>
              {formData.bait === 'Others' && (
                <input
                  type="text"
                  value={formData.baitOther}
                  onChange={(e) => setFormData({ ...formData, baitOther: e.target.value })}
                  placeholder="Specify other bait..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                />
              )}
            </>
          ) : null}
        </div>
      )}

      {loadingEnv && (
        <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-blue-700">Loading conditions...</span>
        </div>
      )}

      {environmentalData && !loadingEnv && (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <Moon className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Moon Phase</p>
            <p className="text-xl font-bold text-purple-700">
              {environmentalData.moon.emoji} {environmentalData.moon.phase}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Waves className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Tide Height</p>
            <p className="text-xl font-bold text-blue-700">
              {environmentalData.tideHeight?.height}m
            </p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <Sun className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Weather</p>
            <p className="text-xl font-bold text-orange-700">
              {environmentalData.weather.icon} {environmentalData.weather.temperature}°C
            </p>
          </div>

          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <Wind className="w-6 h-6 text-cyan-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Wave</p>
            <p className="text-xl font-bold text-cyan-700">
              {environmentalData.marine?.waveHeight}m
            </p>
          </div>

          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <Thermometer className="w-6 h-6 text-teal-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Sea Temp</p>
            <p className="text-xl font-bold text-teal-700">
              {environmentalData.seaTemperature?.temperature}°C
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Did you catch fish?
        </label>
        <select
          value={formData.caughtFish}
            onChange={(e) => setFormData({ ...formData, caughtFish: e.target.value, fishCount: '', fishTypes: [] })}
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
                const val = e.target.value;
                if (val === '') {
                  setFormData({
                    ...formData,
                    fishCount: '',
                    fishTypes: []
                  });
                } else {
                  const count = Math.max(0, parseInt(val, 10) || 0);
                  setFormData({
                    ...formData,
                    fishCount: count,
                    fishTypes: Array(count).fill('')
                  });
                }
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
                <div key={index} className="relative">
                  <input
                    type="text"
                    list={`fish-list-${index}`}
                    placeholder={`Fish ${index + 1} (start typing...)`}
                    value={formData.fishTypes[index] || ''}
                    onChange={(e) => {
                      updateFishType(index, e.target.value);
                      handleFishSearch(index, e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <datalist id={`fish-list-${index}`}>
                    {fishSpecies.map(fish => (
                      <option key={fish.id} value={fish.display} />
                    ))}
                  </datalist>
                </div>
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
            Notes (Optional)
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
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