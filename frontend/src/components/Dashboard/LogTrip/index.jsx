import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Loader, Plus } from 'lucide-react';
import { fishingAPI, isCancelled } from '../../../services/api';
import FishingTypeSelector from '../../Common/FishingTypeSelector';
import ErrorState from '../../Common/ErrorState';
import useDropdownOptions from '../../../hooks/useDropdownOptions';
import { localDateString } from '../../../utils/dates';
import LocationPicker from './LocationPicker';
import EnvironmentalPanel from './EnvironmentalPanel';
import FishSpeciesInputs from './FishSpeciesInputs';
import CustomSubmissionModal from './CustomSubmissionModal';

// A typo like 5000 would otherwise render 5000 comboboxes and freeze the tab
const MAX_FISH_COUNT = 50;
// Wait for the user to stop editing the time before fetching conditions
const CONDITIONS_DEBOUNCE_MS = 400;

const hhmm = (date) => date.toTimeString().substring(0, 5);

const makeInitialForm = () => {
  const now = new Date();
  const inAnHour = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    date: localDateString(now),
    timeStart: hhmm(now),
    timeEnd: hhmm(inAnHour),
    location: '',
    locationName: '',
    fishingTypes: [],
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
  };
};

// Used when the dropdown endpoints fail, so the form stays usable
const FALLBACK_FISHING_TYPES = [
  { id: 1, name: 'Casting' },
  { id: 2, name: 'Jigging' },
  { id: 3, name: 'Lapess Couler/Couler' },
  { id: 4, name: 'Dropshot' }
];

const toSpeciesOption = (s) => ({
  id: s.id,
  display: s.local_name || s.english_name || s.display,
  scientific: s.scientific_name,
  localName: s.local_name,
  englishName: s.english_name
});

const LogTrip = () => {
  const { options, loading: loadingDropdowns, error: dropdownError } = useDropdownOptions(
    ['locations', 'fishingTypes', 'fishingMethods', 'baits', 'fishSpecies']
  );
  const locations = options.locations;
  const fishingTypes = options.fishingTypes.length > 0 ? options.fishingTypes : FALLBACK_FISHING_TYPES;
  const fishingMethods = options.fishingMethods;
  const allBaits = options.baits;
  const fishSpecies = options.fishSpecies.map(toSpeciesOption);

  const [formData, setFormData] = useState(makeInitialForm);
  const [locationSearch, setLocationSearch] = useState('');
  const [customDropdownType, setCustomDropdownType] = useState(null);
  // Bumped after a save so the fish inputs start empty again
  const [fishInputsKey, setFishInputsKey] = useState(0);

  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [envError, setEnvError] = useState(null);
  const [envReloadToken, setEnvReloadToken] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dropdownError) toast.error('Some options failed to load');
  }, [dropdownError]);

  // Conditions for the chosen place and time. Each change cancels the
  // previous request, so a slow earlier response can't overwrite a newer one
  // and end up saved with the log.
  useEffect(() => {
    if (!formData.location || !formData.date || !formData.timeStart) return undefined;

    const controller = new AbortController();
    setLoadingEnv(true);
    setEnvError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await fishingAPI.getEnvironmentalData(
          formData.date, formData.timeStart, formData.location, { signal: controller.signal }
        );
        setEnvironmentalData(response.data);
        setLoadingEnv(false);
      } catch (error) {
        if (isCancelled(error)) return;
        setEnvironmentalData(null);
        setEnvError(error);
        setLoadingEnv(false);
      }
    }, CONDITIONS_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.location, formData.date, formData.timeStart, envReloadToken]);

  // Baits for every selected fishing type; falls back to all baits when none
  // of the selected types has its own
  const selectedTypeIds = fishingTypes
    .filter(t => formData.fishingTypes.includes(t.name))
    .map(t => t.id);
  const typeBaits = allBaits.filter(b => selectedTypeIds.includes(b.fishing_type_id));
  const filteredBaits = selectedTypeIds.length > 0 && typeBaits.length > 0 ? typeBaits : allBaits;

  const selectLocation = (location) => {
    setFormData(prev => ({ ...prev, location: location.id, locationName: location.name }));
    setLocationSearch(location.name);
  };

  const handleFishCountChange = (value) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, fishCount: '', fishTypes: [], fishTypeOther: [] }));
      return;
    }
    const count = Math.min(MAX_FISH_COUNT, Math.max(0, parseInt(value, 10) || 0));
    // Keep species already picked instead of wiping them all
    setFormData(prev => ({
      ...prev,
      fishCount: count,
      fishTypes: Array.from({ length: count }, (_, i) => prev.fishTypes[i] || ''),
      fishTypeOther: Array.from({ length: count }, (_, i) => prev.fishTypeOther[i] || '')
    }));
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.location || !formData.timeStart || !formData.timeEnd) {
      toast.error('Please fill in all required fields including start and end times');
      return;
    }

    if (formData.fishingTypes.length === 0) {
      toast.error('Please select at least one type of fishing');
      return;
    }

    if (formData.fishingTypes.includes('other') && !formData.fishingTypeOther.trim()) {
      toast.error('Please specify the other fishing type');
      return;
    }

    if (formData.caughtFish === 'yes' && formData.fishCount > 0) {
      const filledFishCount = formData.fishTypes.filter(fish => fish && fish.trim() !== '').length;
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
      // "other" is only a UI placeholder — send the text the user typed instead
      const fishingTypesToSend = formData.fishingTypes
        .map(type => (type === 'other' ? formData.fishingTypeOther.trim() : type))
        .filter(Boolean);

      const submitData = {
        ...formData,
        caughtFish: formData.caughtFish === 'yes',
        fishingTypes: fishingTypesToSend,
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

      setFormData(makeInitialForm());
      setLocationSearch('');
      setEnvironmentalData(null);
      setFishInputsKey(key => key + 1);
    } catch (error) {
      // The API explains what was invalid; show that rather than a generic message
      toast.error(error.response?.data?.error || 'Failed to save fishing log');
    } finally {
      setLoading(false);
    }
  };

  // Fishing types as the angler would name them: the "other" chip is replaced
  // by whatever they typed
  const selectedNamedTypes = formData.fishingTypes
    .map(type => (type === 'other' ? formData.fishingTypeOther.trim() : type))
    .filter(Boolean);

  if (loadingDropdowns) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
        <span className="ml-2 text-gray-600">Loading options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {customDropdownType && (
        <CustomSubmissionModal dropdownType={customDropdownType} onClose={() => setCustomDropdownType(null)} />
      )}

      {!loadingDropdowns && locations.length === 0 && (
        <ErrorState message="Locations couldn't be loaded. Reload the page to try again." />
      )}

      <div className="grid md:grid-cols-4 gap-6">
        <div>
          <label htmlFor="log-date" className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
            Date
          </label>
          <input
            id="log-date"
            type="date"
            value={formData.date}
            max={localDateString()}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="log-time-start" className="block text-sm font-semibold text-gray-700 mb-2">
            Trip Start Time
          </label>
          <input
            id="log-time-start"
            type="time"
            value={formData.timeStart}
            onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="log-time-end" className="block text-sm font-semibold text-gray-700 mb-2">
            Trip End Time
          </label>
          <input
            id="log-time-end"
            type="time"
            value={formData.timeEnd}
            onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <LocationPicker
          locations={locations}
          search={locationSearch}
          setSearch={setLocationSearch}
          onSelect={selectLocation}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Types of Fishing <span className="font-normal text-gray-500">(select all you used)</span>
            </label>
            <button
              type="button"
              onClick={() => setCustomDropdownType('fishing_type')}
              className="px-2 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Add custom fishing type"
              aria-label="Add custom fishing type"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <FishingTypeSelector
            options={fishingTypes}
            selected={formData.fishingTypes}
            // A different set of types has different baits, so the bait resets
            onChange={(types) => setFormData({ ...formData, fishingTypes: types, jighead: '', softbait: '', bait: '', baitOther: '' })}
            otherValue={formData.fishingTypeOther}
            onOtherChange={(value) => setFormData({ ...formData, fishingTypeOther: value })}
          />
        </div>

        <div>
          <label htmlFor="log-fishing-method" className="block text-sm font-semibold text-gray-700 mb-2">Fishing Method</label>
          <div className="flex gap-2">
            <select
              id="log-fishing-method"
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
              onClick={() => setCustomDropdownType('fishing_method')}
              className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Add custom fishing method"
              aria-label="Add custom fishing method"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          {formData.fishingMethod === 'other' && (
            <input
              type="text"
              aria-label="Other fishing method"
              value={formData.fishingMethodOther}
              onChange={(e) => setFormData({ ...formData, fishingMethodOther: e.target.value })}
              placeholder="Specify fishing method..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
            />
          )}
        </div>
      </div>

      {/* Bait selection - covers every fishing type the angler selected */}
      {formData.fishingTypes.length > 0 && (
        <div className="space-y-4">
          <label htmlFor="log-bait" className="block text-sm font-semibold text-gray-700">
            Bait / Lure Used
            {selectedNamedTypes.length > 0 && (
              <span className="text-xs text-blue-600 ml-2">
                (showing baits for {selectedNamedTypes.join(', ')})
              </span>
            )}
          </label>

          {/* Dropshot has its own two-part rig */}
          {formData.fishingTypes.includes('Dropshot') && (
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                aria-label="Jighead"
                value={formData.jighead}
                onChange={(e) => setFormData({ ...formData, jighead: e.target.value })}
                placeholder="Jighead..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                aria-label="Softbait"
                value={formData.softbait}
                onChange={(e) => setFormData({ ...formData, softbait: e.target.value })}
                placeholder="Softbait..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                id="log-bait"
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
                onClick={() => setCustomDropdownType('bait')}
                className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title="Add custom bait"
                aria-label="Add custom bait"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {formData.bait === 'other' && (
              <input
                type="text"
                aria-label="Other bait"
                value={formData.baitOther}
                onChange={(e) => setFormData({ ...formData, baitOther: e.target.value })}
                placeholder="Specify other bait..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>
      )}

      <EnvironmentalPanel
        data={environmentalData}
        loading={loadingEnv}
        error={envError}
        onRetry={() => setEnvReloadToken(token => token + 1)}
      />

      <div>
        <label htmlFor="log-caught-fish" className="block text-sm font-semibold text-gray-700 mb-2">
          Did you catch fish?
        </label>
        <select
          id="log-caught-fish"
          value={formData.caughtFish}
          onChange={(e) => {
            setFormData({ ...formData, caughtFish: e.target.value, fishCount: '', fishTypes: [], fishTypeOther: [] });
            setFishInputsKey(key => key + 1);
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      {formData.caughtFish === 'yes' && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 space-y-4">
          <div>
            <label htmlFor="log-fish-count" className="block text-sm font-semibold text-gray-700 mb-2">
              How many fish?
            </label>
            <input
              id="log-fish-count"
              type="number"
              min="1"
              max={MAX_FISH_COUNT}
              value={formData.fishCount}
              onChange={(e) => handleFishCountChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {formData.fishCount > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="block text-sm font-semibold text-gray-700">
                  What fish did you catch?
                </span>
                <button
                  type="button"
                  onClick={() => setCustomDropdownType('fish_species')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add new species
                </button>
              </div>

              <FishSpeciesInputs
                key={fishInputsKey}
                count={formData.fishCount}
                fishTypes={formData.fishTypes}
                fishTypeOther={formData.fishTypeOther}
                species={fishSpecies}
                onChange={(fishTypes, fishTypeOther) => setFormData(prev => ({ ...prev, fishTypes, fishTypeOther }))}
              />
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="log-hook-setup" className="block text-sm font-semibold text-gray-700 mb-2">
            Hook Setup
          </label>
          <input
            id="log-hook-setup"
            type="text"
            value={formData.hookSetup}
            onChange={(e) => setFormData({ ...formData, hookSetup: e.target.value })}
            placeholder="e.g., Circle hook size 8/0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="log-notes" className="block text-sm font-semibold text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <input
            id="log-notes"
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
