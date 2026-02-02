import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Fish, Clock, Calendar, AlertCircle, CheckCircle, Info, Loader, TrendingUp, Sun, Moon, Waves, Wind, ThermometerSun } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PlanTrip = () => {
  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    location: '',
    fishingType: '',
    baitType: '',
    fishingMethod: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '12:00'
  });
  
  // Dropdown options
  const [locations, setLocations] = useState([]);
  const [fishingTypes, setFishingTypes] = useState([]);
  const [baits, setBaits] = useState([]);
  const [fishingMethods, setFishingMethods] = useState([]);
  const [filteredBaits, setFilteredBaits] = useState([]);

  // Fetch dropdown options on mount
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoadingDropdowns(true);
        const [locRes, typesRes, baitsRes, methodsRes] = await Promise.all([
          api.get('/fishing/locations'),
          api.get('/fishing/dropdown/fishing-types'),
          api.get('/fishing/dropdown/baits'),
          api.get('/fishing/dropdown/fishing-methods')
        ]);
        
        // Handle both array and object responses
        setLocations(Array.isArray(locRes.data) ? locRes.data : (locRes.data?.locations || []));
        setFishingTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
        setBaits(Array.isArray(baitsRes.data) ? baitsRes.data : []);
        setFishingMethods(Array.isArray(methodsRes.data) ? methodsRes.data : []);
      } catch (error) {
        console.error('Error fetching dropdowns:', error);
        toast.error('Failed to load dropdown options');
      } finally {
        setLoadingDropdowns(false);
      }
    };
    
    fetchDropdowns();
  }, []);

  // Filter baits when fishing type changes
  useEffect(() => {
    if (formData.fishingType) {
      const selectedType = fishingTypes.find(t => t.name === formData.fishingType);
      if (selectedType) {
        const filtered = baits.filter(b => b.fishing_type_id === selectedType.id);
        setFilteredBaits(filtered.length > 0 ? filtered : baits);
      } else {
        setFilteredBaits(baits);
      }
    } else {
      setFilteredBaits(baits);
    }
    // Reset bait selection when fishing type changes
    setFormData(prev => ({ ...prev, baitType: '' }));
  }, [formData.fishingType, fishingTypes, baits]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGetRecommendations = async () => {
    // Validation
    if (!formData.location) {
      toast.error('Please select a location');
      return;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }
    
    try {
      setLoading(true);
      setRecommendation(null);
      
      const response = await api.post('/fishing/trip-recommendations', formData);
      setRecommendation(response.data);
      toast.success('Recommendations generated successfully!');
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error(error.response?.data?.error || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 70) return 'bg-green-500';
    if (rate >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Compass className="w-6 h-6 mr-2 text-blue-600" />
          Plan Your Fishing Trip
        </h2>
        <p className="text-gray-600 mt-1">
          Get personalized recommendations based on historical data and conditions
        </p>
      </div>

      {/* Trip Planning Form */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Fishing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Fish className="w-4 h-4 inline mr-1" />
              Fishing Type
            </label>
            <select
              name="fishingType"
              value={formData.fishingType}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Fishing Type</option>
              {fishingTypes.map((type) => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Bait Type - Filtered by Fishing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bait Type
              {formData.fishingType && (
                <span className="text-xs text-blue-600 ml-1">
                  (filtered for {formData.fishingType})
                </span>
              )}
            </label>
            <select
              name="baitType"
              value={formData.baitType}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Bait</option>
              {filteredBaits.map((bait) => (
                <option key={bait.id} value={bait.name}>{bait.name}</option>
              ))}
            </select>
          </div>

          {/* Fishing Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fishing Method
            </label>
            <select
              name="fishingMethod"
              value={formData.fishingMethod}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Method</option>
              {fishingMethods.map((method) => (
                <option key={method.id} value={method.name}>{method.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Get Recommendations Button */}
        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 mr-2" />
              Get Recommendations
            </>
          )}
        </button>
      </div>

      {/* Recommendations Display */}
      {recommendation && (
        <div className="space-y-4">
          {/* Success Rate Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Trip Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Predicted Success Rate */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Predicted Success Rate</p>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-center">
                    <span className={`text-3xl font-bold ${getConfidenceColor(recommendation.successRate || 0)}`}>
                      {recommendation.successRate || 0}%
                    </span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${recommendation.successRate || 0}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getSuccessRateColor(recommendation.successRate || 0)}`}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Confidence Level */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Confidence Level</p>
                <span className={`text-3xl font-bold ${getConfidenceColor(recommendation.confidence || 0)}`}>
                  {recommendation.confidence || 0}%
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {recommendation.historicalTrips || 0} similar trips
                </p>
              </div>

              {/* Overall Rating */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
                <span className={`text-3xl font-bold ${
                  recommendation.rating === 'Excellent' ? 'text-green-600' :
                  recommendation.rating === 'Good' ? 'text-blue-600' :
                  recommendation.rating === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {recommendation.rating || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Conditions Analysis */}
          {recommendation.conditions && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                Conditions Analysis
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendation.conditions.weather && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <ThermometerSun className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Weather</p>
                      <p className="font-medium text-gray-800">{recommendation.conditions.weather}</p>
                    </div>
                  </div>
                )}
                
                {recommendation.conditions.tide && (
                  <div className="flex items-center space-x-2 p-3 bg-cyan-50 rounded-lg">
                    <Waves className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="text-xs text-gray-500">Tide</p>
                      <p className="font-medium text-gray-800">{recommendation.conditions.tide}</p>
                    </div>
                  </div>
                )}
                
                {recommendation.conditions.moonPhase && (
                  <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                    <Moon className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500">Moon Phase</p>
                      <p className="font-medium text-gray-800">{recommendation.conditions.moonPhase}</p>
                    </div>
                  </div>
                )}
                
                {recommendation.conditions.wind && (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Wind className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Wind</p>
                      <p className="font-medium text-gray-800">{recommendation.conditions.wind}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendation.tips && recommendation.tips.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                Recommendations & Tips
              </h3>
              
              <ul className="space-y-2">
                {recommendation.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Best Times */}
          {recommendation.bestTimes && recommendation.bestTimes.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Optimal Fishing Times
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendation.bestTimes.map((time, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
                    <Sun className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-800">{time.period}</p>
                    <p className="text-sm text-gray-600">{time.time}</p>
                    {time.reason && (
                      <p className="text-xs text-blue-600 mt-1">{time.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Data */}
          {recommendation.historicalData && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Historical Performance
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{recommendation.historicalData.totalTrips || 0}</p>
                  <p className="text-sm text-gray-600">Total Similar Trips</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{recommendation.historicalData.successfulTrips || 0}</p>
                  <p className="text-sm text-gray-600">Successful Catches</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{recommendation.historicalData.avgCatch || 0}</p>
                  <p className="text-sm text-gray-600">Avg Fish Caught</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{recommendation.historicalData.topSpecies || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Most Common Catch</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!recommendation && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Plan Your Perfect Trip</h3>
          <p className="text-gray-500">
            Fill in the details above and click "Get Recommendations" to receive personalized fishing advice based on historical data and current conditions.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanTrip;
