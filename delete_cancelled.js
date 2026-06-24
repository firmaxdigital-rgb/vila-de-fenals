const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NUKI_API_TOKEN = process.env.NUKI_API_TOKEN;
const NUKI_SMARTLOCK_ID = process.env.NUKI_SMARTLOCK_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteNukiKeypadCodesByReservation(reservationCode) {
  if (!NUKI_API_TOKEN || !NUKI_SMARTLOCK_ID) {
    console.warn("NUKI_API_TOKEN or NUKI_SMARTLOCK_ID not set.");
    return;
  }

  try {
    const response = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NUKI_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[Nuki Delete] Failed to fetch auths: ${response.status}`);
      return;
    }

    const auths = await response.json();
    const matchStr = `R-${reservationCode}`;
    const toDelete = auths.filter((auth) => auth.name && auth.name.includes(matchStr));

    console.log(`[Nuki Delete] Found ${toDelete.length} Nuki auths to delete for reservation ${reservationCode}`);

    for (const auth of toDelete) {
      const delResponse = await fetch(`https://api.nuki.io/smartlock/${NUKI_SMARTLOCK_ID}/auth/${auth.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${NUKI_API_TOKEN}`,
          'Accept': 'application/json'
        }
      });
      if (delResponse.ok) {
        console.log(`[Nuki Delete] Successfully deleted auth ${auth.id}`);
      }
    }
  } catch (err) {
    console.error("[Nuki Delete] Error:", err);
  }
}

async function run() {
  const code = 'HMPSHF5AM5';
  console.log(`Deleting cancelled reservation: ${code}`);

  // Delete from Nuki
  await deleteNukiKeypadCodesByReservation(code);

  // Delete from DB
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('reservation_code', code);

  if (error) {
    console.error("Error deleting from DB:", error);
  } else {
    console.log("Deleted from Supabase DB.");
  }

  process.exit(0);
}

run();
