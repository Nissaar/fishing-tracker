import React, { useState, useEffect } from 'react';
import { fishingAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Trash2, Eye, Search, Filter } from 'lucide-react';

const DataTable = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCaught, setFilterCaught] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterCaught]);

  const loadLogs = async () => {
    try {
      const response = await fishingAPI.getLogs(100);
      setLogs(response.data.logs);
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.bait?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.fish_types?.some((fish) => fish.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterCaught !== 'all') {
      filtered = filtered.filter((log) => 
        filterCaught === 'yes' ? log.caught_fish : !log.caught_fish
      );
    }

    setFilteredLogs(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;

    try {
      await fishingAPI.deleteLog(id);
      toast.success('Log deleted');
      loadLogs();
    } catch (error) {
      toast.error('Failed to delete log');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by location, bait, or fish type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterCaught}
          onChange={(e) => setFilterCaught(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Trips</option>
          <option value="yes">Successful Only</option>
          <option value="no">Unsuccessful Only</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Caught</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fish</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Moon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tide</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bait</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No fishing logs found. Start logging your trips!
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(log.log_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.location_name}</td>
                    <td className="px-4 py-3">
                      {log.caught_fish ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes ({log.fish_count})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.fish_types && log.fish_types.length > 0
                        ? log.fish_types.join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.moon_phase}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.sea_level?.split(' ')[0] || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.bait || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600 text-center">
        Showing {filteredLogs.length} of {logs.length} total logs
      </div>
    </div>
  );
};

export default DataTable;