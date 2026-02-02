import React, { useState, useEffect, useRef } from 'react';
import { fishingAPI } from '../../services/api';
import api from '../../services/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Fish, Moon, Waves, Sun, Loader, Thermometer, Wind, Activity, Plus, X, Send } from 'lucide-react';

const LogTrip = () => {
  const [locations, setLocations] = useState([]);
  const [fishSpecies, setFishSpecies] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [fishSearch, setFishSearch] = useState({});
  const [showFishDropdown, setShowFishDropdown] = useState({});
  const [activeFishIndex, setActiveFishIndex] = useState({});
  const locationRef = useRef(null);
  const fishRefs = useRef({});
  
  // Dynamic dropdown options from API
  const [fishingTypes, setFishingTypes] = useState([]);
  const [fishingMethods, setFishingMethods] = useState([]);
  const [allBaits, setAllBaits] = useState([]);
  const [filteredBaits, setFilteredBaits] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  
  // Custom submission modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSubmission, setCustomSubmission] = useState({
    dropdownType: '',
    value: '',
    description: ''
  });
  const [submittingCustom, setSubmittingCustom] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeStart: new Date().toTimeString().split(' ')[0].substring(0, 5),
    timeEnd: new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: '',
    locationName: '',
    fishingType: '',
    fishingTypeOther: '',
    fishingMethod: 'land',
    fishingMethodOther: '',
    caughtFish: 'no',
    fishCount: '',
    fishTypes: [],
    fishTypeOther: [],
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
    loadDropdownOptions();
    
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
      Object.keys(fishRefs.current).forEach(key => {
        if (fishRefs.current[key] && !fishRefs.current[key].contains(event.target)) {
          setShowFishDropdown(prev => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.location && formData.date) {
      loadEnvironmentalData();
    }
  }, [formData.location, formData.date, formData.timeStart]);

  useEffect(() => {
    if (locationSearch) {
      const filtered = locations.filter(loc =>
        loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
        (loc.region && loc.region.toLowerCase().includes(locationSearch.toLowerCase()))
      );
      setFilteredLocations(filtered);
      setShowLocationDropdown(true);
    } else {
      setFilteredLocations(locations);
    }
  }, [locationSearch, locations]);

  // Filter baits when fishing type changes
  useEffect(() => {
    if (formData.fishingType) {
      const selectedType = fishingTypes.find(t => t.name === formData.fishingType);
      if (selectedType) {
        const filtered = allBaits.filter(b => b.fishing_type_id === selectedType.id);
        // If there are baits for this type, use them; otherwise show all baits
        setFilteredBaits(filtered.length > 0 ? filtered : allBaits);
      } else {
        setFilteredBaits(allBaits);
      }
    } else {
      setFilteredBaits(allBaits);
    }
    // Reset bait when fishing type changes
    setFormData(prev => ({ ...prev, bait: '', baitOther: '' }));
  }, [formData.fishingType, fishingTypes, allBaits]);

  const loadDropdownOptions = async () => {
    try {
      setLoadingDropdowns(true);
      const [typesRes, methodsRes, baitsRes, speciesRes] = await Promise.all([
        api.get('/fishing/dropdown/fishing-types'),
        api.get('/fishing/dropdown/fishing-methods'),
        api.get('/fishing/dropdown/baits'),
        api.get('/fishing/dropdown/fish-species')
      ]);
      
      // Handle both array and object responses
      const types = Array.isArray(typesRes.data) ? typesRes.data : [];
      const methods = Array.isArray(methodsRes.data) ? methodsRes.data : [];
      const baits = Array.isArray(baitsRes.data) ? baitsRes.data : [];
      const speciesData = Array.isArray(speciesRes.data) ? speciesRes.data : [];
      
      setFishingTypes(types);
      setFishingMethods(methods);
      setAllBaits(baits);
      setFilteredBaits(baits);
      
      // Transform species for display
      const species = speciesData.map(s => ({
        id: s.id,
        display: s.local_name || s.english_name || s.display,
        scientific: s.scientific_name,
        localName: s.local_name,
        englishName: s.english_name
      }));
      setFishSpecies(species);
    } catch (error) {
      console.error('Error loading dropdown options:', error);
      // Fallback to hardcoded values if API fails
      setFishingTypes([
        { id: 1, name: 'Casting' },
        { id: 2, name: 'Jigging' },
        { id: 3, name: 'Lapess Couler/Couler' },
        { id: 4, name: 'Dropshot' }
      ]);
      setFishingMethods([
        { id: 1, name: 'Land' },
        { id: 2, name: 'Boat' }
      ]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const loadData = async () => {
    try {
      const locsRes = await fishingAPI.getLocations();
      setLocations(locsRes.data.locations || []);
      setFilteredLocations(locsRes.data.locations || []);
    } catch (error) {
      toast.error('Failed to load locations');
    }
  };

  const loadEnvironmentalData = async () => {
    setLoadingEnv(true);
    try {
      const response = await fishingAPI.getEnvironmentalData(formData.date, formData.timeStart, formData.location);
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

  const updateFishType = (index, value) => {
    const newFishTypes = [...formData.fishTypes];
    newFishTypes[index] = value;
    setFormData({ ...formData, fishTypes: newFishTypes });
  };

  const handleFishKeyDown = (index, filteredFishForIndex) => (e) => {
    if (!showFishDropdown[index] || filteredFishForIndex.length === 0) return;

    const currentActiveIndex = activeFishIndex[index] || -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveFishIndex({
          ...activeFishIndex,
          [index]: currentActiveIndex < filteredFishForIndex.length - 1 ? currentActiveIndex + 1 : currentActiveIndex
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveFishIndex({
          ...activeFishIndex,
          [index]: currentActiveIndex > 0 ? currentActiveIndex - 1 : 0
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (currentActiveIndex >= 0 && currentActiveIndex < filteredFishForIndex.length) {
          const selectedFish = filteredFishForIndex[currentActiveIndex];
          updateFishType(index, selectedFish.display);
          setFishSearch({ ...fishSearch, [index]: selectedFish.display });
          setShowFishDropdown({ ...showFishDropdown, [index]: false });
          setActiveFishIndex({ ...activeFishIndex, [index]: -1 });
          const newFishTypeOther = formData.fishTypeOther || [];
          newFishTypeOther[index] = '';
          setFormData({ ...formData, fishTypeOther: newFishTypeOther });
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowFishDropdown({ ...showFishDropdown, [index]: false });
        setActiveFishIndex({ ...activeFishIndex, [index]: -1 });
        break;
      default:
        break;
    }
  };

  // Reset active index when fish search changes
  useEffect(() => {
    const resetIndexes = {};
    Object.keys(fishSearch).forEach(key => {
      resetIndexes[key] = -1;
    });
    setActiveFishIndex(resetIndexes);
  }, [fishSearch]);


  // Custom submission handler
  const handleOpenCustomModal = (dropdownType) => {
    setCustomSubmission({
      dropdownType,
      value: '',
      description: ''
    });
    setShowCustomModal(true);
  };

  const handleSubmitCustom = async () => {
    if (!customSubmission.value.trim()) {
      toast.error('Please enter a value');
      return;
    }

    try {
      setSubmittingCustom(true);
      await api.post('/fishing/custom-submission', customSubmission);
      toast.success('Your custom option has been submitted for admin review!');
      setShowCustomModal(false);
      setCustomSubmission({ dropdownType: '', value: '', description: '' });
    } catch (error) {
      console.error('Error submitting custom option:', error);
      toast.error(error.response?.data?.error || 'Failed to submit custom option');
    } finally {
      setSubmittingCustom(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.location || !formData.timeStart || !formData.timeEnd) {
      toast.error('Please fill in all required fields including start and end times');
      return;
    }

    if (formData.caughtFish === 'yes' && formData.fishCount > 0) {
      const filledFishCount = (formData.fishTypes || []).filter(fish => fish && fish.trim() !== '').length;
      if (filledFishCount !== formData.fishCount) {
        toast.error(`Please specify all ${formData.fishCount} fish species you caught`);
        return;
      }
    }

    if (!environmentalData) {
      toast.error('Please wait for environmental data to load');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        caughtFish: formData.caughtFish === 'yes',
        fishTypes: formData.fishTypes.filter(fish => fish && fish.trim() !== ''),
        moon: environmentalData?.moon,
        tide: environmentalData?.tideHeight,
        tideData: environmentalData?.tide,
        weatherData: environmentalData?.weather,
        fishActivity: environmentalData?.solunar?.currentActivity?.level,
        solunarData: environmentalData?.solunar
      };

      await fishingAPI.createLog(submitData);
      toast.success('Fishing log saved successfully!');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        timeStart: new Date().toTimeString().split(' ')[0].substring(0, 5),
        timeEnd: new Date().toTimeString().split(' ')[0].substring(0, 5),
        location: '',
        locationName: '',
        fishingType: '',
        fishingTypeOther: '',
        fishingMethod: 'land',
        fishingMethodOther: '',
        caughtFish: 'no',
        fishCount: '',
        fishTypes: [],
        fishTypeOther: [],
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
      toast.error('Failed to save fishing log');
      console.error('Log save error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom Submission Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Submit Custom {customSubmission.dropdownType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <button onClick={() => setShowCustomModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                <input
                  type="text"
                  value={customSubmission.value}
                  onChange={(e) => setCustomSubmission({ ...customSubmission, value: e.target.value })}
                  placeholder={`Enter new ${customSubmission.dropdownType.replace('_', ' ')}...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={customSubmission.description}
                  onChange={(e) => setCustomSubmission({ ...customSubmission, description: e.target.value })}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Your submission will be reviewed by an admin before being added to the dropdown options.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCustom}
                  disabled={submittingCustom}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingCustom ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
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
            Trip Start Time
          </label>
          <input
            type="time"
            value={formData.timeStart}
            onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Trip End Time
          </label>
          <input
            type="time"
            value={formData.timeEnd}
            onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
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
          <div className="flex gap-2">
            <select
              value={formData.fishingType}
              onChange={(e) => setFormData({ ...formData, fishingType: e.target.value, bait: '', baitOther: '', jighead: '', softbait: '', fishingTypeOther: '' })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select type...</option>
              {fishingTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
              <option value="other">➕ Other (specify)</option>
            </select>
            <button
              type="button"
              onClick={() => handleOpenCustomModal('fishing_type')}
              className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Add custom fishing type"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {formData.fishingType === 'other' && (
            <input
              type="text"
              value={formData.fishingTypeOther}
              onChange={(e) => setFormData({ ...formData, fishingTypeOther: e.target.value })}
              placeholder="Specify fishing type..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fishing Method</label>
          <div className="flex gap-2">
            <select
              value={formData.fishingMethod}
              onChange={(e) => setFormData({ ...formData, fishingMethod: e.target.value, fishingMethodOther: '' })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {fishingMethods.length > 0 ? (
                <>
                  {fishingMethods.map(method => (
                    <option key={method.id} value={method.name.toLowerCase()}>
                      {method.name.toLowerCase() === 'land' ? '🏖️ ' : method.name.toLowerCase() === 'boat' ? '🚤 ' : ''}{method.name}
                    </option>
                  ))}
                  <option value="other">➕ Other (specify)</option>
                </>
              ) : (
                <>
                  <option value="land">🏖️ Land (Shore/Beach)</option>
                  <option value="boat">🚤 Boat</option>
                  <option value="other">➕ Other (specify)</option>
                </>
              )}
            </select>
            <button
              type="button"
              onClick={() => handleOpenCustomModal('fishing_method')}
              className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Add custom fishing method"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {formData.fishingMethod === 'other' && (
            <input
              type="text"
              value={formData.fishingMethodOther}
              onChange={(e) => setFormData({ ...formData, fishingMethodOther: e.target.value })}
              placeholder="Specify fishing method..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
            />
          )}
        </div>
      </div>

      {/* Bait Selection - Dynamic based on fishing type */}
      {formData.fishingType && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bait Used
            {formData.fishingType && formData.fishingType !== 'other' && (
              <span className="text-xs text-blue-600 ml-2">
                (showing baits for {formData.fishingType})
              </span>
            )}
          </label>
          
          {/* Check for special cases like Dropshot or Jigging */}
          {formData.fishingType === 'Dropshot' ? (
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
          ) : formData.fishingType === 'Jigging' ? (
            <input
              type="text"
              value={formData.bait}
              onChange={(e) => setFormData({ ...formData, bait: e.target.value })}
              placeholder="Enter jig/bait..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : formData.fishingType === 'other' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={formData.baitOther}
                onChange={(e) => setFormData({ ...formData, baitOther: e.target.value })}
                placeholder="Specify bait used..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={formData.bait}
                  onChange={(e) => setFormData({ ...formData, bait: e.target.value, baitOther: '' })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select bait...</option>
                  {filteredBaits.map(bait => (
                    <option key={bait.id} value={bait.name}>{bait.name}</option>
                  ))}
                  <option value="other">➕ Other (specify)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleOpenCustomModal('bait')}
                  className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Add custom bait"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {formData.bait === 'other' && (
                <input
                  type="text"
                  value={formData.baitOther}
                  onChange={(e) => setFormData({ ...formData, baitOther: e.target.value })}
                  placeholder="Specify other bait..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}
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
            <p className="text-sm text-purple-600 mt-1">
              {environmentalData.moon.illumination}% illuminated
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

          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <Thermometer className="w-6 h-6 text-teal-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Sea Temp</p>
            <p className="text-xl font-bold text-teal-700">
              {environmentalData.seaTemperature?.temperature}°C
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <Activity className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Fish Activity</p>
            <div className="flex items-center gap-1 mb-1">
              {environmentalData.solunar?.currentActivity?.level === 'average' && (
                <>
                  <Fish className="w-5 h-5 text-yellow-600 fill-current" />
                  <Fish className="w-5 h-5 text-yellow-600 fill-current" />
                  <Fish className="w-5 h-5 text-gray-300 fill-current" />
                </>
              )}
              {environmentalData.solunar?.currentActivity?.level === 'low' && (
                <>
                  <Fish className="w-5 h-5 text-gray-400 fill-current" />
                  <Fish className="w-5 h-5 text-gray-300 fill-current" />
                  <Fish className="w-5 h-5 text-gray-300 fill-current" />
                </>
              )}
              {(!environmentalData.solunar?.currentActivity?.level || environmentalData.solunar?.currentActivity?.level === 'none') && (
                <>
                  <Fish className="w-5 h-5 text-gray-300 fill-current" />
                  <Fish className="w-5 h-5 text-gray-300 fill-current" />
                  <Fish className="w-5 h-5 text-gray-300 fill-current" />
                </>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-700 capitalize">
              {environmentalData.solunar?.currentActivity?.level || 'Low'}
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
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-gray-700">
                  What fish did you catch?
                </label>
                <button
                  type="button"
                  onClick={() => handleOpenCustomModal('fish_species')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add new species
                </button>
              </div>
              
              {Array.from({ length: formData.fishCount }).map((_, index) => {
                const fishSearchValue = fishSearch[index] || '';
                const filteredFishForIndex = fishSearchValue
                  ? fishSpecies.filter(fish =>
                      fish.display.toLowerCase().includes(fishSearchValue.toLowerCase())
                    )
                  : fishSpecies;
                
                return (
                  <div key={index} ref={el => fishRefs.current[index] = el} className="relative">
                    <input
                      type="text"
                      placeholder={`Fish ${index + 1} (start typing...)`}
                      value={fishSearch[index] || ''}
                      onChange={(e) => {
                        setFishSearch({ ...fishSearch, [index]: e.target.value });
                        setShowFishDropdown({ ...showFishDropdown, [index]: true });
                      }}
                      onFocus={() => setShowFishDropdown({ ...showFishDropdown, [index]: true })}
                      onBlur={() => {
                        // Save the fish name to formData when user leaves the field
                        const fishValue = fishSearch[index];
                        if (fishValue && fishValue.trim()) {
                          updateFishType(index, fishValue);
                        }
                        setShowFishDropdown({ ...showFishDropdown, [index]: false });
                      }}
                      onKeyDown={handleFishKeyDown(index, filteredFishForIndex)}
                      aria-label={`Fish ${index + 1}`}
                      aria-expanded={showFishDropdown[index] && (filteredFishForIndex.length > 0 || fishSearchValue)}
                      aria-controls={`fish-dropdown-${index}`}
                      aria-activedescendant={(activeFishIndex[index] || -1) >= 0 ? `fish-option-${index}-${activeFishIndex[index]}` : undefined}
                      role="combobox"
                      aria-autocomplete="list"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    
                    {showFishDropdown[index] && (filteredFishForIndex.length > 0 || fishSearchValue) && (
                      <div 
                        id={`fish-dropdown-${index}`}
                        role="listbox"
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredFishForIndex.map((fish, fishIdx) => (
                          <div
                            key={fish.id}
                            id={`fish-option-${index}-${fishIdx}`}
                            role="option"
                            aria-selected={fishIdx === (activeFishIndex[index] || -1)}
                            onClick={() => {
                              updateFishType(index, fish.display);
                              setFishSearch({ ...fishSearch, [index]: fish.display });
                              setShowFishDropdown({ ...showFishDropdown, [index]: false });
                              const newFishTypeOther = formData.fishTypeOther || [];
                              newFishTypeOther[index] = '';
                              setFormData({ ...formData, fishTypeOther: newFishTypeOther });
                            }}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              fishIdx === (activeFishIndex[index] || -1) ? 'bg-green-100' : 'hover:bg-green-50'
                            }`}
                          >
                            <div className="font-semibold text-gray-800">{fish.display}</div>
                            {fish.englishName && <div className="text-xs text-gray-600">{fish.englishName}</div>}
                            {fish.scientific && <div className="text-xs text-gray-500">{fish.scientific}</div>}
                          </div>
                        ))}
                        {fishSearchValue && !filteredFishForIndex.some(f => f.display.toLowerCase() === fishSearchValue.toLowerCase()) && (
                          <div
                            role="option"
                            aria-selected={false}
                            onClick={() => {
                              updateFishType(index, fishSearchValue);
                              setFishSearch({ ...fishSearch, [index]: fishSearchValue });
                              setShowFishDropdown({ ...showFishDropdown, [index]: false });
                              const newFishTypeOther = formData.fishTypeOther || [];
                              newFishTypeOther[index] = fishSearchValue;
                              setFormData({ ...formData, fishTypeOther: newFishTypeOther });
                            }}
                            className="px-4 py-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 font-semibold text-yellow-700"
                          >
                            ➕ Add "{fishSearchValue}" as new species
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
