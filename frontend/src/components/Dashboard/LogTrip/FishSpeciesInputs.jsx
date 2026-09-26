import React, { useEffect, useRef, useState } from 'react';

/**
 * One searchable combobox per fish caught. `fishTypes[i]` holds the chosen
 * species name; what the user has typed so far lives in local state.
 * The parent remounts this (via `key`) to clear it after a save.
 */
const FishSpeciesInputs = ({ count, fishTypes, fishTypeOther, species, onChange }) => {
  // Start from any species already chosen so changing the count keeps them
  const [searches, setSearches] = useState(() => fishTypes.map(name => name || ''));
  const [openIndex, setOpenIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  // Keep one search box per fish when the count changes
  useEffect(() => {
    setSearches(prev => Array.from({ length: count }, (_, i) => prev[i] ?? ''));
    setOpenIndex(prev => (prev !== null && prev >= count ? null : prev));
  }, [count]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchesFor = (index) => {
    const term = (searches[index] || '').toLowerCase();
    return term ? species.filter(fish => fish.display.toLowerCase().includes(term)) : species;
  };

  const choose = (index, name, isNewSpecies = false) => {
    const nextTypes = [...fishTypes];
    nextTypes[index] = name;
    const nextOther = [...(fishTypeOther || [])];
    nextOther[index] = isNewSpecies ? name : '';
    onChange(nextTypes, nextOther);
    setSearches(prev => prev.map((value, i) => (i === index ? name : value)));
    setOpenIndex(null);
    setActiveIndex(-1);
  };

  const handleKeyDown = (index, matches) => (e) => {
    if (openIndex !== index || matches.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < matches.length) {
          choose(index, matches[activeIndex].display);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpenIndex(null);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {Array.from({ length: count }).map((_, index) => {
        const searchValue = searches[index] || '';
        const matches = matchesFor(index);
        const isOpen = openIndex === index && (matches.length > 0 || Boolean(searchValue));
        const currentActive = openIndex === index ? activeIndex : -1;
        const isUnknown = searchValue && !matches.some(f => f.display.toLowerCase() === searchValue.toLowerCase());

        return (
          <div key={index} className="relative">
            <input
              type="text"
              placeholder={`Fish ${index + 1} (start typing...)`}
              value={searchValue}
              onChange={(e) => {
                const { value } = e.target;
                setSearches(prev => prev.map((v, i) => (i === index ? value : v)));
                setOpenIndex(index);
                setActiveIndex(-1);
              }}
              onFocus={() => { setOpenIndex(index); setActiveIndex(-1); }}
              // Tabbing out of the last field would otherwise leave its list open
              onBlur={(e) => {
                if (!containerRef.current?.contains(e.relatedTarget)) setOpenIndex(null);
              }}
              onKeyDown={handleKeyDown(index, matches)}
              aria-label={`Fish ${index + 1}`}
              aria-expanded={isOpen}
              aria-controls={`fish-dropdown-${index}`}
              aria-activedescendant={currentActive >= 0 ? `fish-option-${index}-${currentActive}` : undefined}
              role="combobox"
              aria-autocomplete="list"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />

            {isOpen && (
              <div
                id={`fish-dropdown-${index}`}
                role="listbox"
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {matches.map((fish, fishIdx) => (
                  <div
                    key={fish.id}
                    id={`fish-option-${index}-${fishIdx}`}
                    role="option"
                    aria-selected={fishIdx === currentActive}
                    // mousedown so the choice lands before the input loses focus
                    onMouseDown={(e) => { e.preventDefault(); choose(index, fish.display); }}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      fishIdx === currentActive ? 'bg-green-100' : 'hover:bg-green-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{fish.display}</div>
                    {fish.englishName && <div className="text-xs text-gray-600">{fish.englishName}</div>}
                    {fish.scientific && <div className="text-xs text-gray-500">{fish.scientific}</div>}
                  </div>
                ))}
                {isUnknown && (
                  <div
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => { e.preventDefault(); choose(index, searchValue, true); }}
                    className="px-4 py-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 font-semibold text-yellow-700"
                  >
                    ➕ Add "{searchValue}" as new species
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FishSpeciesInputs;
