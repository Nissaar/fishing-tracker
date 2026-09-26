import React from 'react';
import { RefreshCw } from 'lucide-react';

const UserManagementTab = ({ users, search, setSearch, onToggleAdmin, onDelete, onViewLogs, onEdit, onSaveEdit, onCancelEdit, editingUser, editFormData, setEditFormData, onRefresh }) => {
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <input type="text" aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by username or email..." className="w-full px-4 py-2 border rounded-lg mb-6" />
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
                      aria-label="Username"
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
                      aria-label="Email"
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

export default UserManagementTab;
