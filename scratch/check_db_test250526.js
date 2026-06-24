const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'TEST250526';
  console.log(`[CHECK] Fetching DB info for: ${code}...`);

  const { data: res, error: resErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', code);

  if (resErr) {
    console.error("❌ Error fetching reservation:", resErr);
  } else {
    console.log("✅ Reservation row(s):", res);
  }

  const { data: trav, error: travErr } = await supabase
    .from('travelers')
    .select('*')
    .eq('reservation_code', code);

  if (travErr) {
    console.error("❌ Error fetching travelers:", travErr);
  } else {
    console.log(`✅ Travelers registered (${trav?.length || 0}):`, trav?.map(t => ({ id: t.id, name: t.nombre })));
  }
}

run();
