const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Fetching future reservations...");
  const today = new Date().toISOString().split('T')[0];
  
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .gte('check_in', today)
    .order('check_in', { ascending: true });

  if (error) {
    console.error("Error fetching reservations:", error);
    process.exit(1);
  }

  const airbnbReservations = [];
  const otherReservations = [];

  for (const r of reservations) {
    if (r.platform === 'Airbnb') {
      airbnbReservations.push(r);
    } else if (r.platform === 'VRBO' || r.platform === 'Booking') {
      otherReservations.push(r);
    }
  }

  // 1. Force emails for Booking and VRBO
  console.log(`\n--- Forcing Emails for ${otherReservations.length} Booking/VRBO reservations ---`);
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || 'checkin@viladefenals.com';
  const smtpTo = 'asesorweb@firmax.es';

  if (!smtpHost) {
      console.log("SMTP info not found in .env.local, skipping emails.");
  } else {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      for (const ev of otherReservations) {
        const adminUrl = `https://viladefenals.activavivienda.es/viladefenals/acceso/${ev.reservation_code}/admin`;
        const clientUrl = `https://viladefenals.activavivienda.es/viladefenals/acceso/${ev.reservation_code}`;
        const emailSubject = `[Vila de Fenals] ¡Nueva Reserva Sincronizada! - ${ev.reservation_code}`;
        const emailBody = `Se ha creado una nueva reserva en el sistema a través de iCal.
          
--------------------------------------------------
📋 DETALLES DE LA RESERVA
--------------------------------------------------
🔑 Código de Reserva:  ${ev.reservation_code}
🌍 Plataforma:         ${ev.platform}
📅 Fecha de Entrada:   ${ev.check_in}
📅 Fecha de Salida:    ${ev.check_out}
--------------------------------------------------

⚠️ Esta reserva se ha inicializado con 0 plazas por defecto (Pendiente de Activación).
Para establecer el número exacto de huéspedes y configurar sus horas de check-in/check-out, haga clic en el siguiente enlace de administración:

🔗 1. ENLACE DE ADMINISTRACIÓN (Haga clic aquí para configurar):
${adminUrl}

🔗 2. ENLACE PARA EL VIAJERO (Copiar y enviar):
${clientUrl}

Por favor, configure esta reserva y copie el enlace para el viajero en su plantilla.

Atentamente,
Portal de Check-in Automático de Vila de Fenals`;

        try {
          await transporter.sendMail({
            from: smtpFrom,
            to: smtpTo,
            subject: emailSubject,
            text: emailBody
          });
          console.log(`Sent email for ${ev.platform} reservation: ${ev.reservation_code}`);
        } catch (err) {
          console.error(`Failed to send email for ${ev.reservation_code}:`, err.message);
        }
      }
  }

  // 2. Output Airbnb reservations as markdown table
  console.log(`\n--- Markdown Table for Airbnb Reservations ---`);
  console.log(`| Código de Reserva | Fechas | Huéspedes Totales | Enlace de Administración |`);
  console.log(`| :--- | :--- | :--- | :--- |`);
  for (const r of airbnbReservations) {
    const adminUrl = `https://viladefenals.activavivienda.es/viladefenals/acceso/${r.reservation_code}/admin`;
    console.log(`| **${r.reservation_code}** | ${r.check_in} al ${r.check_out} | ${r.total_guests || 0} pax | [Administrar Reserva](${adminUrl}) |`);
  }

  process.exit(0);
}

run();
