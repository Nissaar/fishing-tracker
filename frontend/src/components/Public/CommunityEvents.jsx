import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Lock, Loader, Users, MapPin, CalendarPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { eventsAPI, publicAPI } from '../../services/api';
import EventCard from '../Common/EventCard';

// Plain YYYY-MM-DD from the API, built as a local date so the day never shifts
const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Visitors only get date, region and fishing types — enough to show the
// community is active, not enough to skip creating an account.
const TeaserList = ({ teaser }) => (
  <div className="max-w-3xl mx-auto">
    <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4">
        <p className="text-lg font-bold">
          🗓️ {teaser.upcomingTotal} fishing trip{teaser.upcomingTotal === 1 ? '' : 's'} planned by the community
        </p>
        {teaser.nextSevenDays > 0 && (
          <p className="text-blue-100 text-sm">{teaser.nextSevenDays} in the next 7 days</p>
        )}
      </div>

      <ul className="divide-y divide-gray-100">
        {teaser.events.map((event) => (
          <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">
                  {formatDate(event.eventDate)}
                  {event.timeStart ? ` · ${event.timeStart.substring(0, 5)}` : ''}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {event.region}
                  {event.fishingMethod ? ` · ${event.fishingMethod === 'boat' ? '🚤 Boat' : '🏖️ Land'}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {event.fishingTypes.slice(0, 2).map((type) => (
                <span key={type} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                  {type}
                </span>
              ))}
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-4 h-4" /> {event.participantCount}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-gray-50 px-6 py-5 text-center border-t border-gray-100">
        <p className="flex items-center justify-center gap-2 text-gray-700 font-semibold mb-3">
          <Lock className="w-4 h-4" /> Exact spot, organiser and joining are for members
        </p>
        <Link
          to="/register"
          className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
        >
          Create a free account to join 🎣
        </Link>
      </div>
    </div>
  </div>
);

const EmptyState = ({ isAuthenticated }) => (
  <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-10">
    <CalendarPlus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
    <h3 className="text-xl font-bold text-gray-900 mb-2">No trips planned yet</h3>
    <p className="text-gray-600 mb-6">
      Be the first to announce when and where you are going fishing — others can then join you.
    </p>
    <Link
      to={isAuthenticated ? '/dashboard' : '/register'}
      className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
    >
      {isAuthenticated ? 'Create an event' : 'Sign up free and create one'}
    </Link>
  </div>
);

const CommunityEvents = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [teaser, setTeaser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (isAuthenticated) {
        const response = await eventsAPI.list();
        setEvents(response.data.events || []);
      } else {
        const response = await publicAPI.getUpcomingEvents(5);
        setTeaser(response.data);
      }
    } catch (error) {
      // A failed events call should never break the landing page
      setTeaser(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleJoin = async (event) => {
    setBusyId(event.id);
    try {
      await eventsAPI.join(event.id);
      toast.success(`You joined "${event.title}"`);
      load();
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
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to leave');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (events.length === 0) return <EmptyState isAuthenticated />;
    return (
      <>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, 6).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              busy={busyId === event.id}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Create your own event
          </Link>
        </div>
      </>
    );
  }

  if (!teaser || teaser.events.length === 0) return <EmptyState isAuthenticated={false} />;

  return <TeaserList teaser={teaser} />;
};

export default CommunityEvents;
