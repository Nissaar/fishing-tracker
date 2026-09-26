import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

const matchesLocation = (loc, term) => {
  const needle = term.toLowerCase();
  return loc.name.toLowerCase().includes(needle) || (loc.region && loc.region.toLowerCase().includes(needle));
};

/**
 * Type-to-search location field. `search` is controlled by the parent so it
 * can be cleared after a save.
 */
const LocationPicker = ({ locations, search, setSearch, onSelect }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = search ? locations.filter(loc => matchesLocation(loc, search)) : locations;

  const select = (location) => {
    onSelect(location);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <label htmlFor="log-location" className="block text-sm font-semibold text-gray-700 mb-2">
        <MapPin className="w-4 h-4 inline mr-1" aria-hidden="true" />
        Location
      </label>
      <input
        id="log-location"
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing location..."
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && filtered.length > 0}
        aria-controls="log-location-list"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        required
      />

      {open && filtered.length > 0 && (
        <ul id="log-location-list" className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((location) => (
            <li key={location.id} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                onClick={() => select(location)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div className="font-semibold text-gray-800">{location.name}</div>
                <div className="text-xs text-gray-500">
                  {location.region} • {location.type}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationPicker;
