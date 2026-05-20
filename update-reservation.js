const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { error } = await supabase
    .from('reservations')
    .update({ check_in: '2026-05-20', nuki_pin: null })
    .eq('reservation_code', 'HMMR92E9DJ');

  if (error) {
    console.error(error);
  } else {
    console.log('Reservation HMMR92E9DJ updated successfully (check_in = 2026-05-20, nuki_pin = null).');
  }
}
run();
