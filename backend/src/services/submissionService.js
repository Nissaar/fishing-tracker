const pool = require('../config/database');

/**
 * Custom dropdown values waiting for an admin, from two sources:
 *
 * - Submitted with the "+" button: a row in custom_dropdown_submissions,
 *   with a numeric id.
 * - Typed into a trip log: an "Other" fishing type, method or bait, or a
 *   fish species that isn't in fish_species. These have no row until an
 *   admin reviews them and get ids derived from the log:
 *   fl_fishing_type_<logId>, fl_fishing_method_<logId>, fl_bait_<logId> and
 *   fl_fish_<logId>_<position in fish_types, from 1>.
 *
 * Reviewing a log-derived value records it as a custom_dropdown_submissions
 * row, so the decision sticks, and approving any value adds it to its
 * dropdown list.
 */

class SubmissionError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Where each kind of value becomes an option, and how it is matched
const OPTION_TABLES = {
  fishing_type: { table: 'fishing_types', match: ['name'] },
  fishing_method: { table: 'fishing_methods', match: ['name'] },
  bait: { table: 'fishing_baits', match: ['name'] },
  fish_species: { table: 'fish_species', match: ['local_name', 'english_name'] }
};

// Log columns holding a free-text "Other" value, by submission type
const LOG_OTHER_COLUMNS = {
  fishing_type: 'fishing_type_other',
  fishing_method: 'fishing_method_other',
  bait: 'bait_other'
};

const REVIEW_STATUSES = ['approved', 'rejected'];

// True when the value is already an option (active or not) for its type
const OPTION_EXISTS_SQL = (typeExpr, valueExpr) => `
  EXISTS (
    SELECT 1 FROM fishing_types t
     WHERE ${typeExpr} = 'fishing_type' AND lower(t.name) = lower(${valueExpr})
    UNION ALL
    SELECT 1 FROM fishing_methods m
     WHERE ${typeExpr} = 'fishing_method' AND lower(m.name) = lower(${valueExpr})
    UNION ALL
    SELECT 1 FROM fishing_baits b
     WHERE ${typeExpr} = 'bait' AND lower(b.name) = lower(${valueExpr})
    UNION ALL
    SELECT 1 FROM fish_species s
     WHERE ${typeExpr} = 'fish_species'
       AND lower(${valueExpr}) IN (lower(s.local_name), lower(s.english_name))
  )`;

const ALL_SUBMISSIONS_SQL = `
  WITH log_values AS (
    SELECT 'fl_fishing_type_' || fl.id AS id, fl.id AS log_id, fl.user_id,
           btrim(fl.fishing_type_other) AS submitted_value, 'fishing_type' AS submission_type, fl.created_at
      FROM fishing_logs fl
     WHERE btrim(COALESCE(fl.fishing_type_other, '')) <> ''
    UNION ALL
    SELECT 'fl_fishing_method_' || fl.id, fl.id, fl.user_id,
           btrim(fl.fishing_method_other), 'fishing_method', fl.created_at
      FROM fishing_logs fl
     WHERE btrim(COALESCE(fl.fishing_method_other, '')) <> ''
    UNION ALL
    SELECT 'fl_bait_' || fl.id, fl.id, fl.user_id,
           btrim(fl.bait_other), 'bait', fl.created_at
      FROM fishing_logs fl
     WHERE btrim(COALESCE(fl.bait_other, '')) <> ''
    UNION ALL
    -- One entry per species per log, even if it was caught several times
    SELECT * FROM (
      SELECT DISTINCT ON (fl.id, lower(btrim(fish.name)))
             'fl_fish_' || fl.id || '_' || fish.position, fl.id, fl.user_id,
             btrim(fish.name), 'fish_species', fl.created_at
        FROM fishing_logs fl
        CROSS JOIN LATERAL jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(fl.fish_types) = 'array' THEN fl.fish_types ELSE '[]'::jsonb END
        ) WITH ORDINALITY AS fish(name, position)
       WHERE btrim(fish.name) <> ''
       ORDER BY fl.id, lower(btrim(fish.name)), fish.position
    ) fish_values
  ),
  pending_log_values AS (
    SELECT lv.*
      FROM log_values lv
     WHERE NOT ${OPTION_EXISTS_SQL('lv.submission_type', 'lv.submitted_value')}
       -- A value reviewed once (from any log or the "+" button) isn't asked
       -- about again; the decision lives in custom_dropdown_submissions
       AND NOT EXISTS (
         SELECT 1 FROM custom_dropdown_submissions c
          WHERE c.submission_type = lv.submission_type
            AND c.status <> 'pending'
            AND lower(c.submitted_value) = lower(lv.submitted_value)
       )
  ),
  all_submissions AS (
    SELECT cds.id::text AS id, cds.user_id, cds.submitted_value, cds.submission_type, cds.status,
           cds.reviewed_by, cds.reviewed_at, cds.created_at
      FROM custom_dropdown_submissions cds
    UNION ALL
    SELECT plv.id, plv.user_id, plv.submitted_value, plv.submission_type, 'pending',
           NULL::integer, NULL::timestamp, plv.created_at
      FROM pending_log_values plv
  )
  SELECT s.*, u.username, u.email, reviewer.username AS reviewer_username
    FROM all_submissions s
    LEFT JOIN users u ON u.id = s.user_id
    LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
   ORDER BY s.created_at DESC
`;

/**
 * @param {string} [status] - only return submissions with this status
 * @returns {Promise<{submissions: object[], counts: {pending: number, total: number}}>}
 */
async function listSubmissions(status) {
  const { rows } = await pool.query(ALL_SUBMISSIONS_SQL);
  return {
    submissions: status ? rows.filter(row => row.status === status) : rows,
    counts: {
      pending: rows.filter(row => row.status === 'pending').length,
      total: rows.length
    }
  };
}

const parseLogValueId = (id) => {
  const other = /^fl_(fishing_type|fishing_method|bait)_(\d+)$/.exec(id);
  if (other) return { submissionType: other[1], logId: Number(other[2]) };
  const fish = /^fl_fish_(\d+)_(\d+)$/.exec(id);
  if (fish) return { submissionType: 'fish_species', logId: Number(fish[1]), position: Number(fish[2]) };
  return null;
};

/**
 * Make a value available in its dropdown: add it, or reactivate it if an
 * admin had switched it off. Matching ignores case so approving "carangue"
 * doesn't add a second "Carangue".
 */
async function addOption(client, submissionType, value, details = {}) {
  const { table, match } = OPTION_TABLES[submissionType];
  const matchSql = match.map(column => `lower(${column}) = lower($1)`).join(' OR ');

  const existing = await client.query(`SELECT id FROM ${table} WHERE ${matchSql} LIMIT 1`, [value]);
  if (existing.rows.length > 0) {
    await client.query(`UPDATE ${table} SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [existing.rows[0].id]);
    return;
  }

  if (submissionType === 'fish_species') {
    await client.query(
      'INSERT INTO fish_species (local_name, english_name, scientific_name, description) VALUES ($1, $2, $3, $4)',
      [details.localName || value, details.englishName || null, details.scientificName || null, details.description || null]
    );
  } else if (submissionType === 'bait') {
    await client.query(
      'INSERT INTO fishing_baits (name, description, fishing_type_id) VALUES ($1, $2, $3)',
      [value, details.description || null, details.fishingTypeId || null]
    );
  } else {
    await client.query(`INSERT INTO ${table} (name, description) VALUES ($1, $2)`, [value, details.description || null]);
  }
}

async function reviewStoredSubmission(client, id, status, adminNotes, adminId) {
  const { rows } = await client.query('SELECT * FROM custom_dropdown_submissions WHERE id = $1 FOR UPDATE', [id]);
  if (rows.length === 0) throw new SubmissionError(404, 'Submission not found');
  const submission = rows[0];
  if (submission.status !== 'pending') {
    throw new SubmissionError(409, `This submission was already ${submission.status}`);
  }

  const updated = await client.query(
    `UPDATE custom_dropdown_submissions
        SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *`,
    [status, adminNotes || null, adminId, id]
  );

  if (status === 'approved') {
    await addOption(client, submission.submission_type, submission.submitted_value.trim(), {
      description: submission.description,
      fishingTypeId: submission.fishing_type_id,
      localName: submission.local_name,
      englishName: submission.english_name,
      scientificName: submission.scientific_name
    });
  }
  return updated.rows[0];
}

async function reviewLogValue(client, parsed, status, adminNotes, adminId) {
  const { submissionType, logId, position } = parsed;
  const { rows } = await client.query(
    'SELECT id, user_id, fishing_type, fishing_type_other, fishing_method_other, bait_other, fish_types FROM fishing_logs WHERE id = $1',
    [logId]
  );
  if (rows.length === 0) throw new SubmissionError(404, 'Submission not found');
  const log = rows[0];

  const raw = submissionType === 'fish_species'
    ? (Array.isArray(log.fish_types) ? log.fish_types[position - 1] : null)
    : log[LOG_OTHER_COLUMNS[submissionType]];
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) throw new SubmissionError(404, 'Submission not found');

  // Serialises two admins reviewing the same value at once
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`submission:${submissionType}:${value.toLowerCase()}`]);

  const reviewed = await client.query(
    `SELECT status FROM custom_dropdown_submissions
      WHERE submission_type = $1 AND status <> 'pending' AND lower(submitted_value) = lower($2)
      LIMIT 1`,
    [submissionType, value]
  );
  if (reviewed.rows.length > 0) {
    throw new SubmissionError(409, `This submission was already ${reviewed.rows[0].status}`);
  }

  // A bait typed in a log belongs with the trip's (primary) fishing type
  let fishingTypeId = null;
  if (submissionType === 'bait' && log.fishing_type) {
    const type = await client.query('SELECT id FROM fishing_types WHERE lower(name) = lower($1)', [log.fishing_type]);
    fishingTypeId = type.rows[0]?.id || null;
  }

  const inserted = await client.query(
    `INSERT INTO custom_dropdown_submissions
       (user_id, submission_type, submitted_value, fishing_type_id, fishing_log_id, status, admin_notes, reviewed_by, reviewed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
     RETURNING *`,
    [log.user_id, submissionType, value, fishingTypeId, logId, status, adminNotes || null, adminId]
  );

  if (status === 'approved') {
    await addOption(client, submissionType, value, { fishingTypeId });
  }
  return inserted.rows[0];
}

/**
 * Approve or reject a submission by its id (numeric, or log-derived).
 * @throws {SubmissionError} with an HTTP status for bad ids, unknown or
 *   already-reviewed submissions
 */
async function reviewSubmission(id, status, adminNotes, adminId) {
  if (!REVIEW_STATUSES.includes(status)) {
    throw new SubmissionError(400, 'Invalid status. Use "approved" or "rejected"');
  }
  const parsed = /^\d+$/.test(id) ? null : parseLogValueId(id);
  if (!parsed && !/^\d+$/.test(id)) throw new SubmissionError(404, 'Submission not found');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const submission = parsed
      ? await reviewLogValue(client, parsed, status, adminNotes, adminId)
      : await reviewStoredSubmission(client, Number(id), status, adminNotes, adminId);
    await client.query('COMMIT');
    return submission;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { listSubmissions, reviewSubmission, SubmissionError };
