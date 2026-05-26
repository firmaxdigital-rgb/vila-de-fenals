const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: res, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', 'TEST7GUESTS')
    .single();

  if (error) {
    console.error("Error fetching TEST7GUESTS:", error);
  } else {
    console.log("TEST7GUESTS current state in DB:", res);
  }

  const { data: travelers, error: travError } = await supabase
    .from('travelers')
    .select('*')
    .eq('reservation_code', 'TEST7GUESTS');

  if (travError) {
    console.error("Error fetching travelers:", travError);
  } else {
    console.log(`TEST7GUESTS travelers in DB count: ${travelers.length}`);
    travelers.forEach((t, i) => {
      console.log(`  Traveler #${i+1}: ${t.nombre} ${t.apellidos} - Doc: ${t.tipo_documento} (${t.numero_documento})`);
    });
  }
}

run();
