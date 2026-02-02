import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, TrendingUp, Activity, Calendar, MapPin, 
  Fish as FishIcon, Target, Bell, Settings, 
  Mail, CheckCircle, XCircle, Eye, Trash2, Edit2, Plus,
  AlertTriangle, Info, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from '../Layout/Header';

const API_URL = process.env.REACT_APP_API_URL;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // User entries state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userEntries, setUserEntries] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userRef = useRef(null);

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [submissionCounts, setSubmissionCounts] = useState({ pending: 0, total: 0 });
  const [submissionFilter, setSubmissionFilter] = useState('all');

  // Contact messages state
  const [contactMessages, setContactMessages] = useState([]);
  const [contactFilter, setContactFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [contactStats, setContactStats] = useState({ unread: 0, total: 0 });

  // Dropdown management state
  const [dropdownTab, setDropdownTab] = useState('baits');
  const [fishingTypes, setFishingTypes] = useState([]);
  const [fishingMethods, setFishingMethods] = useState([]);
  const [fishingBaits, setFishingBaits] = useState([]);
  const [fishSpecies, setFishSpecies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({});

  // System logs state
  const [systemLogs, setSystemLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('all');

  // User management state
  const [userManagementSearch, setUserManagementSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Entry editing state
  const [editingEntry, setEditingEntry] = useState(null);
  const [editEntryData, setEditEntryData] = useState({});
  const [entryDropdownData, setEntryDropdownData] = useState({});

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'submissions', name: 'Review Submissions', icon: Bell },
    { id: 'logs', name: 'System Logs', icon: FileText },
    { id: 'contact', name: 'Contact Messages', icon: Mail },
    { id: 'dropdowns', name: 'Manage Dropdowns', icon: Settings },
    { id: 'users', name: 'User Management', icon: Users },
  ];

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
    if (activeTab === 'submissions') fetchSubmissions();
    else if (activeTab === 'contact') fetchContactMessages();
    else if (activeTab === 'dropdowns') fetchDropdownData();
    else if (activeTab === 'logs') fetchSystemLogs();
  }, [activeTab, submissionFilter, contactFilter, logFilter]);

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

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) {
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
      const response = await axios.get(`${API_URL}/admin/users`, getAuthHeaders());
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const status = submissionFilter === 'pending' ? 'pending' : undefined;
      const response = await axios.get(`${API_URL}/admin/submissions`, {
        ...getAuthHeaders(),
        params: { status }
      });
      setSubmissions(response.data.submissions || []);
      setSubmissionCounts(response.data.counts || { pending: 0, total: 0 });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const fetchContactMessages = async () => {
    try {
      const status = contactFilter !== 'all' ? contactFilter : undefined;
      const response = await axios.get(`${API_URL}/contact/all`, {
        ...getAuthHeaders(),
        params: { status }
      });
      setContactMessages(response.data.messages || []);
      
      const statsResponse = await axios.get(`${API_URL}/contact/stats/summary`, getAuthHeaders());
      setContactStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch contact messages:', error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [typesRes, methodsRes, baitsRes, speciesRes, locsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/fishing-types`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/fishing-methods`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/fishing-baits`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/fish-species`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/locations`, getAuthHeaders()).catch(() => ({ data: [] }))
      ]);
      // Handle both array and object responses
      setFishingTypes(Array.isArray(typesRes.data) ? typesRes.data : (typesRes.data?.fishingTypes || []));
      setFishingMethods(Array.isArray(methodsRes.data) ? methodsRes.data : (methodsRes.data?.fishingMethods || []));
      setFishingBaits(Array.isArray(baitsRes.data) ? baitsRes.data : (baitsRes.data?.fishingBaits || []));
      setFishSpecies(Array.isArray(speciesRes.data) ? speciesRes.data : (speciesRes.data?.fishSpecies || []));
      setLocations(Array.isArray(locsRes.data) ? locsRes.data : (locsRes.data?.locations || []));
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const level = logFilter !== 'all' ? logFilter : undefined;
      const response = await axios.get(`${API_URL}/admin/system-logs`, {
        ...getAuthHeaders(),
        params: { level, limit: 100 }
      });
      setSystemLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
    }
  };

  const fetchUserEntries = async (userId) => {
    setLoadingEntries(true);
    try {
      const response = await axios.get(`${API_URL}/admin/user-entries/${userId}`, getAuthHeaders());
      setUserEntries(response.data.logs);
    } catch (error) {
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

  const handleSubmissionAction = async (submissionId, status) => {
    try {
      await axios.patch(`${API_URL}/admin/submissions/${submissionId}`, { status }, getAuthHeaders());
      toast.success(`Submission ${status}`);
      fetchSubmissions();
    } catch (error) {
      toast.error('Failed to update submission');
    }
  };

  const handleUpdateMessageStatus = async (messageId, status) => {
    try {
      await axios.patch(`${API_URL}/contact/${messageId}/status`, { status }, getAuthHeaders());
      toast.success('Message status updated');
      fetchContactMessages();
      setSelectedMessage(null);
    } catch (error) {
      toast.error('Failed to update message status');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`${API_URL}/contact/${messageId}`, getAuthHeaders());
      toast.success('Message deleted');
      fetchContactMessages();
      setSelectedMessage(null);
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleToggleAdmin = async (userId, isAdmin) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${userId}/admin`, { isAdmin }, getAuthHeaders());
      toast.success(`Admin status ${isAdmin ? 'granted' : 'revoked'}`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, getAuthHeaders());
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user.id);
    setEditFormData({
      username: user.username,
      email: user.email
    });
  };

  const handleSaveUserEdit = async () => {
    try {
      await axios.patch(`${API_URL}/admin/users/${editingUser}`, editFormData, getAuthHeaders());
      toast.success('User updated successfully');
      setEditingUser(null);
      setEditFormData({});
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry.id);
    setEditEntryData({ ...entry });
    if (!entryDropdownData.fishingTypes) {
      loadEntryDropdownData();
    }
  };

  const loadEntryDropdownData = async () => {
    try {
      const [typesRes, methodsRes, baitsRes, speciesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/fishing-types`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/fishing-methods`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/fishing-baits`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/fish-species`, getAuthHeaders()).catch(() => ({ data: [] }))
      ]);
      setEntryDropdownData({
        fishingTypes: Array.isArray(typesRes.data) ? typesRes.data : (typesRes.data?.fishingTypes || []),
        fishingMethods: Array.isArray(methodsRes.data) ? methodsRes.data : (methodsRes.data?.fishingMethods || []),
        fishingBaits: Array.isArray(baitsRes.data) ? baitsRes.data : (baitsRes.data?.fishingBaits || []),
        fishSpecies: Array.isArray(speciesRes.data) ? speciesRes.data : (speciesRes.data?.fishSpecies || [])
      });
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const handleSaveEntryEdit = async () => {
    try {
      await axios.patch(`${API_URL}/admin/fishing-logs/${editingEntry}`, editEntryData, getAuthHeaders());
      toast.success('Entry updated successfully');
      setEditingEntry(null);
      setEditEntryData({});
      if (selectedUserId) {
        fetchUserEntries(selectedUserId);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/admin/fishing-logs/${entryId}`, getAuthHeaders());
      toast.success('Entry deleted');
      if (selectedUserId) {
        fetchUserEntries(selectedUserId);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete entry');
    }
  };

  const handleCancelEntryEdit = () => {
    setEditingEntry(null);
    setEditEntryData({});
  };

  const handleAddItem = async () => {
    if (!newItem.name && !newItem.local_name) {
      toast.error('Name is required');
      return;
    }
    try {
      let endpoint = '', payload = {};
      switch (dropdownTab) {
        case 'baits':
          endpoint = '/admin/fishing-baits';
          payload = { name: newItem.name, description: newItem.description, fishing_type_id: newItem.fishing_type_id };
          break;
        case 'types':
          endpoint = '/admin/fishing-types';
          payload = { name: newItem.name, description: newItem.description };
          break;
        case 'methods':
          endpoint = '/admin/fishing-methods';
          payload = { name: newItem.name, description: newItem.description };
          break;
        case 'species':
          endpoint = '/admin/fish-species';
          payload = { local_name: newItem.local_name, english_name: newItem.english_name, scientific_name: newItem.scientific_name, description: newItem.description };
          break;
        case 'locations':
          endpoint = '/admin/locations';
          payload = { name: newItem.name, region: newItem.region, type: newItem.type, latitude: newItem.latitude, longitude: newItem.longitude, description: newItem.description };
          break;
        default: return;
      }
      await axios.post(`${API_URL}${endpoint}`, payload, getAuthHeaders());
      toast.success('Item added');
      setNewItem({});
      fetchDropdownData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (id) => {
    try {
      let endpoint = '';
      switch (dropdownTab) {
        case 'baits': endpoint = `/admin/fishing-baits/${id}`; break;
        case 'types': endpoint = `/admin/fishing-types/${id}`; break;
        case 'methods': endpoint = `/admin/fishing-methods/${id}`; break;
        case 'species': endpoint = `/admin/fish-species/${id}`; break;
        case 'locations': endpoint = `/admin/locations/${id}`; break;
        default: return;
      }
      await axios.put(`${API_URL}${endpoint}`, editingItem, getAuthHeaders());
      toast.success('Item updated');
      setEditingItem(null);
      fetchDropdownData();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      let endpoint = '';
      switch (dropdownTab) {
        case 'baits': endpoint = `/admin/fishing-baits/${id}`; break;
        case 'types': endpoint = `/admin/fishing-types/${id}`; break;
        case 'methods': endpoint = `/admin/fishing-methods/${id}`; break;
        case 'species': endpoint = `/admin/fish-species/${id}`; break;
        case 'locations': endpoint = `/admin/locations/${id}`; break;
        default: return;
      }
      await axios.delete(`${API_URL}${endpoint}`, getAuthHeaders());
      toast.success('Item deleted');
      fetchDropdownData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const getDropdownItems = () => {
    switch (dropdownTab) {
      case 'baits': return fishingBaits;
      case 'types': return fishingTypes;
      case 'methods': return fishingMethods;
      case 'species': return fishSpecies;
      case 'locations': return locations;
      default: return [];
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform overview and statistics</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto mb-8 bg-white rounded-t-xl shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-6 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* User Entries Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
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
                  <div key={user.id} onClick={() => handleUserSelect(user)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div className="font-semibold text-gray-800">{user.username}</div>
                    <div className="text-xs text-gray-500">{user.email} • {user.log_count} logs</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {loadingEntries && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>}
          {editingEntry ? (
            <EditEntryModal entry={editEntryData} onSave={handleSaveEntryEdit} onCancel={handleCancelEntryEdit} onChange={setEditEntryData} dropdownData={entryDropdownData} />
          ) : userEntries && userEntries.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Entries ({userEntries.length})</h3>
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
                    {userEntries.map(entry => (
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
                            <button onClick={() => handleEditEntry(entry)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                            <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-600 hover:text-red-800">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && stats && <OverviewTab stats={stats} />}
        {activeTab === 'submissions' && <SubmissionsTab submissions={submissions} counts={submissionCounts} filter={submissionFilter} setFilter={setSubmissionFilter} onAction={handleSubmissionAction} onRefresh={fetchSubmissions} />}
        {activeTab === 'logs' && <SystemLogsTab logs={systemLogs} filter={logFilter} setFilter={setLogFilter} onRefresh={fetchSystemLogs} />}
        {activeTab === 'contact' && <ContactMessagesTab messages={contactMessages} stats={contactStats} filter={contactFilter} setFilter={setContactFilter} selectedMessage={selectedMessage} setSelectedMessage={setSelectedMessage} onUpdateStatus={handleUpdateMessageStatus} onDelete={handleDeleteMessage} onRefresh={fetchContactMessages} />}
        {activeTab === 'dropdowns' && <DropdownsTab activeDropdownTab={dropdownTab} setActiveDropdownTab={setDropdownTab} items={getDropdownItems()} fishingTypes={fishingTypes} newItem={newItem} setNewItem={setNewItem} editingItem={editingItem} setEditingItem={setEditingItem} onAdd={handleAddItem} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />}
        {activeTab === 'users' && <UserManagementTab users={users} search={userManagementSearch} setSearch={setUserManagementSearch} onToggleAdmin={handleToggleAdmin} onDelete={handleDeleteUser} onViewLogs={handleUserSelect} onEdit={handleEditUser} onSaveEdit={handleSaveUserEdit} onCancelEdit={handleCancelEdit} editingUser={editingUser} editFormData={editFormData} setEditFormData={setEditFormData} onRefresh={fetchUsers} />}
      </div>
    </div>
  );
};

const OverviewTab = ({ stats }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
          </div>
          <Target className="w-12 h-12 text-purple-500 opacity-80" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.topUsers?.filter(u => u.log_count > 0).length || 0}</p>
          </div>
          <Activity className="w-12 h-12 text-orange-500 opacity-80" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.recentLogs}</p>
          </div>
          <Calendar className="w-12 h-12 text-cyan-500 opacity-80" />
        </div>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-600" /> Most Active Users</h2>
        <div className="space-y-3">
          {stats.topUsers?.map((user, index) => (
            <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                <div><p className="font-semibold text-gray-900">{user.username}</p><p className="text-xs text-gray-500">{user.email}</p></div>
              </div>
              <div className="text-right"><p className="font-bold text-blue-600">{user.log_count}</p><p className="text-xs text-gray-500">trips</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-6 h-6 text-green-600" /> Popular Locations</h2>
        <div className="space-y-3">
          {stats.topLocations?.map((location, index) => (
            <div key={location.location_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                <p className="font-semibold text-gray-900">{location.location_name}</p>
              </div>
              <div className="text-right"><p className="font-bold text-green-600">{location.visit_count}</p><p className="text-xs text-gray-500">visits</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><FishIcon className="w-6 h-6 text-purple-600" /> Most Caught Species</h2>
        <div className="space-y-3">
          {stats.topFish?.map((fish, index) => (
            <div key={fish.fish_species} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                <p className="font-semibold text-gray-900">{fish.fish_species}</p>
              </div>
              <div className="text-right"><p className="font-bold text-purple-600">{fish.catch_count}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Fishing Method Distribution</h2>
        <div className="space-y-4">
          {stats.methodDistribution?.map((method) => {
            const total = stats.methodDistribution.reduce((sum, m) => sum + parseInt(m.count), 0);
            const percentage = total > 0 ? Math.round((method.count / total) * 100) : 0;
            return (
              <div key={method.fishing_method}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{method.fishing_method === 'land' ? '🏖️ Land' : '🚤 Boat'}</span>
                  <span className="text-gray-600">{method.count} trips ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full ${method.fishing_method === 'land' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const SubmissionsTab = ({ submissions, counts, filter, setFilter, onAction, onRefresh }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Custom Dropdown Submissions</h2>
      <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
    </div>
    <p className="text-gray-600 mb-4">Review user-submitted custom values for dropdowns</p>
    <div className="flex gap-4 mb-6">
      <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'pending' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>Pending ({counts.pending})</button>
      <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>All Submissions</button>
    </div>
    <div className="space-y-4">
      {submissions.length === 0 ? <p className="text-gray-500 text-center py-8">No submissions found</p> : submissions.map((s) => (
        <div key={s.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.submission_type === 'fish_species' ? 'bg-blue-100 text-blue-700' : s.submission_type === 'bait' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{s.submission_type.replace('_', ' ')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : s.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}{s.status}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{s.submitted_value}</h3>
              <p className="text-sm text-gray-600">Submitted by: <strong>{s.username}</strong> • {new Date(s.created_at).toLocaleString()}</p>
              {s.reviewed_by && <p className="text-sm text-gray-500">Reviewed by: {s.reviewer_username} on {new Date(s.reviewed_at).toLocaleString()}</p>}
            </div>
            {s.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => onAction(s.id, 'approved')} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle className="w-4 h-4" /> Approve</button>
                <button onClick={() => onAction(s.id, 'rejected')} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><XCircle className="w-4 h-4" /> Reject</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SystemLogsTab = ({ logs, filter, setFilter, onRefresh }) => {
  const [logFiles, setLogFiles] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [fileContent, setFileContent] = React.useState('');
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Fetch available log files
  React.useEffect(() => {
    const fetchLogFiles = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/log-files`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setLogFiles(response.data.files || []);
        if (response.data.files?.length > 0 && !selectedFile) {
          setSelectedFile(response.data.files[0]);
        }
      } catch (error) {
        console.error('Error fetching log files:', error);
        setLogFiles([]);
      }
    };
    fetchLogFiles();
  }, []);

  // Fetch selected file content
  React.useEffect(() => {
    if (!selectedFile) return;
    const fetchFileContent = async () => {
      setLoadingContent(true);
      try {
        const response = await axios.get(`${API_URL}/admin/log-files/${encodeURIComponent(selectedFile)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setFileContent(response.data.content || '');
      } catch (error) {
        console.error('Error fetching file content:', error);
        setFileContent('Error loading file content');
      } finally {
        setLoadingContent(false);
      }
    };
    fetchFileContent();
  }, [selectedFile]);

  const filteredContent = searchTerm 
    ? fileContent.split('\n').filter(line => line.toLowerCase().includes(searchTerm.toLowerCase())).join('\n')
    : fileContent;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4" style={{ height: '500px' }}>
        {/* File list on the left */}
        <div className="w-64 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b">
            Log Files
          </div>
          <div className="flex-1 overflow-y-auto">
            {logFiles.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">No log files found</p>
            ) : (
              logFiles.map((file) => (
                <div
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 ${
                    selectedFile === file ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  {file}
                </div>
              ))
            )}
          </div>
        </div>

        {/* File content on the right */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b flex justify-between items-center">
            <span>{selectedFile || 'Select a file'}</span>
            {searchTerm && <span className="text-sm font-normal text-gray-500">{filteredContent.split('\n').length} matching lines</span>}
          </div>
          <div className="flex-1 overflow-auto bg-gray-900 p-4">
            {loadingContent ? (
              <p className="text-gray-400">Loading...</p>
            ) : (
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{filteredContent || 'No content'}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactMessagesTab = ({ messages, stats, filter, setFilter, selectedMessage, setSelectedMessage, onUpdateStatus, onDelete, onRefresh }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Mail className="w-6 h-6" /> Contact Messages</h2>
          <div className="flex gap-4 mt-2 text-sm"><span className="text-red-600 font-semibold">{stats.unread} Unread</span><span className="text-gray-600">{stats.total} Total</span></div>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="flex gap-4 mb-6 flex-wrap">
        <input type="text" placeholder="Search by name, email, or subject..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
        {['all', 'unread', 'read', 'replied'].map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-lg font-semibold capitalize ${filter === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{status}</button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b-2 border-gray-200"><th className="text-left py-2 px-4">From</th><th className="text-left py-2 px-4">Subject</th><th className="text-left py-2 px-4">Status</th><th className="text-left py-2 px-4">Date</th><th className="text-right py-2 px-4">Actions</th></tr></thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id} className={`border-b border-gray-100 hover:bg-gray-50 ${msg.status === 'unread' ? 'bg-blue-50' : ''}`}>
                <td className="py-3 px-4"><div className="font-semibold">{msg.name}</div><div className="text-xs text-gray-500">{msg.email}</div></td>
                <td className="py-3 px-4">{msg.subject}</td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${msg.status === 'unread' ? 'bg-red-100 text-red-700' : msg.status === 'read' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{msg.status}</span></td>
                <td className="py-3 px-4 text-sm text-gray-500">{new Date(msg.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right"><button onClick={() => setSelectedMessage(msg)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-auto"><Eye className="w-4 h-4" /> View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {selectedMessage && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-xl font-bold">{selectedMessage.name}</h3><p className="text-sm text-gray-600">{selectedMessage.email}</p></div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedMessage.status === 'unread' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{selectedMessage.status}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4"><p>{selectedMessage.message}</p></div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2">Admin Notes</label><textarea className="w-full px-4 py-2 border rounded-lg" rows="3" placeholder="Add notes..." defaultValue={selectedMessage.admin_notes || ''} /></div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setSelectedMessage(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
            <button onClick={() => onDelete(selectedMessage.id)} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" /> Delete</button>
            <button onClick={() => onUpdateStatus(selectedMessage.id, 'replied')} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle className="w-4 h-4" /> Mark Replied</button>
            <button onClick={() => onUpdateStatus(selectedMessage.id, 'read')} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Eye className="w-4 h-4" /> Mark Read</button>
          </div>
        </div>
      </div>
    )}
  </div>
);

const DropdownsTab = ({ activeDropdownTab, setActiveDropdownTab, items, fishingTypes, newItem, setNewItem, editingItem, setEditingItem, onAdd, onUpdate, onDelete }) => {
  const dropdownTabs = [{ id: 'baits', name: 'Fishing Baits', icon: '🎣' }, { id: 'types', name: 'Fishing Types', icon: '🐟' }, { id: 'methods', name: 'Fishing Methods', icon: '⛵' }, { id: 'species', name: 'Fish Species', icon: '🐠' }, { id: 'locations', name: 'Locations', icon: '📍' }];
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex gap-2 mb-6 flex-wrap">
        {dropdownTabs.map((tab) => (<button key={tab.id} onClick={() => setActiveDropdownTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${activeDropdownTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><span>{tab.icon}</span>{tab.name}</button>))}
      </div>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Add New Item</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {activeDropdownTab === 'species' ? (
            <><input type="text" value={newItem.local_name || ''} onChange={(e) => setNewItem({ ...newItem, local_name: e.target.value })} placeholder="Local Name *" className="px-4 py-2 border rounded-lg" />
            <input type="text" value={newItem.english_name || ''} onChange={(e) => setNewItem({ ...newItem, english_name: e.target.value })} placeholder="English Name" className="px-4 py-2 border rounded-lg" />
            <input type="text" value={newItem.scientific_name || ''} onChange={(e) => setNewItem({ ...newItem, scientific_name: e.target.value })} placeholder="Scientific Name" className="px-4 py-2 border rounded-lg" /></>
          ) : activeDropdownTab === 'locations' ? (
            <><input type="text" value={newItem.name || ''} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Location Name *" className="px-4 py-2 border rounded-lg" />
            <input type="text" value={newItem.region || ''} onChange={(e) => setNewItem({ ...newItem, region: e.target.value })} placeholder="Region *" className="px-4 py-2 border rounded-lg" />
            <input type="number" step="0.00000001" value={newItem.latitude || ''} onChange={(e) => setNewItem({ ...newItem, latitude: e.target.value })} placeholder="Latitude *" className="px-4 py-2 border rounded-lg" />
            <input type="number" step="0.00000001" value={newItem.longitude || ''} onChange={(e) => setNewItem({ ...newItem, longitude: e.target.value })} placeholder="Longitude *" className="px-4 py-2 border rounded-lg" />
            <input type="text" value={newItem.type || ''} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })} placeholder="Type (e.g., Reef, Beach, River)" className="px-4 py-2 border rounded-lg" />
            <input type="text" value={newItem.description || ''} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="px-4 py-2 border rounded-lg" /></>
          ) : (
            <><input type="text" value={newItem.name || ''} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Name *" className="px-4 py-2 border rounded-lg" />
            <input type="text" value={newItem.description || ''} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="px-4 py-2 border rounded-lg" />
            {activeDropdownTab === 'baits' && (<select value={newItem.fishing_type_id || ''} onChange={(e) => setNewItem({ ...newItem, fishing_type_id: e.target.value })} className="px-4 py-2 border rounded-lg"><option value="">Select fishing type...</option>{fishingTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>)}</>
          )}
        </div>
        <button onClick={onAdd} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /> Add Item</button>
      </div>
      <div>
        <h3 className="font-semibold mb-4">Items ({items.length})</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">{item.local_name || item.name}</h4>
                {item.english_name && <p className="text-sm text-gray-600">{item.english_name}</p>}
                {item.fishing_type_name && <p className="text-xs text-blue-600">Type: {item.fishing_type_name}</p>}
                {activeDropdownTab === 'locations' && (
                  <div className="text-xs text-gray-600 mt-2 space-y-1">
                    {item.region && <p>Region: {item.region}</p>}
                    {item.type && <p>Location Type: {item.type}</p>}
                    {item.latitude && item.longitude && <p>Coords: {item.latitude}, {item.longitude}</p>}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingItem(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Edit Item</h3>
            <div className="space-y-4">
              {activeDropdownTab === 'species' ? (
                <><input type="text" value={editingItem.local_name || ''} onChange={(e) => setEditingItem({ ...editingItem, local_name: e.target.value })} placeholder="Local Name" className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" value={editingItem.english_name || ''} onChange={(e) => setEditingItem({ ...editingItem, english_name: e.target.value })} placeholder="English Name" className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" value={editingItem.scientific_name || ''} onChange={(e) => setEditingItem({ ...editingItem, scientific_name: e.target.value })} placeholder="Scientific Name" className="w-full px-4 py-2 border rounded-lg" /></>
              ) : (
                <><input type="text" value={editingItem.name || ''} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Name" className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" value={editingItem.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} placeholder="Description" className="w-full px-4 py-2 border rounded-lg" /></>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => onUpdate(editingItem.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserManagementTab = ({ users, search, setSearch, onToggleAdmin, onDelete, onViewLogs, onEdit, onSaveEdit, onCancelEdit, editingUser, editFormData, setEditFormData, onRefresh }) => {
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by username or email..." className="w-full px-4 py-2 border rounded-lg mb-6" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b-2 border-gray-200"><th className="text-left py-3 px-4">Username</th><th className="text-left py-3 px-4">Email</th><th className="text-center py-3 px-4">Logs</th><th className="text-center py-3 px-4">Admin</th><th className="text-left py-3 px-4">Actions</th></tr></thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold">
                  {editingUser === user.id ? (
                    <input
                      type="text"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                      className="w-full px-2 py-1 border rounded"
                    />
                  ) : (
                    user.username
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {editingUser === user.id ? (
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full px-2 py-1 border rounded"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="py-3 px-4 text-center">{user.log_count}</td>
                <td className="py-3 px-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_admin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{user.is_admin ? 'Yes' : 'No'}</span></td>
                <td className="py-3 px-4">
                  <div className="flex gap-2 text-sm flex-wrap">
                    {editingUser === user.id ? (
                      <>
                        <button onClick={onSaveEdit} className="text-green-600 hover:text-green-800 font-semibold">Save</button>
                        <button onClick={onCancelEdit} className="text-gray-600 hover:text-gray-800">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onViewLogs(user)} className="text-blue-600 hover:text-blue-800">Logs</button>
                        <button onClick={() => onEdit(user)} className="text-purple-600 hover:text-purple-800">Edit</button>
                        <button onClick={() => onToggleAdmin(user.id, !user.is_admin)} className={user.is_admin ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}>{user.is_admin ? 'Remove Admin' : 'Make Admin'}</button>
                        <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-800">Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EditEntryModal = ({ entry, onSave, onCancel, onChange, dropdownData }) => {
  const [fishSearch, setFishSearch] = useState('');
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const [filteredBaits, setFilteredBaits] = useState([]);

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
            onChange={(e) => handleChange('fish_count', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Fish Caught</label>
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
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {showFishDropdown && filteredFish.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredFish.map((fish) => (
                <div
                  key={fish.id}
                  onClick={() => handleAddFish(fish.local_name || fish.english_name)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
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

export default Admin;
