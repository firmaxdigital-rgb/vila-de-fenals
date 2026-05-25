const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("🔍 Consultando viajero A04075398 en la base de datos...");
  const { data: travelers, error } = await supabase
    .from('travelers')
    .select('*')
    .eq('numero_documento', 'A04075398');

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  console.log(`Encontrados: ${travelers.length} registros.`);
  travelers.forEach((t, i) => {
    console.log(`\n=================== REGISTRO #${i+1} ===================`);
    console.log(`ID:               ${t.id}`);
    console.log(`Nombre:           ${t.nombre}`);
    console.log(`Apellidos:        ${t.apellidos}`);
    console.log(`Doc:              ${t.tipo_documento}: ${t.numero_documento}`);
    console.log(`F. Nacimiento:    ${t.fecha_nacimiento}`);
    
    // Print all other database columns natively present
    Object.keys(t).forEach(k => {
      if (!['id', 'nombre', 'apellidos', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'firma'].includes(k)) {
        console.log(`${k.padEnd(17)}: ${t[k]}`);
      }
    });

    console.log(`\nFirma (Raw length: ${t.firma ? t.firma.length : 0} chars):`);
    if (t.firma) {
      if (t.firma.startsWith('{')) {
        try {
          const parsed = JSON.parse(t.firma);
          console.log("Parsed JSON in firma:");
          Object.keys(parsed).forEach(pk => {
            if (pk !== 'firma') {
              console.log(`  - ${pk}: ${parsed[pk]}`);
            } else {
              console.log(`  - firma (image base64): length ${parsed.firma ? parsed.firma.length : 0} chars`);
            }
          });
        } catch (e) {
          console.log("Raw string (not JSON):", t.firma.substring(0, 100) + "...");
        }
      } else {
        console.log("Raw string (not JSON):", t.firma.substring(0, 100) + "...");
      }
    }
  });
}

run();
