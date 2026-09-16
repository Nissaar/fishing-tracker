import React from 'react';
import { MapPin, Users, Clock, Trash2, LogIn, LogOut, Calendar } from 'lucide-react';

// The API sends a plain YYYY-MM-DD; parsing it as a Date would shift the day
// for viewers in another timezone
const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (value) => (value ? value.substring(0, 5) : null);

const EventCard = ({ event, onJoin, onLeave, onDelete, busy }) => {
  const isFull = event.maxParticipants && event.participantCount >= event.maxParticipants;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-5 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-gray-900 truncate">{event.title}</h4>
          <p className="text-sm text-gray-500">
            by {event.isOrganiser ? 'you' : event.organiser.username}
          </p>
        </div>
        {event.isOrganiser && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(event)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete this event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-700 mb-4">
        <p className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          {formatDate(event.eventDate)}
        </p>
        {(event.timeStart || event.timeEnd) && (
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            {formatTime(event.timeStart) || '—'}
            {event.timeEnd ? ` → ${formatTime(event.timeEnd)}` : ''}
          </p>
        )}
        <p className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          {event.locationName}{event.region ? ` · ${event.region}` : ''}
        </p>
        <p className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          {event.participantCount} joined
          {event.maxParticipants ? ` / ${event.maxParticipants} max` : ''}
        </p>
      </div>

      {event.fishingTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {event.fishingTypes.map((type) => (
            <span key={type} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
              {type}
            </span>
          ))}
          {event.fishingMethod && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
              {event.fishingMethod === 'boat' ? '🚤 Boat' : '🏖️ Land'}
            </span>
          )}
        </div>
      )}

      {event.description && (
        <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{event.description}</p>
      )}

      {!event.isOrganiser && (
        event.hasJoined ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onLeave(event)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" /> Leave this trip
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || isFull}
            onClick={() => onJoin(event)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" /> {isFull ? 'Event is full' : 'Join this trip'}
          </button>
        )
      )}
    </div>
  );
};

export default EventCard;
