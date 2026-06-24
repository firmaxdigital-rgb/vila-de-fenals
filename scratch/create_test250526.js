const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Upserting test reservation TEST250526...");
  
  const { data, error } = await supabase.from('reservations').upsert([
    {
      reservation_code: 'TEST250526',
      check_in: '2026-05-26',
      check_out: '2026-05-27',
      total_guests: 0,
      has_deposit: false,
      deposit_amount: 0.00,
      deposit_paid: 0.00,
      is_tax_paid: false,
      is_registered: false,
      nuki_pin: null,
      platform: JSON.stringify({
        name: 'Airbnb',
        check_in_time: '14:00',
        check_out_time: '12:00'
      })
    }
  ], { onConflict: 'reservation_code' }).select();

  if (error) {
    console.error("Error creating TEST250526:", error);
  } else {
    console.log("TEST250526 reservation created/updated successfully:", data);
  }
}
run();
