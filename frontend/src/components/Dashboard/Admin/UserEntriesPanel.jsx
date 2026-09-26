import React, { useEffect, useRef, useState } from 'react';

const matchesUser = (user, term) => {
  const needle = term.trim().toLowerCase();
  return !needle
    || user.username.toLowerCase().includes(needle)
    || user.email.toLowerCase().includes(needle);
};

/**
 * Pick a user and list their trip entries, with edit and delete per entry.
 * `search` is controlled by the parent so "Logs" in User Management can fill it.
 */
const UserEntriesPanel = ({ users, search, setSearch, onSelectUser, entries, loading, onEditEntry, onDeleteEntry }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user => matchesUser(user, search));

  const selectUser = (user) => {
    setShowDropdown(false);
    onSelectUser(user);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setShowDropdown(false);
        }}
      >
        <label htmlFor="entries-user-search" className="block text-sm font-semibold text-gray-700 mb-2">Select User</label>
        <input
          id="entries-user-search"
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Start typing username or email..."
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown && filteredUsers.length > 0}
          aria-controls="entries-user-list"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {showDropdown && filteredUsers.length > 0 && (
          <ul id="entries-user-list" className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredUsers.map((user) => (
              <li key={user.id} className="border-b border-gray-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => selectUser(user)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <div className="font-semibold text-gray-800">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.email} • {user.log_count} logs</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>}
      {entries && entries.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Entries ({entries.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Location</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Bait</th>
                  <th className="text-center py-2 px-4 font-semibold text-gray-700">Caught</th>
                  <th className="text-center py-2 px-4 font-semibold text-gray-700">Count</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(entry.log_date + 'T00:00:00Z').toLocaleDateString(undefined, { timeZone: 'UTC' })}
                    </td>
                    <td className="py-3 px-4">{entry.location_name || entry.location}</td>
                    <td className="py-3 px-4">{entry.fishing_type || '-'}</td>
                    <td className="py-3 px-4">{entry.bait || '-'}</td>
                    <td className="py-3 px-4 text-center">{entry.caught_fish ? '✓' : '✗'}</td>
                    <td className="py-3 px-4 text-center">{entry.fish_count || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 text-sm">
                        <button onClick={() => onEditEntry(entry)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                        <button onClick={() => onDeleteEntry(entry.id)} className="text-red-600 hover:text-red-800">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default UserEntriesPanel;
