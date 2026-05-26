const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  // Let's get today's date in local Spain YYYY-MM-DD
  const today = '2026-05-25'; // Using the active user date context

  console.log(`Fetching reservations on or after: ${today}`);

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .gte('check_in', today)
    .order('check_in', { ascending: true });

  if (error) {
    console.error("Error fetching reservations:", error);
    process.exit(1);
  }

  console.log(`Found ${reservations.length} future reservations.\n`);

  // Build markdown table
  let markdown = `| Código de Reserva | Plataforma | Entrada | Salida | Plazas Asignadas | Horarios | Enlace al Panel Admin |\n`;
  markdown += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  reservations.forEach(r => {
    let platformName = r.platform || 'Airbnb';
    let checkInTime = '14:00';
    let checkOutTime = '12:00';
    
    if (r.platform && r.platform.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(r.platform);
        platformName = parsed.name || 'Airbnb';
        checkInTime = parsed.check_in_time || '14:00';
        checkOutTime = parsed.check_out_time || '12:00';
      } catch (e) {
        // Fallback
      }
    }

    const adminUrl = `https://viladefenals.activavivienda.es/viladefenals/acceso/${r.reservation_code}/admin`;
    const totalGuestsLabel = r.total_guests === 0 ? '⚠️ **Pendiente** (0)' : `✓ **Activo** (${r.total_guests})`;
    const hoursLabel = `Entrada: ${checkInTime} / Salida: ${checkOutTime}`;

    markdown += `| \`${r.reservation_code}\` | **${platformName}** | \`${r.check_in}\` | \`${r.check_out}\` | ${totalGuestsLabel} | ${hoursLabel} | [Acceder a Consola Admin 🔑](${adminUrl}) |\n`;
  });

  console.log("--- MARKDOWN START ---");
  console.log(markdown);
  console.log("--- MARKDOWN END ---");
}

run();
