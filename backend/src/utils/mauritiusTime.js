// Every date and hour the app reasons about is Mauritius local time
// (UTC+4, no daylight saving), whatever timezone the server runs in.
// Keep all conversions here so services can't each get them slightly wrong.

const TIME_ZONE = 'Indian/Mauritius';
const UTC_OFFSET = '+04:00';

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

/**
 * Local date and time in Mauritius for an instant.
 * @param {Date|string|number} instant
 * @returns {{dateStr: string, hour: number, minute: number, timeStr: string}}
 */
function toMauritiusParts(instant = new Date()) {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date: ${instant}`);
  }
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map(p => [p.type, p.value]));
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute,
    timeStr: `${parts.hour}:${parts.minute}`
  };
}

/** Today's date in Mauritius as YYYY-MM-DD. */
const mauritiusToday = () => toMauritiusParts(new Date()).dateStr;

/**
 * The instant a Mauritius wall-clock date and time refers to.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} [timeStr='00:00'] - HH:MM
 * @returns {Date}
 */
const fromMauritiusLocal = (dateStr, timeStr = '00:00') => new Date(`${dateStr}T${timeStr}:00${UTC_OFFSET}`);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in YYYY-MM-DD form. */
function isValidDateStr(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Add days to a YYYY-MM-DD date, independent of the server timezone. */
function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

module.exports = {
  TIME_ZONE,
  toMauritiusParts,
  mauritiusToday,
  fromMauritiusLocal,
  isValidDateStr,
  addDays
};
