const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'HMMR92E9DJ';
  console.log(`Resetting test state for reservation ${code}...`);

  // 1. Delete travelers
  const { error: delErr } = await supabase
    .from('travelers')
    .delete()
    .eq('reservation_code', code);

  if (delErr) {
    console.error("Error deleting travelers:", delErr);
  } else {
    console.log("Deleted old registered travelers.");
  }

  // 2. Reset reservation columns
  const { error: updErr } = await supabase
    .from('reservations')
    .update({
      is_tax_paid: false,
      is_registered: false,
      nuki_pin: null
    })
    .eq('reservation_code', code);

  if (updErr) {
    console.error("Error updating reservation:", updErr);
  } else {
    console.log("Successfully reset reservation fields: is_tax_paid=false, is_registered=false, nuki_pin=null.");
  }
}

run();
