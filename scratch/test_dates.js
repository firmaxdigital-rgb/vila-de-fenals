function getSpainUtcDate(dateStr, localHour) {
  const checkDate = new Date(`${dateStr}T12:00:00Z`);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    hour12: false,
    hour: 'numeric'
  });
  
  const parts = formatter.formatToParts(checkDate);
  const hourPart = parts.find(p => p.type === 'hour');
  
  if (!hourPart) {
    const month = parseInt(dateStr.split('-')[1], 10);
    const offset = (month >= 4 && month <= 10) ? 2 : 1;
    const utcHour = localHour - offset;
    const finalDate = new Date(`${dateStr}T00:00:00Z`);
    finalDate.setUTCHours(utcHour, 0, 0, 0);
    return finalDate;
  }
  
  const madridHour = parseInt(hourPart.value, 10);
  const offset = madridHour - 12;
  const utcHour = localHour - offset;
  
  const finalDate = new Date(`${dateStr}T00:00:00Z`);
  finalDate.setUTCHours(utcHour, 0, 0, 0);
  
  return finalDate;
}

// Test dates: May 25th (DST - UTC+2) and December 25th (no DST - UTC+1)
const d1_in = getSpainUtcDate('2026-05-25', 14);
const d1_out = getSpainUtcDate('2026-05-26', 12);
const d2_in = getSpainUtcDate('2026-12-25', 14);
const d2_out = getSpainUtcDate('2026-12-26', 12);

console.log("MAY 25th Check-in (expected 12:00 UTC):", d1_in.toISOString());
console.log("MAY 26th Check-out (expected 10:00 UTC):", d1_out.toISOString());
console.log("DEC 25th Check-in (expected 13:00 UTC):", d2_in.toISOString());
console.log("DEC 26th Check-out (expected 11:00 UTC):", d2_out.toISOString());
