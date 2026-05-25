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
  console.log("🚀 INICIANDO PRUEBA DE INTEGRACIÓN E2E PARA LA RESERVA:", reservationCode);

  // 1. Resetear el estado de la reserva
  console.log("\n🧹 Paso 1: Reseteando la base de datos para la reserva...");
  const resetScript = require('./reset-test'); // Esto ejecutará el reset-test.js
  await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar a que se complete el reset

  // Descubrir columnas de la tabla 'travelers' desde OpenAPI
  console.log("🔍 Descubriendo columnas de la tabla 'travelers' mediante OpenAPI...");
  let existingColumns = [];
  try {
    const https = require('https');
    const url = new URL(SUPABASE_URL);
    const apiCall = () => new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        path: '/rest/v1/?apikey=' + SUPABASE_KEY,
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    const spec = await apiCall();
    if (spec.definitions && spec.definitions.travelers && spec.definitions.travelers.properties) {
      existingColumns = Object.keys(spec.definitions.travelers.properties);
    }
  } catch (e) {
    console.error("⚠️ Advertencia al descubrir columnas por OpenAPI:", e.message);
  }
  
  console.log("📊 Columnas detectadas en BD:", existingColumns.length > 0 ? existingColumns.join(', ') : "(Fallo - usando fallback básico)");

  function filterTravelerData(rawData) {
    const basicCols = ['id', 'reservation_code', 'nombre', 'apellidos', 'tipo_documento', 'numero_documento', 'fecha_expedicion', 'fecha_caducidad', 'fecha_nacimiento', 'sexo', 'nacionalidad', 'firma', 'created_at'];
    const validColumns = existingColumns.length > 0 ? existingColumns : basicCols;
    const filtered = {};
    Object.keys(rawData).forEach(key => {
      if (validColumns.includes(key) || key === 'id') {
        filtered[key] = rawData[key];
      } else {
        console.warn(`  ⚠️ Omitiendo columna '${key}' (no existe en esta base de datos)`);
      }
    });
    return filtered;
  }

  // 2. Registrar Viajero 1 (Adulto)
  console.log("\n👤 Paso 2: Registrando Viajero 1 (Adulto - Jean Dupont)...");
  const adultData = {
    reservation_code: reservationCode,
    nombre: 'Jean',
    apellidos: 'Dupont',
    tipo_documento: 'PASAPORTE',
    numero_documento: 'PA987654321',
    fecha_expedicion: '2024-05-10',
    fecha_caducidad: '2034-05-10',
    fecha_nacimiento: '1985-02-15',
    sexo: 'M',
    nacionalidad: 'FR',
    direccion: '15 Rue de Rivoli',
    codigo_postal: '75001',
    municipio: 'Paris',
    pais_residencia: 'FR',
    telefono: '+3361234567',
    email: 'jean.dupont@example.com',
    firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  };

  const filteredAdult = filterTravelerData(adultData);
  const { data: insertedAdults, error: adultErr } = await supabase
    .from('travelers')
    .insert([filteredAdult])
    .select();

  if (adultErr) {
    console.error("❌ Error al insertar adulto:", adultErr);
    process.exit(1);
  }

  const adultId = insertedAdults[0].id;
  console.log(`✅ Viajero 1 registrado con éxito. ID: ${adultId}`);

  // 3. Registrar Viajero 2 (Menor de edad, a cargo de Jean Dupont)
  console.log("\n👶 Paso 3: Registrando Viajero 2 (Menor - Pierre Dupont)...");
  const minorData = {
    reservation_code: reservationCode,
    nombre: 'Pierre',
    apellidos: 'Dupont',
    tipo_documento: 'DNI',
    numero_documento: 'MENOR-PIERRE123',
    fecha_expedicion: '2026-05-23', // Requerido por not-null
    fecha_caducidad: '2036-05-23',  // Requerido por not-null
    fecha_nacimiento: '2016-08-20', // 9 años
    sexo: 'M',
    nacionalidad: 'FR',
    parentesco: 'Hijo/a',
    adulto_responsable_id: adultId,
    firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  };

  const filteredMinor = filterTravelerData(minorData);
  const { data: insertedMinors, error: minorErr } = await supabase
    .from('travelers')
    .insert([filteredMinor])
    .select();

  if (minorErr) {
    console.error("❌ Error al insertar menor:", minorErr);
    process.exit(1);
  }

  console.log(`✅ Viajero 2 registrado con éxito. ID: ${insertedMinors[0].id}`);

  // 4. Probar generación de enlace de pago de tasa con micro-charge de 0.10€
  console.log("\n💳 Paso 4: Solicitando enlace de pago a la API local (tasa turística con micro-cargo)...");
  try {
    const paycometRes = await fetch(`${baseUrl}/api/payment/generate-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservation_code: reservationCode,
        lang: 'es',
        micro_charge: true
      })
    });

    const paycometData = await paycometRes.json();
    console.log("Respuesta de /api/payment/generate-link:", paycometData);
    
    if (paycometData.success) {
      if (paycometData.simulated) {
        console.log("ℹ️ MODO SIMULADO: Usando enlace simulado por falta de credenciales PayComet en .env.local.");
      } else {
        console.log("✅ ENLACE REAL PAYCOMET GENERADO exitosamente a 0.10€.");
      }
      console.log(`🔗 URL de Pago: ${paycometData.url}`);
    } else {
      console.error("❌ Error al generar el enlace de pago:", paycometData.error);
    }
  } catch (err) {
    console.error("❌ Error de red al conectar con el servidor local para generar enlace. Asegúrese de que 'npm run dev' esté corriendo en http://localhost:3000.", err.message);
  }

  // 5. Simular webhook de confirmación de pago de PayComet
  console.log("\n🔔 Paso 5: Simulando webhook de confirmación de pago de PayComet...");
  try {
    const webhookRes = await fetch(`${baseUrl}/api/payment/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Response: 'OK',
        Order: reservationCode,
        simulated: true
      })
    });

    const webhookData = await webhookRes.json();
    console.log("Respuesta del Webhook /api/payment/webhook:", webhookData);

    if (webhookData.success) {
      console.log("✅ Webhook verificado correctamente. El servidor local procesó el pago y finalizó el check-in.");
    } else {
      console.error("❌ Error en el Webhook:", webhookData.error);
    }
  } catch (err) {
    console.error("❌ Error de red al conectar con el webhook local.", err.message);
  }

  // 6. Verificar el estado final de la reserva en Supabase
  console.log("\n📊 Paso 6: Verificando estado final en Supabase...");
  await new Promise(resolve => setTimeout(resolve, 4000)); // Esperar un momento a que terminen los procesos asíncronos del webhook

  const { data: reservation, error: fetchErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', reservationCode)
    .single();

  if (fetchErr) {
    console.error("❌ Error al consultar la reserva final:", fetchErr);
  } else {
    console.log("\n================ ESTADO FINAL DE LA RESERVA ================");
    console.log(`Código de Reserva: ${reservation.reservation_code}`);
    console.log(`Plataforma:        ${reservation.platform}`);
    console.log(`Fase 1 (Registrado): ${reservation.is_registered ? '✅ COMPLETADA' : '❌ PENDIENTE'}`);
    console.log(`Fase 2 (Tasa Pagada):${reservation.is_tax_paid ? '✅ COMPLETADA' : '❌ PENDIENTE'}`);
    console.log(`Código Nuki PIN:    ${reservation.nuki_pin ? `🔑 ${reservation.nuki_pin}` : '❌ NO GENERADO'}`);
    console.log("============================================================");
    
    if (reservation.is_registered && reservation.is_tax_paid && reservation.nuki_pin) {
      console.log("\n✨ ¡FLUJO E2E PROBADO Y VERIFICADO CORRECTAMENTE CON SUPABASE! ✨");
    } else {
      console.warn("\n⚠️ El flujo terminó pero no todos los estados se completaron. Asegúrese de que el servidor Next.js esté corriendo.");
    }
  }
}

run();
