import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, TrendingUp, Bell, Settings, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '../../Layout/Header';
import ErrorState from '../../Common/ErrorState';
import { adminAPI } from '../../../services/adminAPI';
import useAdminDropdowns from './useAdminDropdowns';
import OverviewTab from './OverviewTab';
import SubmissionsTab from './SubmissionsTab';
import SystemLogsTab from './SystemLogsTab';
import ContactMessagesTab from './ContactMessagesTab';
import DropdownsTab from './DropdownsTab';
import UserManagementTab from './UserManagementTab';
import UserEntriesPanel from './UserEntriesPanel';
import EditEntryModal from './EditEntryModal';

const TABS = [
  { id: 'overview', name: 'Overview', icon: TrendingUp },
  { id: 'submissions', name: 'Review Submissions', icon: Bell },
  { id: 'logs', name: 'System Logs', icon: FileText },
  { id: 'contact', name: 'Contact Messages', icon: Mail },
  { id: 'dropdowns', name: 'Manage Dropdowns', icon: Settings },
  { id: 'users', name: 'User Management', icon: Users },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Shared by the Dropdowns tab and the entry editor, loaded once
  const dropdowns = useAdminDropdowns();

  // User entries
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userEntries, setUserEntries] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editEntryData, setEditEntryData] = useState({});

  // User management
  const [userManagementSearch, setUserManagementSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const fetchStats = useCallback(async () => {
    try {
      setStatsError(null);
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
      } else {
        setStatsError('Failed to load admin statistics');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchStats, fetchUsers]);

  const fetchUserEntries = async (userId) => {
    setLoadingEntries(true);
    try {
      const response = await adminAPI.getUserEntries(userId);
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
    setUserEntries(null);
    fetchUserEntries(user.id);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry.id);
    setEditEntryData({ ...entry });
    dropdowns.ensureLoaded();
  };

  const handleCancelEntryEdit = () => {
    setEditingEntry(null);
    setEditEntryData({});
  };

  const handleSaveEntryEdit = async () => {
    try {
      await adminAPI.updateEntry(editingEntry, editEntryData);
      toast.success('Entry updated successfully');
      handleCancelEntryEdit();
      if (selectedUserId) fetchUserEntries(selectedUserId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    try {
      await adminAPI.deleteEntry(entryId);
      toast.success('Entry deleted');
      if (selectedUserId) fetchUserEntries(selectedUserId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete entry');
    }
  };

  const handleToggleAdmin = async (userId, isAdmin) => {
    try {
      await adminAPI.setAdmin(userId, isAdmin);
      toast.success(`Admin status ${isAdmin ? 'granted' : 'revoked'}`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user.id);
    setEditFormData({ username: user.username, email: user.email });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
  };

  const handleSaveUserEdit = async () => {
    try {
      await adminAPI.updateUser(editingUser, editFormData);
      toast.success('User updated successfully');
      handleCancelEdit();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  // The entry editor predates the shared lists and names them differently
  const entryDropdownData = {
    fishingTypes: dropdowns.lists.types,
    fishingMethods: dropdowns.lists.methods,
    fishingBaits: dropdowns.lists.baits,
    fishSpecies: dropdowns.lists.species
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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-6 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" aria-hidden="true" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* User Entries Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">View User Entries</h2>
          {editingEntry ? (
            <EditEntryModal entry={editEntryData} onSave={handleSaveEntryEdit} onCancel={handleCancelEntryEdit} onChange={setEditEntryData} dropdownData={entryDropdownData} />
          ) : (
            <UserEntriesPanel
              users={users}
              search={userSearch}
              setSearch={setUserSearch}
              onSelectUser={handleUserSelect}
              entries={userEntries}
              loading={loadingEntries}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && statsError && <ErrorState message={statsError} onRetry={fetchStats} />}
        {activeTab === 'overview' && stats && <OverviewTab stats={stats} />}
        {activeTab === 'submissions' && <SubmissionsTab />}
        {activeTab === 'logs' && <SystemLogsTab />}
        {activeTab === 'contact' && <ContactMessagesTab />}
        {activeTab === 'dropdowns' && <DropdownsTab dropdowns={dropdowns} />}
        {activeTab === 'users' && <UserManagementTab users={users} search={userManagementSearch} setSearch={setUserManagementSearch} onToggleAdmin={handleToggleAdmin} onDelete={handleDeleteUser} onViewLogs={handleUserSelect} onEdit={handleEditUser} onSaveEdit={handleSaveUserEdit} onCancelEdit={handleCancelEdit} editingUser={editingUser} editFormData={editFormData} setEditFormData={setEditFormData} onRefresh={fetchUsers} />}
      </div>
    </div>
  );
};

export default Admin;
