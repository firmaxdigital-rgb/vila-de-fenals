import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[Cron Emails] Starting background email processing...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Cron Emails] Error: Supabase credentials missing.');
    return NextResponse.json({ success: false, error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find reservations created recently
  // Since we rely on the platform JSON string, we query all reservations 
  // where the platform string contains "admin_notified":false
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .like('platform', '%"admin_notified":false%');

  if (error) {
    console.error('[Cron Emails] Error fetching reservations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!reservations || reservations.length === 0) {
    console.log('[Cron Emails] No pending emails to send.');
    return NextResponse.json({ success: true, message: 'No pending emails.' });
  }

  console.log(`[Cron Emails] Found ${reservations.length} reservations pending admin notification.`);

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || 'checkin@viladefenals.com';
  const smtpTo = 'asesorweb@firmax.es';

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.error('[Cron Emails] Error: SMTP credentials missing.');
    return NextResponse.json({ success: false, error: 'Missing SMTP config' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  for (const ev of reservations) {
    try {
      const platformObj = JSON.parse(ev.platform);
      const platformName = platformObj.name || ev.platform;

      const adminUrl = `https://viladefenals.activavivienda.es/viladefenals/acceso/${ev.reservation_code}/admin`;
      const clientUrl = `https://viladefenals.activavivienda.es/viladefenals/acceso/${ev.reservation_code}`;
      const emailSubject = `[Vila de Fenals] ¡Nueva Reserva Sincronizada! - ${ev.reservation_code}`;
      const emailBody = `Se ha creado una nueva reserva en el sistema a través de iCal.
        
--------------------------------------------------
📋 DETALLES DE LA RESERVA
--------------------------------------------------
🔑 Código de Reserva:  ${ev.reservation_code}
🌍 Plataforma:         ${platformName}
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

      await transporter.sendMail({
        from: smtpFrom,
        to: smtpTo,
        subject: emailSubject,
        text: emailBody
      });
      
      console.log(`[Cron Emails] Email successfully sent for ${ev.reservation_code}.`);

      // Mark as sent
      platformObj.admin_notified = true;
      await supabase
        .from('reservations')
        .update({ platform: JSON.stringify(platformObj) })
        .eq('reservation_code', ev.reservation_code);

    } catch (err) {
      console.error(`[Cron Emails] Error processing reservation ${ev.reservation_code}:`, err);
      // We do NOT mark it as sent so it will retry next time.
    }
  }

  return NextResponse.json({ success: true, processed: reservations.length });
}
