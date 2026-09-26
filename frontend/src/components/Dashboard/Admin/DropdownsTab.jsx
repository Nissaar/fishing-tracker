import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { adminAPI } from '../../../services/adminAPI';
import ErrorState from '../../Common/ErrorState';
import Modal from '../../Common/Modal';

// What each list's "add" form sends
const buildNewItemPayload = (kind, item) => {
  switch (kind) {
    case 'baits': return { name: item.name, description: item.description, fishing_type_id: item.fishing_type_id };
    case 'types':
    case 'methods': return { name: item.name, description: item.description };
    case 'species': return { local_name: item.local_name, english_name: item.english_name, scientific_name: item.scientific_name, description: item.description };
    case 'locations': return { name: item.name, region: item.region, type: item.type, latitude: item.latitude, longitude: item.longitude, description: item.description };
    default: return null;
  }
};

const DropdownsTab = ({ dropdowns }) => {
  const { lists, error, ensureLoaded, refresh } = dropdowns;
  const [activeDropdownTab, setActiveDropdownTab] = useState('baits');
  const [newItem, setNewItem] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const items = lists[activeDropdownTab] || [];
  const fishingTypes = lists.types;

  const onAdd = async () => {
    if (!newItem.name && !newItem.local_name) {
      toast.error('Name is required');
      return;
    }
    try {
      await adminAPI.addDropdownItem(activeDropdownTab, buildNewItemPayload(activeDropdownTab, newItem));
      toast.success('Item added');
      setNewItem({});
      await refresh(activeDropdownTab);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add item');
    }
  };

  const onUpdate = async () => {
    try {
      await adminAPI.updateDropdownItem(activeDropdownTab, editingItem.id, editingItem);
      toast.success('Item updated');
      setEditingItem(null);
      await refresh(activeDropdownTab);
    } catch (err) {
      toast.error('Failed to update item');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await adminAPI.deleteDropdownItem(activeDropdownTab, id);
      toast.success('Item deleted');
      await refresh(activeDropdownTab);
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const dropdownTabs = [{ id: 'baits', name: 'Fishing Baits', icon: '🎣' }, { id: 'types', name: 'Fishing Types', icon: '🐟' }, { id: 'methods', name: 'Fishing Methods', icon: '⛵' }, { id: 'species', name: 'Fish Species', icon: '🐠' }, { id: 'locations', name: 'Locations', icon: '📍' }];
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex gap-2 mb-6 flex-wrap">
        {dropdownTabs.map((tab) => (<button key={tab.id} onClick={() => { setActiveDropdownTab(tab.id); setNewItem({}); }} aria-pressed={activeDropdownTab === tab.id} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${activeDropdownTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><span>{tab.icon}</span>{tab.name}</button>))}
      </div>
      {error && <div className="mb-4"><ErrorState message="Some lists couldn't be loaded." onRetry={ensureLoaded} compact /></div>}
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
            {activeDropdownTab === 'baits' && (<select aria-label="Fishing type" value={newItem.fishing_type_id || ''} onChange={(e) => setNewItem({ ...newItem, fishing_type_id: e.target.value })} className="px-4 py-2 border rounded-lg"><option value="">Select fishing type...</option>{fishingTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>)}</>
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
                <button onClick={() => setEditingItem(item)} aria-label={`Edit ${item.local_name || item.name}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" aria-hidden="true" /></button>
                <button onClick={() => onDelete(item.id)} aria-label={`Delete ${item.local_name || item.name}`} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {editingItem && (
        <Modal title="Edit Item" onClose={() => setEditingItem(null)} maxWidth="max-w-lg">
          <div className="space-y-4">
            {activeDropdownTab === 'species' ? (
              <><input type="text" aria-label="Local Name" value={editingItem.local_name || ''} onChange={(e) => setEditingItem({ ...editingItem, local_name: e.target.value })} placeholder="Local Name" className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" aria-label="English Name" value={editingItem.english_name || ''} onChange={(e) => setEditingItem({ ...editingItem, english_name: e.target.value })} placeholder="English Name" className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" aria-label="Scientific Name" value={editingItem.scientific_name || ''} onChange={(e) => setEditingItem({ ...editingItem, scientific_name: e.target.value })} placeholder="Scientific Name" className="w-full px-4 py-2 border rounded-lg" /></>
            ) : (
              <><input type="text" aria-label="Name" value={editingItem.name || ''} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Name" className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" aria-label="Description" value={editingItem.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} placeholder="Description" className="w-full px-4 py-2 border rounded-lg" /></>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={onUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DropdownsTab;
