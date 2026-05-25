const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ ERROR: No se encontró SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const reservationCode = 'HMMR92E9DJ';
const baseUrl = 'http://localhost:3000';

async function run() {
  console.log("=================================================================");
  console.log("🚀 INICIANDO SCRIP DE FORZADO DE PAGO Y REGISTRO FINAL");
  console.log("👉 Reserva:", reservationCode);
  console.log("=================================================================\n");

  // 1. Obtener detalles de la reserva actual
  console.log("🔍 1. Consultando estado de la reserva en Supabase...");
  const { data: reservation, error: resErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', reservationCode)
    .single();

  if (resErr || !reservation) {
    console.error("❌ Error al obtener reserva:", resErr ? resErr.message : "No encontrada");
    process.exit(1);
  }

  console.log("   • Código:", reservation.reservation_code);
  console.log("   • Total Huéspedes:", reservation.total_guests);
  console.log("   • Registro Completado (is_registered):", reservation.is_registered);
  console.log("   • Pago Tasa Completado (is_tax_paid):", reservation.is_tax_paid);
  console.log("   • Pin Nuki actual:", reservation.nuki_pin || "Ninguno");

  // 2. Obtener los viajeros ya registrados
  console.log("\n👥 2. Consultando viajeros registrados para esta reserva...");
  const { data: travelers, error: travErr } = await supabase
    .from('travelers')
    .select('*')
    .eq('reservation_code', reservationCode);

  if (travErr) {
    console.error("❌ Error al obtener viajeros:", travErr.message);
    process.exit(1);
  }

  // Deserializar atributos extra de 'firma' como hace el portal
  const parsedTravelers = (travelers || []).map((t) => {
    if (t.firma && t.firma.trim().startsWith('{')) {
      try {
        const extra = JSON.parse(t.firma);
        return {
          ...t,
          ...extra,
          firma: extra.firma || t.firma
        };
      } catch (e) {
        console.error("Error parsing traveler JSON:", e);
      }
    }
    return t;
  });

  console.log(`   • Encontrados en la base de datos: ${parsedTravelers.length} viajero(s) de ${reservation.total_guests} requeridos.`);
  parsedTravelers.forEach((t, i) => {
    console.log(`     [${i + 1}] ${t.nombre} ${t.apellidos} - ${t.tipo_documento}: ${t.numero_documento} (${t.fecha_nacimiento}) ${t.parentesco || t.relacion_viajeros ? `[Relación: ${t.parentesco || t.relacion_viajeros}]` : ''}`);
  });

  const totalGuests = reservation.total_guests || 5;
  if (travelers.length < totalGuests) {
    console.warn(`\n⚠️ ADVERTENCIA: Aún no se han completado todos los viajeros requeridos (${travelers.length}/${totalGuests}).`);
    console.warn("  El API de finalización fallará si completedForms < totalGuests.");
    console.warn("  Si ya completaste el formulario en el navegador, asegúrate de que se hayan guardado todos correctamente.");
  }

  // 3. Forzar el pago de la tasa en la base de datos
  console.log("\n💳 3. Actualizando estado de pago (is_tax_paid = true) en Supabase...");
  const { data: updatedRes, error: updateErr } = await supabase
    .from('reservations')
    .update({ is_tax_paid: true })
    .eq('reservation_code', reservationCode)
    .select()
    .single();

  if (updateErr) {
    console.error("❌ Error al actualizar is_tax_paid:", updateErr.message);
    process.exit(1);
  }

  console.log("   ✅ ¡Estado de pago actualizado con éxito en Supabase!");
  console.log("   • Nuevo is_tax_paid:", updatedRes.is_tax_paid);

  // 4. Disparar registro-final localmente
  console.log("\n📧 4. Disparando la finalización del check-in a través del API local...");
  console.log(`   • URL: ${baseUrl}/api/registro-final`);

  try {
    const finalizationRes = await fetch(`${baseUrl}/api/registro-final`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reservation_code: reservationCode })
    });

    const finalizationData = await finalizationRes.json();
    console.log("\n================ RESPUESTA DE API REGISTRO-FINAL ================");
    console.log(JSON.stringify(finalizationData, null, 2));
    console.log("=================================================================\n");

    if (finalizationData.success) {
      console.log("✨ ¡FLUJO FINALIZADO Y CORREO ENVIADO CON ÉXITO! ✨");
      console.log(`🔑 Código PIN de Nuki generado: ${finalizationData.nuki_pin}`);
      console.log(`📧 Estado del envío de email:   ${finalizationData.email_status}`);
      console.log(`📁 Ficheros de Mossos generados:`);
      finalizationData.files.forEach(f => {
        console.log(`   - ${f.filename} (${f.guests.join(', ')})`);
      });
    } else {
      console.error("❌ Error en la respuesta del API:", finalizationData.error);
    }
  } catch (fetchErr) {
    console.error("❌ Error de red al intentar llamar al API local:", fetchErr.message);
    console.warn("   Asegúrese de que el servidor 'npm run dev' esté corriendo en http://localhost:3000.");
  }
}

run();
