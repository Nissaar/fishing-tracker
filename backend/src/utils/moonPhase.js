function calculateMoonPhase(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();
  
  let adjustedYear = year;
  let adjustedMonth = month;
  
  if (month < 3) {
    adjustedYear--;
    adjustedMonth += 12;
  }
  
  const c = Math.floor(adjustedYear / 100);
  const e = Math.floor(c / 4);
  const jd = 365.25 * (adjustedYear + 4716);
  const b = Math.floor(30.6001 * (adjustedMonth + 1));
  
  const julianDate = jd + b + day + e - 1524.5;
  
  const daysSinceNew = (julianDate - 2451549.5) / 29.53058867;
  const phase = (daysSinceNew % 1) * 29.53058867;
  
  let phaseName, phaseEmoji;
  
  if (phase < 1.84566) {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  } else if (phase < 5.53699) {
    phaseName = 'Waxing Crescent';
    phaseEmoji = '🌒';
  } else if (phase < 9.22831) {
    phaseName = 'First Quarter';
    phaseEmoji = '🌓';
  } else if (phase < 12.91963) {
    phaseName = 'Waxing Gibbous';
    phaseEmoji = '🌔';
  } else if (phase < 16.61096) {
    phaseName = 'Full Moon';
    phaseEmoji = '🌕';
  } else if (phase < 20.30228) {
    phaseName = 'Waning Gibbous';
    phaseEmoji = '🌖';
  } else if (phase < 23.99361) {
    phaseName = 'Last Quarter';
    phaseEmoji = '🌗';
  } else if (phase < 27.68493) {
    phaseName = 'Waning Crescent';
    phaseEmoji = '🌘';
  } else {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  }
  
  return {
    phase: phaseName,
    emoji: phaseEmoji,
    illumination: Math.round((1 - Math.cos(phase * Math.PI / 14.765)) * 50),
    age: Math.round(phase)
  };
}

module.exports = { calculateMoonPhase };