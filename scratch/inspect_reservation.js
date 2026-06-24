const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3Z3bmlrdGdteHVvb3FrcGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NDU4NywiZXhwIjoyMDkzMjMwNTg3fQ.O7em5YJiYQ6zSdJIDgfmcyBkO7OorQRMGT_zt9EL5KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'HM582Y32HZ';
  console.log(`[INSPECT] Fetching data for reservation: ${code}...`);

  // 1. Fetch reservation info
  const { data: reservation, error: resErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', code)
    .single();

  if (resErr) {
    console.error("❌ Error fetching reservation:", resErr);
    return;
  }
  
  console.log("=== RESERVATION DETAILS ===");
  console.log(`Reservation Code: ${reservation.reservation_code}`);
  console.log(`Total Guests: ${reservation.total_guests}`);
  console.log(`Check-in: ${reservation.check_in}`);
  console.log(`Check-out: ${reservation.check_out}`);
  console.log(`Is Registered: ${reservation.is_registered}`);
  console.log(`Is Tax Paid: ${reservation.is_tax_paid}`);
  console.log(`Has Deposit: ${reservation.has_deposit}`);
  console.log(`Deposit Paid: ${reservation.deposit_paid}`);
  console.log(`Deposit Amount: ${reservation.deposit_amount}`);
  console.log(`Platform raw: ${reservation.platform}`);
  console.log(`Nuki PIN: ${reservation.nuki_pin}`);

  // 2. Fetch traveler info
  const { data: travelers, error: travErr } = await supabase
    .from('travelers')
    .select('*')
    .eq('reservation_code', code);

  if (travErr) {
    console.error("❌ Error fetching travelers:", travErr);
  } else {
    console.log(`\n=== TRAVELERS (${travelers.length}) ===`);
    travelers.forEach((t, i) => {
      console.log(`[Traveler ${i+1}]`);
      console.log(`  Name: ${t.nombre} ${t.apellidos}`);
      console.log(`  Doc Type: ${t.tipo_documento}, Doc Number: ${t.numero_documento}`);
      console.log(`  Birthdate: ${t.fecha_nacimiento}`);
      console.log(`  Issue Date: ${t.fecha_expedicion}, Expiry Date: ${t.fecha_caducidad}`);
      console.log(`  Has Accepted Terms: ${t.has_accepted_terms}`);
      console.log(`  Firma length: ${t.firma ? t.firma.length : 'null'}`);
    });
  }
}

run();
