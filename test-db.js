const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  const code = 'HM2BFZYBMD';
  console.log("Searching for:", code);
  
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', code)
    .single();

  console.log("Data:", reservation);
  console.log("Error:", error);
}

run();
