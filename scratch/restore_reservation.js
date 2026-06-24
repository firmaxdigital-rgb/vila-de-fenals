const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'HM582Y32HZ';
  console.log(`[RESTORE] Restoring total_guests to 5 for reservation: ${code}...`);

  const { data, error } = await supabase
    .from('reservations')
    .update({ total_guests: 5 })
    .eq('reservation_code', code)
    .select();

  if (error) {
    console.error("❌ Error updating reservation:", error);
  } else {
    console.log("✅ Successfully updated reservation! New state:", JSON.stringify(data, null, 2));
  }
}

run();
