const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const AIRBNB_ICAL_URL = 'https://www.airbnb.es/calendar/ical/669455999251966218.ics?t=4ec9256dab9c46a7ae5ddf5a7211208f';
const VRBO_ICAL_URL = 'https://www.vrbo.com/icalendar/e05e2860e5ec4787b14614afc00383b0.ics?nonTentative';

async function check() {
  // Check Airbnb
  console.log("=== CHECKING AIRBNB ===");
  let res = await fetch(AIRBNB_ICAL_URL);
  let data = await res.text();
  data = data.replace(/\r?\n[ \t]/g, '');
  let lines = data.split(/\r?\n/);
  let count = 0;
  for (let line of lines) {
    if (line.includes('HM582Y32HZ')) {
      console.log("Airbnb line found:", line);
      count++;
    }
  }
  console.log(`Airbnb occurrences of HM582Y32HZ: ${count}`);

  // Check VRBO
  console.log("=== CHECKING VRBO ===");
  res = await fetch(VRBO_ICAL_URL);
  data = await res.text();
  data = data.replace(/\r?\n[ \t]/g, '');
  lines = data.split(/\r?\n/);
  count = 0;
  for (let line of lines) {
    if (line.includes('HM582Y32HZ')) {
      console.log("VRBO line found:", line);
      count++;
    }
  }
  console.log(`VRBO occurrences of HM582Y32HZ: ${count}`);
}

check();
