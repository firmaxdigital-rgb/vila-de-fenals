const dateStr = "2026-06-10";
function getSpainUtcDate(dateStr, localHour) {
  // If dateStr includes 'T', split it
  const cleanDateStr = dateStr.split('T')[0];
  const checkDate = new Date(`${cleanDateStr}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    hour12: false,
    hour: 'numeric'
  });
  
  const parts = formatter.formatToParts(checkDate);
  const hourPart = parts.find(p => p.type === 'hour');
  
  if (!hourPart) {
    const month = parseInt(cleanDateStr.split('-')[1], 10);
    const offset = (month >= 4 && month <= 10) ? 2 : 1;
    const utcHour = localHour - offset;
    const finalDate = new Date(`${cleanDateStr}T00:00:00Z`);
    finalDate.setUTCHours(utcHour, 0, 0, 0);
    return finalDate;
  }
  
  let madridHour = parseInt(hourPart.value, 10);
  if (madridHour === 24) madridHour = 0;
  const offset = madridHour - 12;
  const utcHour = localHour - offset;
  
  const finalDate = new Date(`${cleanDateStr}T00:00:00Z`);
  finalDate.setUTCHours(utcHour, 0, 0, 0);
  
  return finalDate;
}

console.log(getSpainUtcDate("2026-06-10T00:00:00+00:00", 12));
console.log(getSpainUtcDate("2026-06-10", 12));
console.log(new Date() < getSpainUtcDate("2026-06-10", 12));
