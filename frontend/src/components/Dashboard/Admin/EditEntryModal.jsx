import React, { useState } from 'react';

const MAX_FISH_COUNT = 200;

const EditEntryModal = ({ entry, onSave, onCancel, onChange, dropdownData }) => {
  const [fishSearch, setFishSearch] = useState('');
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const [filteredBaits, setFilteredBaits] = useState([]);
  const [activeFishIndex, setActiveFishIndex] = useState(-1);

  // Filter baits when fishing type changes
  React.useEffect(() => {
    if (entry.fishing_type && dropdownData.fishingBaits) {
      const selectedType = dropdownData.fishingTypes?.find(t => t.name === entry.fishing_type);
      if (selectedType) {
        const baits = dropdownData.fishingBaits.filter(b => b.fishing_type_id === selectedType.id);
        setFilteredBaits(baits);
      }
    } else {
      setFilteredBaits(dropdownData.fishingBaits || []);
    }
  }, [entry.fishing_type, dropdownData]);

  const handleChange = (field, value) => {
    onChange({ ...entry, [field]: value });
  };

  // Filter fish species based on search
  const filteredFish = React.useMemo(() => {
    if (!fishSearch) return [];
    return (dropdownData.fishSpecies || []).filter(fish =>
      (fish.local_name?.toLowerCase().includes(fishSearch.toLowerCase())) ||
      (fish.english_name?.toLowerCase().includes(fishSearch.toLowerCase())) ||
      (fish.scientific_name?.toLowerCase().includes(fishSearch.toLowerCase()))
    );
  }, [fishSearch, dropdownData.fishSpecies]);

  // Parse fish_types array for display
  const currentFish = React.useMemo(() => {
    if (entry.fish_types && Array.isArray(entry.fish_types)) {
      return entry.fish_types;
    }
    return [];
  }, [entry.fish_types]);

  const handleAddFish = (fishName) => {
    const newFish = Array.isArray(entry.fish_types) ? [...entry.fish_types] : [];
    if (!newFish.includes(fishName)) {
      newFish.push(fishName);
      onChange({ ...entry, fish_types: newFish });
    }
    setFishSearch('');
    setShowFishDropdown(false);
  };

  const handleRemoveFish = (index) => {
    const newFish = Array.isArray(entry.fish_types) ? [...entry.fish_types] : [];
    newFish.splice(index, 1);
    onChange({ ...entry, fish_types: newFish });
  };

  const handleFishKeyDown = (e) => {
    if (!showFishDropdown || filteredFish.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveFishIndex(prev => 
          prev < filteredFish.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveFishIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeFishIndex >= 0 && activeFishIndex < filteredFish.length) {
          const selectedFish = filteredFish[activeFishIndex];
          handleAddFish(selectedFish.local_name || selectedFish.english_name);
          setActiveFishIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowFishDropdown(false);
        setActiveFishIndex(-1);
        break;
      default:
        break;
    }
  };

  // Reset active index when filtered fish changes
  React.useEffect(() => {
    setActiveFishIndex(-1);
  }, [fishSearch]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mt-6 border-2 border-blue-500">
      <h3 className="text-2xl font-bold mb-6">Edit Fishing Entry</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={entry.log_date || ''}
            onChange={(e) => handleChange('log_date', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={entry.location_name || ''}
            onChange={(e) => handleChange('location_name', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Fishing Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fishing Type</label>
          <select
            value={entry.fishing_type || ''}
            onChange={(e) => handleChange('fishing_type', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {dropdownData.fishingTypes?.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>

        {/* Fishing Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fishing Method</label>
          <select
            value={entry.fishing_method || ''}
            onChange={(e) => handleChange('fishing_method', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {dropdownData.fishingMethods?.map(method => (
              <option key={method.id} value={method.name}>{method.name}</option>
            ))}
          </select>
        </div>

        {/* Bait - Filtered by Fishing Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bait</label>
          <select
            value={entry.bait || ''}
            onChange={(e) => handleChange('bait', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {filteredBaits.map(bait => (
              <option key={bait.id} value={bait.name}>{bait.name}</option>
            ))}
          </select>
        </div>

        {/* Caught Fish */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Caught Fish</label>
          <select
            value={entry.caught_fish ? 'yes' : 'no'}
            onChange={(e) => handleChange('caught_fish', e.target.value === 'yes')}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Fish Count */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fish Count</label>
          <input
            type="number"
            value={entry.fish_count || ''}
            // Matches the 0-200 limit the database enforces
            onChange={(e) => handleChange('fish_count', Math.min(MAX_FISH_COUNT, Math.max(0, parseInt(e.target.value, 10) || 0)))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max={MAX_FISH_COUNT}
          />
        </div>

        {/* Time Start */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
          <input
            type="time"
            value={entry.time_start || ''}
            onChange={(e) => handleChange('time_start', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time End */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
          <input
            type="time"
            value={entry.time_end || ''}
            onChange={(e) => handleChange('time_end', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Hook Setup */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Hook Setup</label>
          <input
            type="text"
            value={entry.hook_setup || ''}
            onChange={(e) => handleChange('hook_setup', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fish Species Selection */}
      <div className="mt-6">
        <label id="fish-caught-label" className="block text-sm font-semibold text-gray-700 mb-2">Fish Caught</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search fish species by local, english or scientific name..."
            value={fishSearch}
            onChange={(e) => {
              setFishSearch(e.target.value);
              setShowFishDropdown(true);
            }}
            onFocus={() => setShowFishDropdown(true)}
            onKeyDown={handleFishKeyDown}
            aria-labelledby="fish-caught-label"
            aria-expanded={showFishDropdown && filteredFish.length > 0}
            aria-controls="fish-dropdown-list"
            aria-activedescendant={activeFishIndex >= 0 ? `fish-option-${activeFishIndex}` : undefined}
            role="combobox"
            aria-autocomplete="list"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {showFishDropdown && filteredFish.length > 0 && (
            <div 
              id="fish-dropdown-list"
              role="listbox"
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredFish.map((fish, index) => (
                <div
                  key={fish.id}
                  id={`fish-option-${index}`}
                  role="option"
                  aria-selected={index === activeFishIndex}
                  onClick={() => handleAddFish(fish.local_name || fish.english_name)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    index === activeFishIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                  }`}
                >
                  <div className="font-semibold text-gray-800">{fish.local_name}</div>
                  {fish.english_name && <div className="text-xs text-gray-600">{fish.english_name}</div>}
                  {fish.scientific_name && <div className="text-xs text-gray-500">{fish.scientific_name}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Fish Display */}
        {currentFish.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentFish.map((fish, index) => (
              <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                <span>{fish}</span>
                <button
                  onClick={() => handleRemoveFish(index)}
                  aria-label={`Remove ${fish}`}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
        <textarea
          value={entry.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder="Additional notes..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end mt-8">
        <button onClick={onCancel} className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-semibold">Cancel</button>
        <button onClick={onSave} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Save Changes</button>
      </div>
    </div>
  );
};


export default EditEntryModal;
