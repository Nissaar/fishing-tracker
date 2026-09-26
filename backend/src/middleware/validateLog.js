const { isValidDateStr, mauritiusToday } = require('../utils/mauritiusTime');

// Matches the fishing_logs_fish_count_range constraint in migration 002
const MAX_FISH_COUNT = 200;
const MAX_FISHING_TYPES = 10;

// Column widths from init.sql, so an over-long value is a 400, not a 500
const STRING_LIMITS = {
  hookSetup: 200,
  bait: 200,
  baitOther: 200,
  fishingTypeOther: 200,
  fishingMethod: 50,
  fishingMethodOther: 200,
  notes: 5000
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const parseCaughtFish = (value) => {
  if (value === true || value === 'yes' || value === 'true') return true;
  if (value === false || value === 'no' || value === 'false') return false;
  return null;
};

/**
 * Validates and normalises a new trip log in place. Leaderboard ranks come
 * straight from these values, so anything implausible is rejected rather
 * than stored.
 */
function validateNewLog(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (!isValidDateStr(body.date)) {
    errors.push('date must be a valid YYYY-MM-DD date');
  } else if (body.date > mauritiusToday()) {
    errors.push('date cannot be in the future');
  }

  const caughtFish = parseCaughtFish(body.caughtFish);
  if (caughtFish === null) {
    errors.push('caughtFish must be true or false');
  }

  let fishCount = 0;
  if (caughtFish) {
    fishCount = Number(body.fishCount);
    if (!Number.isInteger(fishCount) || fishCount < 1 || fishCount > MAX_FISH_COUNT) {
      errors.push(`fishCount must be a whole number from 1 to ${MAX_FISH_COUNT} when fish were caught`);
    }
  }

  const fishTypes = body.fishTypes === undefined ? [] : body.fishTypes;
  if (!Array.isArray(fishTypes) || fishTypes.some(fish => typeof fish !== 'string' || fish.length > 100)) {
    errors.push('fishTypes must be a list of species names');
  } else if (fishTypes.length > fishCount) {
    errors.push('fishTypes cannot list more fish than fishCount');
  }

  const fishingTypes = body.fishingTypes;
  if (fishingTypes !== undefined && (!Array.isArray(fishingTypes)
      || fishingTypes.length > MAX_FISHING_TYPES
      || fishingTypes.some(type => typeof type !== 'string' || type.length > 100))) {
    errors.push(`fishingTypes must be a list of at most ${MAX_FISHING_TYPES} names`);
  }

  for (const field of ['timeStart', 'timeEnd']) {
    if (body[field] && !TIME_PATTERN.test(body[field])) {
      errors.push(`${field} must be HH:MM`);
    }
  }
  // Equal times would break the valid_time_range constraint
  if (body.timeStart && body.timeEnd && body.timeStart.slice(0, 5) === body.timeEnd.slice(0, 5)) {
    errors.push('timeEnd must be different from timeStart');
  }

  for (const [field, max] of Object.entries(STRING_LIMITS)) {
    const value = body[field];
    if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > max)) {
      errors.push(`${field} must be text of at most ${max} characters`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  body.caughtFish = caughtFish;
  body.fishCount = fishCount;
  body.fishTypes = fishTypes;
  next();
}

module.exports = { validateNewLog, MAX_FISH_COUNT };
