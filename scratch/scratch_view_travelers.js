const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'TESTPROD';
  console.log(`🔍 Consultando viajeros para la reserva: ${code}...`);
  const { data: travelers, error } = await supabase
    .from('travelers')
    .select('*')
    .eq('reservation_code', code);

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  console.log(`Encontrados: ${travelers.length} viajeros.`);
  travelers.forEach((t, i) => {
    console.log(`\n=================== VIAJERO #${i+1} ===================`);
    console.log(`ID:               ${t.id}`);
    console.log(`Nombre:           ${t.nombre} ${t.apellidos}`);
    console.log(`Doc:              ${t.tipo_documento}: ${t.numero_documento}`);
    console.log(`F. Nacimiento:    ${t.fecha_nacimiento}`);
    console.log(`Parentesco:       ${t.parentesco}`);
    console.log(`Adulto Resp:      ${t.adulto_responsable}`);
    console.log(`Firma:            ${t.firma ? 'Firmado (base64)' : 'No firmado'}`);
  });
}

run();
