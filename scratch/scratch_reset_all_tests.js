const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function resetReservation(code, totalGuests, checkIn, checkOut, platform) {
  console.log(`\n🔄 Reinicializando reserva ${code}...`);

  // 1. Delete travelers
  const { error: delErr } = await supabase
    .from('travelers')
    .delete()
    .eq('reservation_code', code);
  if (delErr) console.warn(`Error al eliminar viajeros para ${code}:`, delErr);
  else console.log(`✓ Viajeros anteriores eliminados para ${code}.`);

  // 2. Delete reservation (to avoid constraint conflicts)
  const { error: resDelErr } = await supabase
    .from('reservations')
    .delete()
    .eq('reservation_code', code);
  if (resDelErr) console.warn(`Error al eliminar reserva anterior ${code}:`, resDelErr);

  // 3. Create fresh reservation
  const { error: insErr } = await supabase
    .from('reservations')
    .insert([
      {
        reservation_code: code,
        platform: platform,
        check_in: checkIn,
        check_out: checkOut,
        total_guests: totalGuests,
        is_tax_paid: false,
        is_registered: false,
        nuki_pin: null
      }
    ]);

  if (insErr) {
    console.error(`❌ Error al crear reserva ${code}:`, insErr);
  } else {
    console.log(`✓ Reserva ${code} creada desde cero: guests=${totalGuests}, dates=${checkIn} to ${checkOut}.`);
  }
}

async function run() {
  // Reset TEST7GUESTS (7 guests, 1 night, 0.10€ test charge)
  await resetReservation(
    'TEST7GUESTS', 
    7, 
    '2026-05-25', 
    '2026-05-26', 
    'PayComet Real-Test (7 Guests)'
  );

  // Reset TESTPROD (2 guests, 3 nights, 1.00€ test charge)
  await resetReservation(
    'TESTPROD', 
    2, 
    '2026-05-25', 
    '2026-05-28', 
    'PayComet Real-Test (2 Guests)'
  );

  console.log("\n✨ ¡Ambos entornos de prueba han sido reinicializados con éxito en Supabase!");
}

run();
