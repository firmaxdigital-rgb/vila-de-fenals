const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'TEST7GUESTS';
  console.log(`Setting up clean test reservation: ${code}...`);

  // 1. Delete old travelers
  const { error: delErr } = await supabase
    .from('travelers')
    .delete()
    .eq('reservation_code', code);
  if (delErr) console.warn("warn deleting old travelers:", delErr);
  else console.log("Cleaned old travelers.");

  // 2. Delete and recreate reservation to ensure all fields are fresh
  const { error: resDelErr } = await supabase
    .from('reservations')
    .delete()
    .eq('reservation_code', code);
  if (resDelErr) console.warn("warn deleting old reservation:", resDelErr);

  const { error: insErr } = await supabase
    .from('reservations')
    .insert([
      {
        reservation_code: code,
        platform: 'PayComet Real-Test (7 Guests)',
        check_in: '2026-05-25',
        check_out: '2026-05-26',
        total_guests: 7,
        is_tax_paid: false,
        is_registered: false,
        nuki_pin: null
      }
    ]);

  if (insErr) {
    console.error("Error creating reservation:", insErr);
  } else {
    console.log("Successfully created TEST7GUESTS reservation: check_in=2026-05-25, check_out=2026-05-26, total_guests=7, is_tax_paid=false.");
  }
}

run();
