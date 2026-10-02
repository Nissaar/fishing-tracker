// A date as YYYY-MM-DD in the viewer's own timezone. toISOString() gives the
// UTC date instead, which in Mauritius (UTC+4) is still yesterday until 04:00.
export const localDateString = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// The calendar day of a DATE column. The API sends those as full timestamps
// ("2026-09-10T00:00:00.000Z"), so only the date part is kept; parsing it as a
// timestamp would show the day before in timezones west of UTC.
export const dateOnly = (value) => (typeof value === 'string' ? value.slice(0, 10) : '');

// A DATE column formatted for display, or '-' when there is none
export const formatDateOnly = (value) => {
  const day = dateOnly(value);
  if (!day) return '-';
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC' });
};
