import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Fish, Target, Bug, Loader } from 'lucide-react';
import { publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FacebookShare from './FacebookShare';

const CATEGORIES = [
  { key: 'trips', title: 'Most Trips Logged', unit: 'trips', icon: Trophy, color: 'amber' },
  { key: 'fish', title: 'Most Fish Caught', unit: 'fish', icon: Fish, color: 'blue' },
  { key: 'fishingTypes', title: 'Most Fishing Types', unit: 'types', icon: Target, color: 'purple' },
  { key: 'baits', title: 'Most Baits Used', unit: 'baits', icon: Bug, color: 'green' }
];

// Tailwind needs whole class names, so the per-category colours are spelled out
const COLOR_CLASSES = {
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  green: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' }
};

const MEDALS = ['🥇', '🥈', '🥉'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The API sends plain YYYY-MM-DD, formatted here without Date parsing so the
// displayed range does not shift with the viewer's timezone
const formatDay = (isoDate) => {
  const [, month, day] = isoDate.split('-');
  return `${parseInt(day, 10)} ${MONTHS[parseInt(month, 10) - 1]}`;
};

const formatRange = (leaderboard) => {
  if (!leaderboard?.startDate || !leaderboard?.endDate) return '';
  return `${formatDay(leaderboard.startDate)} – ${formatDay(leaderboard.endDate)}`;
};

const CategoryCard = ({ category, entries }) => {
  const colors = COLOR_CLASSES[category.color];
  const Icon = category.icon;

  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 ${colors.border} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-6 h-6 ${colors.icon}`} />
        <h4 className="font-bold text-gray-800">{category.title}</h4>
      </div>

      {entries && entries.length > 0 ? (
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${entry.rank <= 3 ? colors.bg : ''}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-6 text-center font-bold text-gray-500">
                  {MEDALS[entry.rank - 1] || entry.rank}
                </span>
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {entry.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
                <span className="font-semibold text-gray-800 truncate">{entry.username}</span>
              </span>
              <span className={`font-bold whitespace-nowrap ${colors.text}`}>
                {entry.value} <span className="text-xs font-medium text-gray-500">{category.unit}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-gray-500 py-4 text-center">No entries yet — log a trip to claim the top spot 🎣</p>
      )}
    </div>
  );
};

/**
 * @param showShare        offer the Facebook copy-text tool (admins only)
 * @param minParticipants  below this many ranked anglers the rankings are
 *                         replaced by a "be the first" prompt, so a thin
 *                         leaderboard never goes out to visitors. Admins always
 *                         see the real numbers.
 */
const Leaderboard = ({
  showShare = false,
  defaultPeriod = 'week',
  title = '🏆 Top Contributors',
  minParticipants = 0
}) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState(defaultPeriod);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = user?.is_admin === true;
  const tooThin = !isAdmin && (leaderboard?.participants ?? 0) < minParticipants;

  const load = useCallback(async (selectedPeriod) => {
    try {
      setLoading(true);
      setError(false);
      const response = await publicAPI.getLeaderboard(selectedPeriod);
      setLeaderboard(response.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">
          The anglers giving the most back to the community
          {leaderboard && <span className="block text-sm text-gray-500 mt-1">{formatRange(leaderboard)}</span>}
        </p>

        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          {['week', 'month'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={`px-6 py-2 rounded-lg font-semibold capitalize transition-colors ${
                period === option ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              This {option}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-gray-600 py-8">Leaderboard is unavailable right now.</p>
      ) : (
        <>
          {tooThin ? (
            <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-10">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                The {period}'s ranking is still open
              </h4>
              <p className="text-gray-600 mb-6">
                {leaderboard?.participants === 0
                  ? 'Nobody has logged a trip yet this ' + period + '. Log the first one and you take the top spot.'
                  : `${leaderboard.participants} angler${leaderboard.participants === 1 ? '' : 's'} logging so far — there is still room in the top 5.`}
              </p>
              <Link
                to="/register"
                className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
              >
                Join and claim a place 🎣
              </Link>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {CATEGORIES.map((category) => (
                  <CategoryCard
                    key={category.key}
                    category={category}
                    entries={leaderboard?.categories?.[category.key]}
                  />
                ))}
              </div>

              {leaderboard && (
                <p className="text-center text-sm text-gray-500">
                  {leaderboard.participants} angler{leaderboard.participants === 1 ? '' : 's'} ·{' '}
                  {leaderboard.totals.trips} trip{leaderboard.totals.trips === 1 ? '' : 's'} ·{' '}
                  {leaderboard.totals.fish} fish logged this {leaderboard.period}
                </p>
              )}
            </>
          )}

          {showShare && isAdmin && <FacebookShare leaderboard={leaderboard} compact />}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
