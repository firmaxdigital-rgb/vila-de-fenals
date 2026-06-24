const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'TEST250526';
  console.log(`[RESET] Starting full reset for test reservation: ${code}...`);

  // 1. Delete all registered travelers
  const { error: delErr } = await supabase
    .from('travelers')
    .delete()
    .eq('reservation_code', code);

  if (delErr) {
    console.error("❌ Error deleting travelers:", delErr);
  } else {
    console.log("✅ Deleted all travelers registered under TEST250526.");
  }

  // 2. Update reservation columns to a fresh test check-in state
  const { data, error: updErr } = await supabase
    .from('reservations')
    .update({
      is_tax_paid: false,
      is_registered: false,
      nuki_pin: null,
      deposit_paid: 0.00,
      deposit_amount: 0.00, // No fianza by default
      has_deposit: false,    // No fianza by default
      total_guests: 2,       // 2 travelers required
      check_in: '2026-05-26',
      check_out: '2026-05-27',
      platform: JSON.stringify({
        name: 'Airbnb',
        check_in_time: '16:00',
        check_out_time: '10:00'
      })
    })
    .eq('reservation_code', code)
    .select();

  if (updErr) {
    console.error("❌ Error resetting reservation row:", updErr);
  } else {
    console.log("✅ Successfully reset TEST250526 reservation row:", data);
  }
}

run();
