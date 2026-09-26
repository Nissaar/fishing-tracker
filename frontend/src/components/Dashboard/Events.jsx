import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CalendarPlus, Loader, X, Calendar } from 'lucide-react';
import api, { eventsAPI, fishingAPI } from '../../services/api';
import FishingTypeSelector from '../Common/FishingTypeSelector';
import EventCard from '../Common/EventCard';
import { localDateString } from '../../utils/dates';

// A function, not a constant: a tab left open overnight would otherwise keep
// defaulting to the day it was loaded
const makeEmptyForm = () => ({
  title: '',
  description: '',
  eventDate: localDateString(),
  timeStart: '06:00',
  timeEnd: '10:00',
  location: '',
  fishingTypes: [],
  fishingTypeOther: '',
  fishingMethod: 'land',
  maxParticipants: ''
});

const Events = () => {
  const [events, setEvents] = useState([]);
  const [scope, setScope] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(makeEmptyForm);
  const [locations, setLocations] = useState([]);
  const [fishingTypes, setFishingTypes] = useState([]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadEvents(scope);
  }, [scope]);

  const loadReferenceData = async () => {
    try {
      const [locationsRes, typesRes] = await Promise.all([
        fishingAPI.getLocations(),
        api.get('/fishing/dropdown/fishing-types')
      ]);
      setLocations(locationsRes.data.locations || []);
      setFishingTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
    } catch (error) {
      toast.error('Failed to load locations');
    }
  };

  const loadEvents = async (selectedScope) => {
    try {
      setLoading(true);
      const response = await eventsAPI.list(selectedScope === 'upcoming' ? undefined : selectedScope);
      setEvents(response.data.events || []);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.location || !formData.eventDate) {
      toast.error('Title, date and location are required');
      return;
    }

    // "other" is a UI placeholder — send what the user actually typed
    const fishingTypesToSend = formData.fishingTypes
      .map(type => (type === 'other' ? formData.fishingTypeOther.trim() : type))
      .filter(Boolean);

    setSubmitting(true);
    try {
      await eventsAPI.create({ ...formData, fishingTypes: fishingTypesToSend });
      toast.success('Event created — other anglers can now join you! 🎣');
      setFormData(makeEmptyForm());
      setShowForm(false);
      setScope('upcoming');
      loadEvents('upcoming');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (event) => {
    setBusyId(event.id);
    try {
      await eventsAPI.join(event.id);
      toast.success(`You joined "${event.title}"`);
      loadEvents(scope);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join');
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async (event) => {
    setBusyId(event.id);
    try {
      await eventsAPI.leave(event.id);
      toast.info(`You left "${event.title}"`);
      loadEvents(scope);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to leave');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? Everyone who joined will lose it.`)) return;
    setBusyId(event.id);
    try {
      await eventsAPI.remove(event.id);
      toast.success('Event deleted');
      loadEvents(scope);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Fishing Events</h3>
          <p className="text-gray-600">Say when and where you are going — other anglers can join you.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <CalendarPlus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Create event'}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Event title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Saturday morning casting at Grand Baie"
              maxLength={150}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.eventDate}
                min={localDateString()}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start time</label>
              <input
                type="time"
                value={formData.timeStart}
                onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End time</label>
              <input
                type="time"
                value={formData.timeEnd}
                onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a spot...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.region})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Method</label>
              <select
                value={formData.fishingMethod}
                onChange={(e) => setFormData({ ...formData, fishingMethod: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="land">🏖️ Land</option>
                <option value="boat">🚤 Boat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max anglers</label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                placeholder="No limit"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Types of fishing</label>
            <FishingTypeSelector
              options={fishingTypes}
              selected={formData.fishingTypes}
              onChange={(types) => setFormData({ ...formData, fishingTypes: types })}
              otherValue={formData.fishingTypeOther}
              onOtherChange={(value) => setFormData({ ...formData, fishingTypeOther: value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Details</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Meeting point, what to bring, who to contact..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <CalendarPlus className="w-5 h-5" />}
            Publish event
          </button>
        </div>
      )}

      <div className="inline-flex rounded-xl bg-gray-100 p-1">
        {[
          { id: 'upcoming', label: 'All upcoming' },
          { id: 'mine', label: 'Mine' },
          { id: 'past', label: 'Past' }
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setScope(option.id)}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
              scope === option.id ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">No events here yet</p>
          <p className="text-gray-500 text-sm">Create one and invite the community to join you.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              busy={busyId === event.id}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
