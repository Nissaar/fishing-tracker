import React from 'react';
import { Fish, Moon, Waves, Sun, Loader, Thermometer, Activity } from 'lucide-react';
import ErrorState from '../../Common/ErrorState';

// How many of the three fish icons are filled for each activity level
const ACTIVITY_FISH = { high: 3, average: 2, low: 1 };

const ActivityFish = ({ level }) => {
  const filled = ACTIVITY_FISH[level] || 0;
  return (
    <div className="flex items-center gap-1 mb-1" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <Fish
          key={i}
          className={`w-5 h-5 fill-current ${i < filled ? (filled >= 2 ? 'text-yellow-600' : 'text-gray-400') : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

/** Moon, tide, weather, sea temperature and solunar activity for the trip. */
const EnvironmentalPanel = ({ data, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
        <Loader className="w-5 h-5 animate-spin text-blue-600" aria-hidden="true" />
        <span className="text-blue-700">Loading conditions...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Conditions for this trip couldn't be loaded, so the log can't be saved yet." onRetry={onRetry} />;
  }

  if (!data) return null;

  const activityLevel = data.solunar?.currentActivity?.level;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <Moon className="w-6 h-6 text-purple-600 mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-600 mb-1">Moon Phase</p>
        <p className="text-xl font-bold text-purple-700">
          {data.moon.emoji} {data.moon.phase}
        </p>
        <p className="text-sm text-purple-600 mt-1">
          {data.moon.illumination}% illuminated
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <Waves className="w-6 h-6 text-blue-600 mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-600 mb-1">Tide Height</p>
        <p className="text-xl font-bold text-blue-700">
          {data.tideHeight?.height != null ? `${data.tideHeight.height}m` : 'Unavailable'}
        </p>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <Sun className="w-6 h-6 text-orange-600 mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-600 mb-1">Weather</p>
        <p className="text-xl font-bold text-orange-700">
          {data.weather.icon} {data.weather.temperature}°C
        </p>
      </div>

      <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
        <Thermometer className="w-6 h-6 text-teal-600 mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-600 mb-1">Sea Temp</p>
        <p className="text-xl font-bold text-teal-700">
          {data.seaTemperature?.temperature}°C
        </p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <Activity className="w-6 h-6 text-green-600 mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-600 mb-1">Fish Activity</p>
        <ActivityFish level={activityLevel} />
        <p className="text-sm font-semibold text-gray-700 capitalize">
          {activityLevel || 'Low'}
        </p>
      </div>
    </div>
  );
};

export default EnvironmentalPanel;
