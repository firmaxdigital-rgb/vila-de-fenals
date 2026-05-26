const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', 'HM582Y32HZ')
    .single();

  if (error) {
    console.error("Error fetching reservation:", error);
    return;
  }

  console.log("=== RESERVATION DETAILS ===");
  console.log(data);
}

check();
