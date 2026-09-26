import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Mail, CheckCircle, Eye, Trash2, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../../services/adminAPI';
import ErrorState from '../../Common/ErrorState';
import Modal from '../../Common/Modal';

const STATUSES = ['all', 'unread', 'read', 'replied'];

const matchesSearch = (msg, term) => {
  if (!term) return true;
  const needle = term.toLowerCase();
  return [msg.name, msg.email, msg.subject].some(value => value?.toLowerCase().includes(needle));
};

const ContactMessagesTab = () => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ unread: 0, total: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState(null);

  const loadMessages = useCallback(async () => {
    try {
      setError(null);
      const [messagesRes, statsRes] = await Promise.all([
        adminAPI.getContactMessages(filter !== 'all' ? filter : undefined),
        adminAPI.getContactStats()
      ]);
      setMessages(messagesRes.data.messages || []);
      setStats(statsRes.data);
    } catch (err) {
      setError("Couldn't load contact messages.");
    }
  }, [filter]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const openMessage = (msg) => {
    setSelectedMessage(msg);
    setAdminNotes(msg.admin_notes || '');
  };

  const closeMessage = () => setSelectedMessage(null);

  // Notes are saved together with the status change
  const handleUpdateStatus = async (status) => {
    try {
      await adminAPI.updateContactMessage(selectedMessage.id, status, adminNotes);
      toast.success('Message status updated');
      closeMessage();
      loadMessages();
    } catch (err) {
      toast.error('Failed to update message status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await adminAPI.deleteContactMessage(selectedMessage.id);
      toast.success('Message deleted');
      closeMessage();
      loadMessages();
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const visibleMessages = messages.filter(msg => matchesSearch(msg, search));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Mail className="w-6 h-6" aria-hidden="true" /> Contact Messages</h2>
            <div className="flex gap-4 mt-2 text-sm"><span className="text-red-600 font-semibold">{stats.unread} Unread</span><span className="text-gray-600">{stats.total} Total</span></div>
          </div>
          <button onClick={loadMessages} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh</button>
        </div>
        {error && <div className="mb-4"><ErrorState message={error} onRetry={loadMessages} compact /></div>}
        <div className="flex gap-4 mb-6 flex-wrap">
          <label htmlFor="contact-search" className="sr-only">Search messages</label>
          <input
            id="contact-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or subject..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          {STATUSES.map((status) => (
            <button key={status} onClick={() => setFilter(status)} aria-pressed={filter === status} className={`px-4 py-2 rounded-lg font-semibold capitalize ${filter === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{status}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b-2 border-gray-200"><th className="text-left py-2 px-4">From</th><th className="text-left py-2 px-4">Subject</th><th className="text-left py-2 px-4">Status</th><th className="text-left py-2 px-4">Date</th><th className="text-right py-2 px-4">Actions</th></tr></thead>
            <tbody>
              {visibleMessages.map((msg) => (
                <tr key={msg.id} className={`border-b border-gray-100 hover:bg-gray-50 ${msg.status === 'unread' ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-4"><div className="font-semibold">{msg.name}</div><div className="text-xs text-gray-500">{msg.email}</div></td>
                  <td className="py-3 px-4">{msg.subject}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${msg.status === 'unread' ? 'bg-red-100 text-red-700' : msg.status === 'read' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{msg.status}</span></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(msg.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right"><button onClick={() => openMessage(msg)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-auto"><Eye className="w-4 h-4" aria-hidden="true" /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleMessages.length === 0 && !error && (
            <p className="text-gray-500 text-center py-8">No messages found</p>
          )}
        </div>
      </div>
      {selectedMessage && (
        <Modal title={selectedMessage.name} onClose={closeMessage} maxWidth="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">{selectedMessage.email}</p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedMessage.status === 'unread' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{selectedMessage.status}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4"><p className="whitespace-pre-wrap">{selectedMessage.message}</p></div>
          <div className="mb-4">
            <label htmlFor="admin-notes" className="block text-sm font-semibold mb-2">Admin Notes</label>
            <textarea
              id="admin-notes"
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
              placeholder="Add notes... (saved when you mark the message read or replied)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end flex-wrap">
            <button onClick={closeMessage} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
            <button onClick={handleDelete} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" aria-hidden="true" /> Delete</button>
            <button onClick={() => handleUpdateStatus('replied')} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle className="w-4 h-4" aria-hidden="true" /> Mark Replied</button>
            <button onClick={() => handleUpdateStatus('read')} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Eye className="w-4 h-4" aria-hidden="true" /> Mark Read</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContactMessagesTab;
