function calculateMoonPhase(dateStr) {
  const date = new Date(dateStr);
  
  // Use UTC to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  
  // Calculate Julian Date
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  
  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
            Math.floor(y / 4) - Math.floor(y / 100) + 
            Math.floor(y / 400) - 32045;
  
  // Days since known new moon (Jan 6, 2000)
  const daysSince = jdn - 2451550.1;
  const newMoons = daysSince / 29.53058867;
  const phaseDecimal = newMoons % 1;
  
  // Convert to 0-29.53 day cycle
  const phase = phaseDecimal * 29.53058867;
  
  // Calculate accurate illumination using cosine function
  // Illumination follows a cosine curve through the lunar cycle
  const illumination = Math.round((1 - Math.cos((phaseDecimal * 2 * Math.PI))) * 50 * 10) / 10;
  
  let phaseName, phaseEmoji;
  
  // More accurate phase boundaries
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
    illumination: Math.max(0, Math.min(100, illumination)),
    age: Math.round(phase * 10) / 10,
    phaseValue: phase
  };
}

module.exports = { calculateMoonPhase };