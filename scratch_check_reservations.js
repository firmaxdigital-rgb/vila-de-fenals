const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("🔍 Consultando esquema y columnas de la tabla 'reservations'...");
  
  // 1. Fetch one reservation to see its actual columns and values
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .limit(1);

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  if (reservations.length === 0) {
    console.log("No se encontraron reservas.");
    process.exit(0);
  }

  const res = reservations[0];
  console.log("\n================ COLUMNAS DETECTADAS EN RESERVATIONS ================");
  Object.keys(res).forEach(k => {
    console.log(`${k.padEnd(25)}: ${res[k]} (Tipo: ${typeof res[k]})`);
  });
  console.log("====================================================================\n");
}

run();
