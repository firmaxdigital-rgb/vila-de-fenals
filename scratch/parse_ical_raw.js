const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const AIRBNB_ICAL_URL = 'https://www.airbnb.es/calendar/ical/669455999251966218.ics?t=4ec9256dab9c46a7ae5ddf5a7211208f';

async function check() {
  const response = await fetch(AIRBNB_ICAL_URL);
  let data = await response.text();
  console.log("=== RAW ICAL FEED LENGTH ===");
  console.log(data.length);
  console.log("=== RAW ICAL FEED SNIPPET ===");
  console.log(data.substring(0, 1000));
}

check();
