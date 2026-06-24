const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("🔍 Fetching a few traveler rows to inspect actual values...");
  const { data: travelers, error } = await supabase
    .from('travelers')
    .select('*')
    .limit(5);

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  if (travelers && travelers.length > 0) {
    travelers.forEach((t, i) => {
      console.log(`\nTraveler #${i+1}:`);
      console.log(`Nombre: ${t.nombre} ${t.apellidos}`);
      console.log(`Fecha Expedición: ${t.fecha_expedicion}`);
      console.log(`Fecha Caducidad: ${t.fecha_caducidad}`);
      console.log(`Firma snippet: ${t.firma ? t.firma.substring(0, 100) : 'null'}`);
    });
  } else {
    console.log("No travelers found.");
  }
}

run();
