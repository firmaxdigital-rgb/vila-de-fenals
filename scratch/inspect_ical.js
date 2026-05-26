const AIRBNB_ICAL_URL = 'https://www.airbnb.es/calendar/ical/669455999251966218.ics?t=4ec9256dab9c46a7ae5ddf5a7211208f';
const VRBO_ICAL_URL = 'https://www.vrbo.com/icalendar/e05e2860e5ec4787b14614afc00383b0.ics?nonTentative';

async function inspectIcal(url, platform) {
  try {
    console.log(`\n=================== INSPECTING ${platform.toUpperCase()} ===================`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${platform}: Status ${response.status}`);
      return;
    }
    
    let text = await response.text();
    // Unfold lines
    text = text.replace(/\r?\n[ \t]/g, '');
    
    const lines = text.split(/\r?\n/);
    let currentEvent = null;
    let inEvent = false;
    let eventCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
        eventCount++;
      } else if (line === 'END:VEVENT') {
        inEvent = false;
        if (eventCount <= 25) { // Print first 25 events details
          console.log(`Event #${eventCount}:`);
          console.log(`  UID:         ${currentEvent.uid}`);
          console.log(`  SUMMARY:     ${currentEvent.summary}`);
          console.log(`  DTSTART:     ${currentEvent.start}`);
          console.log(`  DTEND:       ${currentEvent.end}`);
          console.log(`  DESCRIPTION: ${currentEvent.description}`);
          console.log('----------------------------------------------------');
        }
      } else if (inEvent) {
        if (line.startsWith('DTSTART')) {
          currentEvent.start = line;
        } else if (line.startsWith('DTEND')) {
          currentEvent.end = line;
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = line;
        } else if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line;
        } else if (line.startsWith('UID:')) {
          currentEvent.uid = line;
        }
      }
    }
    console.log(`Total events found in ${platform}: ${eventCount}`);
  } catch (error) {
    console.error(`Error inspecting ${platform}:`, error);
  }
}

async function main() {
  await inspectIcal(AIRBNB_ICAL_URL, 'Airbnb');
  await inspectIcal(VRBO_ICAL_URL, 'VRBO');
}

main();
