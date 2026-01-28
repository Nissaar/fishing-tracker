import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, TrendingUp, Activity, Calendar, MapPin, Fish as FishIcon, Target, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from '../Layout/Header';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userEntries, setUserEntries] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchUsers();
    const handleClickOutside = (event) => {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (users && userSearch.trim()) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users || []);
    }
  }, [userSearch, users]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load admin statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchUserEntries = async (userId) => {
    setLoadingEntries(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/user-entries/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserEntries(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch user entries:', error);
      toast.error('Failed to load user entries');
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUserId(user.id);
    setUserSearch(user.username);
    setShowUserDropdown(false);
    setUserEntries(null);
    fetchUserEntries(user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Failed to load statistics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform overview and statistics</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.overview.recentUsers} this month</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Logs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overview.totalLogs}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.overview.recentLogs} this month</p>
              </div>
              <FileText className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overview.successRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Fish caught vs trips</p>
              </div>
              <Target className="w-12 h-12 text-purple-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.topUsers.filter(u => u.log_count > 0).length}</p>
                <p className="text-xs text-gray-500 mt-1">With logged trips</p>
              </div>
              <Activity className="w-12 h-12 text-orange-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overview.recentLogs}</p>
                <p className="text-xs text-gray-500 mt-1">Fishing trips</p>
              </div>
              <Calendar className="w-12 h-12 text-cyan-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Top Users and Locations */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top Users */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Most Active Users
            </h2>
            <div className="space-y-3">
              {stats.topUsers.map((user, index) => (
                <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{user.log_count}</p>
                    <p className="text-xs text-gray-500">trips</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" />
              Popular Locations
            </h2>
            <div className="space-y-3">
              {stats.topLocations.map((location, index) => (
                <div key={location.location_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="font-semibold text-gray-900">{location.location_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{location.visit_count}</p>
                    <p className="text-xs text-gray-500">visits</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Fish and Fishing Methods */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Fish Species */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FishIcon className="w-6 h-6 text-purple-600" />
              Most Caught Species
            </h2>
            <div className="space-y-3">
              {stats.topFish.map((fish, index) => (
                <div key={fish.fish_species} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="font-semibold text-gray-900">{fish.fish_species}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{fish.catch_count}</p>
                    <p className="text-xs text-gray-500">catches</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fishing Method Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fishing Method Distribution</h2>
            <div className="space-y-4">
              {stats.methodDistribution.map((method) => {
                const total = stats.methodDistribution.reduce((sum, m) => sum + parseInt(m.count), 0);
                const percentage = Math.round((method.count / total) * 100);
                return (
                  <div key={method.fishing_method}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 capitalize">
                        {method.fishing_method === 'land' ? '🏖️ Land' : '🚤 Boat'}
                      </span>
                      <span className="text-gray-600">{method.count} trips ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${method.fishing_method === 'land' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Entries Section */}
      {users && users.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">View User Entries</h2>
          
          <div ref={userRef} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select User</label>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setShowUserDropdown(true)}
              placeholder="Start typing username or email..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            {showUserDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-semibold text-gray-800">{user.username}</div>
                    <div className="text-xs text-gray-500">
                      {user.email} • {user.log_count} logs
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loadingEntries && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}

          {userEntries && userEntries.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Entries ({userEntries.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-2 px-4 font-semibold text-gray-700">Location</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Caught Fish</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Count</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Activity</th>
                      <th className="text-left py-2 px-4 font-semibold text-gray-700">Bait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userEntries.map(entry => (
                      <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">
                          {new Date(entry.log_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{entry.location_name}</td>
                        <td className="py-3 px-4 text-center">
                          {entry.caught_fish ? '✓' : '✗'}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {entry.fish_count || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                            style={{
                              backgroundColor: entry.fish_activity === 'average' ? '#fef3c7' : '#f3f4f6',
                              color: entry.fish_activity === 'average' ? '#92400e' : '#6b7280'
                            }}>
                            {entry.fish_activity || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{entry.bait || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {userEntries && userEntries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No entries found for this user</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
