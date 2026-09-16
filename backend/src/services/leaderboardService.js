const pool = require('../config/database');

const PERIODS = ['week', 'month'];

// Mauritius (UTC+4) is the reference timezone for "this week" / "this month"
const MAURITIUS_TZ = 'Indian/Mauritius';

// Normalises a log's fishing types: the JSONB array when present, otherwise the
// legacy single fishing_type column. Same fallback logic as the app uses.
const FISHING_TYPES_EXPR = `
  CASE
    WHEN jsonb_typeof(pl.fishing_types) = 'array' AND jsonb_array_length(pl.fishing_types) > 0
      THEN pl.fishing_types
    WHEN pl.fishing_type IS NOT NULL AND btrim(pl.fishing_type) <> ''
      THEN to_jsonb(ARRAY[pl.fishing_type])
    ELSE '[]'::jsonb
  END
`;

// "other" in the bait column means the real value lives in bait_other
const BAIT_EXPR = `
  CASE
    WHEN LOWER(btrim(COALESCE(bait, ''))) IN ('', 'other')
      THEN NULLIF(btrim(COALESCE(bait_other, '')), '')
    ELSE btrim(bait)
  END
`;

const getPeriodRange = async (period) => {
  const trunc = period === 'month' ? 'month' : 'week';
  const { rows } = await pool.query(
    // Returned as plain YYYY-MM-DD text so the boundaries do not shift when a
    // browser in another timezone parses them
    `SELECT
       to_char(date_trunc($1::text, (now() AT TIME ZONE $2::text)), 'YYYY-MM-DD') AS start_date,
       to_char(date_trunc($1::text, (now() AT TIME ZONE $2::text))
         + CASE WHEN $1::text = 'month' THEN interval '1 month' ELSE interval '1 week' END
         - interval '1 day', 'YYYY-MM-DD') AS end_date`,
    [trunc, MAURITIUS_TZ]
  );
  return rows[0];
};

const rankTop = (rows, valueKey, limit = 5) =>
  rows
    .filter(row => Number(row[valueKey]) > 0)
    .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]) || Number(b.trips) - Number(a.trips))
    .slice(0, limit)
    .map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.username,
      avatarUrl: row.avatar_url,
      value: Number(row[valueKey]),
      trips: Number(row.trips),
      fish: Number(row.fish),
      fishingTypes: Number(row.fishing_types_count),
      baits: Number(row.baits_count)
    }));

/**
 * Top contributors for the current week or month, ranked four ways:
 * trips logged, fish caught, variety of fishing types, variety of baits.
 */
const getLeaderboard = async (period = 'week', limit = 5) => {
  const safePeriod = PERIODS.includes(period) ? period : 'week';
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
  const { start_date: startDate, end_date: endDate } = await getPeriodRange(safePeriod);

  const query = `
    WITH period_logs AS (
      SELECT fl.*, u.username, u.avatar_url
      FROM fishing_logs fl
      JOIN users u ON u.id = fl.user_id
      WHERE fl.log_date BETWEEN $1 AND $2
    ),
    type_variety AS (
      SELECT pl.user_id, COUNT(DISTINCT btrim(t.value)) AS fishing_types_count
      FROM period_logs pl
      CROSS JOIN LATERAL jsonb_array_elements_text(${FISHING_TYPES_EXPR}) AS t(value)
      WHERE btrim(t.value) <> '' AND LOWER(btrim(t.value)) <> 'other'
      GROUP BY pl.user_id
    ),
    bait_variety AS (
      SELECT user_id, COUNT(DISTINCT ${BAIT_EXPR}) AS baits_count
      FROM period_logs
      WHERE ${BAIT_EXPR} IS NOT NULL
      GROUP BY user_id
    )
    SELECT
      pl.user_id,
      pl.username,
      pl.avatar_url,
      COUNT(*) AS trips,
      COALESCE(SUM(pl.fish_count), 0) AS fish,
      COALESCE(MAX(tv.fishing_types_count), 0) AS fishing_types_count,
      COALESCE(MAX(bv.baits_count), 0) AS baits_count
    FROM period_logs pl
    LEFT JOIN type_variety tv ON tv.user_id = pl.user_id
    LEFT JOIN bait_variety bv ON bv.user_id = pl.user_id
    GROUP BY pl.user_id, pl.username, pl.avatar_url
  `;

  const { rows } = await pool.query(query, [startDate, endDate]);

  return {
    period: safePeriod,
    startDate,
    endDate,
    participants: rows.length,
    totals: {
      trips: rows.reduce((sum, r) => sum + Number(r.trips), 0),
      fish: rows.reduce((sum, r) => sum + Number(r.fish), 0)
    },
    categories: {
      trips: rankTop(rows, 'trips', safeLimit),
      fish: rankTop(rows, 'fish', safeLimit),
      fishingTypes: rankTop(rows, 'fishing_types_count', safeLimit),
      baits: rankTop(rows, 'baits_count', safeLimit)
    }
  };
};

module.exports = { getLeaderboard, PERIODS };
