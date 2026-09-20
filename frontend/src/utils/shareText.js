// Builds the ready-to-post Facebook text. The Kreol Morisien version is the
// default because the page audience is local anglers.

const SITE_URL = process.env.REACT_APP_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// The Nu Lapes App Facebook page. Overridable at build time without a code change.
export const FACEBOOK_PAGE_URL =
  process.env.REACT_APP_FACEBOOK_PAGE_URL ||
  'https://www.facebook.com/people/nulapessapp/61577446590617/';

const LABELS = {
  kreol: {
    headingWeek: '🎣 TOP 5 PESKER SA SEMENN-LA',
    headingMonth: '🎣 TOP 5 PESKER SA MWA-LA',
    trips: '🏆 Plis sorti lapes',
    fish: '🐟 Plis pwason trape',
    fishingTypes: '🎯 Plis diferan tip lapes',
    baits: '🪱 Plis diferan lapat',
    unitTrips: 'sorti',
    unitFish: 'pwason',
    unitTypes: 'tip lapes',
    unitBaits: 'lapat',
    empty: 'Pankor ena done pou sa peryod-la. Vinn premie!',
    newsTitle: '✨ NOUVO LOR SIT-LA:',
    news: [
      '✅ Enn sel sorti, plizir tip lapes — kas, jigging, kouler... tou dan mem log',
      '✅ Kree to prop sorti lapes direk lor sit-la',
      '✅ Dir kot ek kan to pe al peser — lezot pesker kapav zwenn twa',
      '✅ Klasman Top 5 pesker sak semenn ek sak mwa'
    ],
    cta: '👉 Enskri gratis ek koumans swiv to bann lapes:',
    tags: '#Lapes #Moris #FishingTrackerPro #Peser'
  },
  english: {
    headingWeek: '🎣 TOP 5 ANGLERS THIS WEEK',
    headingMonth: '🎣 TOP 5 ANGLERS THIS MONTH',
    trips: '🏆 Most trips logged',
    fish: '🐟 Most fish caught',
    fishingTypes: '🎯 Most fishing types used',
    baits: '🪱 Most baits used',
    unitTrips: 'trips',
    unitFish: 'fish',
    unitTypes: 'types',
    unitBaits: 'baits',
    empty: 'No data for this period yet. Be the first!',
    newsTitle: '✨ NEW ON THE SITE:',
    news: [
      '✅ One trip, several fishing types — casting, jigging, couler... all in one log',
      '✅ Create your own fishing event directly on the site',
      '✅ Say where and when you are going — other anglers can join you',
      '✅ Top 5 contributors every week and every month'
    ],
    cta: '👉 Sign up free and start tracking your catches:',
    tags: '#Fishing #Mauritius #FishingTrackerPro'
  }
};

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

const formatCategory = (title, entries, unit) => {
  if (!entries || entries.length === 0) return null;
  const lines = entries
    .slice(0, 5)
    .map((entry, index) => `${MEDALS[index] || `${index + 1}.`} ${entry.username} — ${entry.value} ${unit}`);
  return `${title}:\n${lines.join('\n')}`;
};

/**
 * @param {object} leaderboard        payload from GET /api/public/leaderboard
 * @param {'kreol'|'english'} language
 * @param {boolean} includeFeatures   include the launch announcement block.
 *                                    Worth dropping once the features are no
 *                                    longer news, so the weekly post stays fresh.
 */
export const buildLeaderboardPost = (leaderboard, language = 'kreol', includeFeatures = true) => {
  const t = LABELS[language] || LABELS.kreol;
  const period = leaderboard?.period === 'month' ? 'month' : 'week';
  const categories = leaderboard?.categories || {};

  const blocks = [
    period === 'month' ? t.headingMonth : t.headingWeek,
    formatCategory(t.trips, categories.trips, t.unitTrips),
    formatCategory(t.fish, categories.fish, t.unitFish),
    formatCategory(t.fishingTypes, categories.fishingTypes, t.unitTypes),
    formatCategory(t.baits, categories.baits, t.unitBaits)
  ].filter(Boolean);

  // Nothing ranked yet: still worth posting the feature announcement
  if (blocks.length === 1) blocks.push(t.empty);

  if (includeFeatures) blocks.push(`${t.newsTitle}\n${t.news.join('\n')}`);
  blocks.push(`${t.cta}\n${SITE_URL}`);
  blocks.push(t.tags);

  return blocks.join('\n\n');
};

export const getSiteUrl = () => SITE_URL;

export const buildFacebookShareUrl = (text) =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(text)}`;
