const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const AIRBNB_ICAL_URL = 'https://www.airbnb.es/calendar/ical/669455999251966218.ics?t=4ec9256dab9c46a7ae5ddf5a7211208f';

async function check() {
  const response = await fetch(AIRBNB_ICAL_URL);
  let data = await response.text();

  // Unfold lines
  data = data.replace(/\r?\n[ \t]/g, '');

  const lines = data.split(/\r?\n/);
  let currentEvent = null;
  let inEvent = false;
  
  console.log("=== PARSING ALL AIRBNB EVENTS ===");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.uid && (currentEvent.uid.includes('HM') || (currentEvent.description && currentEvent.description.includes('HM')))) {
        const guestsMatch = (currentEvent.description || '').match(/(?:Number of guests|Guests|Huéspedes|Hospedes):\s*(\d+)/i);
        const parsedGuests = guestsMatch ? parseInt(guestsMatch[1], 10) : 2;
        
        console.log(`Reservation: ${currentEvent.uid.substring(0, 30)}`);
        console.log(`  Summary: ${currentEvent.summary}`);
        console.log(`  Description Snippet: ${currentEvent.description ? currentEvent.description.substring(0, 120) : 'N/A'}`);
        console.log(`  Regex matched guests: ${guestsMatch ? guestsMatch[1] : 'NONE'} (Parsed: ${parsedGuests})`);
        console.log("-----------------------------------------");
      }
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        currentEvent.start = line;
      } else if (line.startsWith('DTEND')) {
        currentEvent.end = line;
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12);
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith('UID:')) {
        currentEvent.uid = line.substring(4);
      }
    }
  }
}

check();
