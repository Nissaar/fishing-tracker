// A date as YYYY-MM-DD in the viewer's own timezone. toISOString() gives the
// UTC date instead, which in Mauritius (UTC+4) is still yesterday until 04:00.
export const localDateString = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
