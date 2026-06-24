const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'HM582Y32HZ';
  console.log(`🔍 Checking existing travelers for reservation ${code}...`);
  const { data: travelers, error } = await supabase
    .from('travelers')
    .select('*')
    .eq('reservation_code', code);

  if (error) {
    console.error("❌ Error fetching travelers:", error.message);
    process.exit(1);
  }

  console.log(`Encontrados: ${travelers.length} viajeros.`);
  travelers.forEach((t, i) => {
    console.log(`\n=================== VIAJERO #${i+1} ===================`);
    console.log(JSON.stringify(t, null, 2));
  });
}

run();
