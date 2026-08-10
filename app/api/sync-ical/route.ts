import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateMemorablePin, upsertNukiKeypadCode, getCleanNukiName, deleteNukiKeypadCodesByReservation } from '../../../lib/nuki';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

/**
 * Helper to get a UTC Date corresponding to a specific hour in Europe/Madrid timezone,
 * avoiding any server-side timezone differences or daylight saving shifts.
 */
function getSpainUtcDate(dateStr: string, localHour: number): Date {
  const checkDate = new Date(`${dateStr}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    hour12: false,
    hour: 'numeric'
  });
  
  const parts = formatter.formatToParts(checkDate);
  const hourPart = parts.find(p => p.type === 'hour');
  
  if (!hourPart) {
    const month = parseInt(dateStr.split('-')[1], 10);
    const offset = (month >= 4 && month <= 10) ? 2 : 1;
    const utcHour = localHour - offset;
    const finalDate = new Date(`${dateStr}T00:00:00Z`);
    finalDate.setUTCHours(utcHour, 0, 0, 0);
    return finalDate;
  }
  
  const madridHour = parseInt(hourPart.value, 10);
  const offset = madridHour - 12;
  const utcHour = localHour - offset;
  
  const finalDate = new Date(`${dateStr}T00:00:00Z`);
  finalDate.setUTCHours(utcHour, 0, 0, 0);
  
  return finalDate;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'; // Usar el Service Role Key para tener permisos de escritura

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
});

const AIRBNB_ICAL_URL = 'https://www.airbnb.es/calendar/ical/669455999251966218.ics?t=4ec9256dab9c46a7ae5ddf5a7211208f';
const VRBO_ICAL_URL = 'https://www.vrbo.com/icalendar/e05e2860e5ec4787b14614afc00383b0.ics?nonTentative';
const BOOKING_ICAL_URL = 'https://ical.booking.com/v1/export?t=176436fc-ee08-4420-bd62-6325c435b917';

async function fetchAndParseIcal(url: string, platform: string) {
  const response = await fetch(url, { 
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  let data = await response.text();

  // iCalendar format folds lines longer than 75 chars by adding CRLF + space. 
  // We must unfold them first.
  data = data.replace(/\r?\n[ \t]/g, '');

  const events: any[] = [];
  const lines = data.split(/\r?\n/);
  
  let currentEvent: any = null;
  let inEvent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.start && currentEvent.end) {
         events.push(currentEvent);
      }
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        const match = line.match(/:(\d{8})/);
        if (match) currentEvent.start = `${match[1].substring(0,4)}-${match[1].substring(4,6)}-${match[1].substring(6,8)}`;
      } else if (line.startsWith('DTEND')) {
        const match = line.match(/:(\d{8})/);
        if (match) currentEvent.end = `${match[1].substring(0,4)}-${match[1].substring(4,6)}-${match[1].substring(6,8)}`;
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12);
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith('UID:')) {
        currentEvent.uid = line.substring(4);
      }
    }
  }

  const parsedEvents = events.map(ev => {
    let code = ev.uid; // Fallback
    
    if (platform === 'Airbnb') {
      const matchDesc = (ev.description || '').match(/HM[A-Z0-9]+/);
      const matchUid = (ev.uid || '').match(/HM[A-Z0-9]+/);
      
      if (matchDesc) code = matchDesc[0];
      else if (matchUid) code = matchUid[0];
    } else if (platform === 'VRBO') {
      // Intenta extraer ID de VRBO desde el SUMMARY (ej. "Reservation #1234567")
      const matchSum = (ev.summary || '').match(/(?:Reservation #|Reserva #)\s*([A-Z0-9\-]{6,})/i);
      if (matchSum && matchSum[1]) {
        code = matchSum[1];
      } else {
        // VRBO often just sends "Reserved - Name". We use the first part of the UID for the URL code.
        code = ev.uid ? ev.uid.split('-')[0] : `vrbo-${Math.floor(Math.random()*1000000)}`;
      }
    } else if (platform === 'Booking') {
      // Booking.com iCal does NOT contain the official reservation number.
      // We extract a clean version of the internal UID to serve as the URL code.
      code = ev.uid ? ev.uid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() : `BKG${Math.floor(Math.random()*1000000)}`;
    }

    // Combine summary and description to search comprehensively
    const textToSearch = `${ev.summary || ''} | ${ev.description || ''}`;
    let totalGuests = 0; // Default fallback (triggers pending activation for the host to confirm)

    // 1. Look for distinct counts of adults and children to sum them up,
    // e.g. "(5 adults, 1 child)" or "2 adultos, 1 niño" or "2 adults (1 child)"
    const adultsMatch = textToSearch.match(/(\d+)\s*(?:adults?|adultos?)/i);
    const childrenMatch = textToSearch.match(/(\d+)\s*(?:children|niños?|niñas?|child|infants?|bebés?)/i);
    
    if (adultsMatch) {
      const adultsCount = parseInt(adultsMatch[1], 10);
      const childrenCount = childrenMatch ? parseInt(childrenMatch[1], 10) : 0;
      totalGuests = adultsCount + childrenCount;
      console.log(`[iCal Sync Parser] Desglose encontrado en "${textToSearch}": ${adultsCount} adultos + ${childrenCount} niños = ${totalGuests} huéspedes.`);
    } else {
      // 2. Direct labels: e.g. "Number of guests: X", "Guests: X", "Huéspedes: X", "Pax: X"
      const directLabelMatch = textToSearch.match(/(?:Number of guests|Guests|Huéspedes|Hospedes|Viajeros|Pax):\s*(\d+)/i);
      if (directLabelMatch) {
        totalGuests = parseInt(directLabelMatch[1], 10);
        console.log(`[iCal Sync Parser] Etiqueta directa encontrada en "${textToSearch}": ${totalGuests} huéspedes.`);
      } else {
        // 3. General units: e.g. "5 guests", "5 huéspedes", "5 pax", "5 viajeros"
        const unitMatch = textToSearch.match(/(\d+)\s*(?:guests?|huéspedes?|hospedes?|viajeros?|pax)/i);
        if (unitMatch) {
          totalGuests = parseInt(unitMatch[1], 10);
          console.log(`[iCal Sync Parser] Unidad encontrada en "${textToSearch}": ${totalGuests} huéspedes.`);
        } else {
          console.log(`[iCal Sync Parser] No se detectó recuento de huéspedes en "${textToSearch}". Usando por defecto: ${totalGuests}.`);
        }
      }
    }

    return {
      reservation_code: code,
      platform,
      check_in: ev.start,
      check_out: ev.end,
      nuki_pin: null as string | null,
      summary: ev.summary as string | undefined,
      total_guests: totalGuests
    };
  });

  return parsedEvents;
}

export async function GET() {
  try {
    const airbnbEvents = await fetchAndParseIcal(AIRBNB_ICAL_URL, 'Airbnb');
    const vrboEvents = await fetchAndParseIcal(VRBO_ICAL_URL, 'VRBO');
    const bookingEvents = await fetchAndParseIcal(BOOKING_ICAL_URL, 'Booking');

    // Filtramos posibles eventos sin código o con código demasiado corto (ej. bloqueos de calendario),
    // y evitamos importar bloqueos de calendario o reservas espejo/fantasmas marcadas como "Reserved", "Blocked", etc.
    const allEvents = [...airbnbEvents, ...vrboEvents, ...bookingEvents].filter(ev => {
      if (!ev.reservation_code || ev.reservation_code.length <= 3) {
        return false;
      }
      
      const lowerCode = ev.reservation_code.toLowerCase();
      if (lowerCode === 'reserved' || lowerCode.startsWith('reserved') || lowerCode === 'blocked' || lowerCode === 'reservado' || lowerCode === 'bloqueado') {
        return false;
      }
      
      // Ignorar bloqueos de calendario nativos de Airbnb y eventos "espejo" de calendarios vinculados
      if (ev.platform === 'Airbnb' && lowerCode.includes('@airbnb.com')) {
        return false;
      }
      
      return true;
    });

    if (allEvents.length === 0) {
       return NextResponse.json({ success: true, message: 'No hay eventos para sincronizar.' });
    }

    // 1. Fetch current reservations from Supabase to check if they already have a PIN and total_guests
    const { data: existingReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('reservation_code, nuki_pin, total_guests, platform');
      
    if (fetchError) {
      console.error('Error fetching existing reservations:', fetchError);
    }

    const existingMap = new Map();
    const existsMap = new Map();
    const existingGuestsMap = new Map();
    const existingPlatformMap = new Map();
    if (existingReservations) {
      existingReservations.forEach(r => {
        existingMap.set(r.reservation_code, r.nuki_pin);
        existsMap.set(r.reservation_code, true);
        existingGuestsMap.set(r.reservation_code, r.total_guests);
        existingPlatformMap.set(r.reservation_code, r.platform);
      });
    }

    // 2. Generate PINs and Nuki Auth for NEW reservations (or those without a PIN)
    for (const ev of allEvents) {
      // Check if it already exists in our DB with a PIN
      const currentPin = existingMap.get(ev.reservation_code);
      const existsInDb = existsMap.has(ev.reservation_code);
      
      if (!currentPin) {
        // Generate a memorable ABC-CBA pin
        const newPin = generateMemorablePin();

        // Calculate exact validity times: Nuki offsets (Check-in Spain time: 14:00 - 1h = 13:00, Check-out Spain time: 12:00 + 1h = 13:00)
        const checkInDate = getSpainUtcDate(ev.check_in, 13);
        const checkOutDate = getSpainUtcDate(ev.check_out, 13);

        const nukiName = getCleanNukiName(ev.reservation_code, ev.summary);

        // Provision in Nuki Web API (first delete any potential leftover for this reservation to ensure uniqueness)
        try {
          console.log(`Re-syncing Nuki: Deleting potential existing auths for ${ev.reservation_code}`);
          await deleteNukiKeypadCodesByReservation(ev.reservation_code);

          console.log(`Creating Nuki code ${newPin} for reservation ${ev.reservation_code} as ${nukiName}`);
          await upsertNukiKeypadCode(ev.reservation_code, ev.summary, checkInDate, checkOutDate, newPin);
          ev.nuki_pin = newPin; // We set it only if Nuki creation succeeded!
        } catch (err) {
          console.error(`Failed to create Nuki code for ${ev.reservation_code}:`, err);
          ev.nuki_pin = null; // Do not save PIN if Nuki creation failed
        }
      } else {
        // Preserve existing pin so we don't overwrite it with null
        ev.nuki_pin = currentPin;
      }

      // El correo electrónico ahora se envía de manera independiente (decoupled)
      // a través de un cron secundario. Simplemente marcaremos la nueva reserva.
      if (!existsInDb) {
        console.log(`[iCal Sync Notification] Nueva reserva detectada (${ev.reservation_code}). Marcada para notificación.`);
      }
    }

    // 3. Upsert a Supabase (filtrando sólo las columnas válidas de la base de datos)
    const { data, error } = await supabase
      .from('reservations')
      .upsert(
        allEvents.map(ev => {
          const existingGuests = existingGuestsMap.get(ev.reservation_code);
          // If the reservation already exists and has total_guests > 0, preserve that value
          // instead of resetting it to 0 from the iCal parser
          const finalGuests = (existingGuests !== undefined && existingGuests !== null && existingGuests > 0)
            ? existingGuests
            : ev.total_guests;

          const existingPlatform = existingPlatformMap.get(ev.reservation_code);
          let finalPlatform = existingPlatform;
          if (!finalPlatform) {
            // New reservation: Add admin_notified: false flag
            finalPlatform = JSON.stringify({ name: ev.platform, admin_notified: false });
          }

          return {
            reservation_code: ev.reservation_code,
            platform: finalPlatform,
            check_in: ev.check_in,
            check_out: ev.check_out,
            nuki_pin: ev.nuki_pin,
            total_guests: finalGuests
          };
        }),
        { onConflict: 'reservation_code' }
      );

    if (error) {
      console.error('Error sincronizando con Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 4. Overlap Detection
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: futureRes, error: overlapErr } = await supabase
        .from('reservations')
        .select('reservation_code, platform, check_in, check_out')
        .gte('check_in', today)
        .order('check_in', { ascending: true });

      if (futureRes && !overlapErr) {
        const overlaps = [];
        for (let i = 0; i < futureRes.length; i++) {
          for (let j = i + 1; j < futureRes.length; j++) {
            const resA = futureRes[i];
            const resB = futureRes[j];
            
            // If resB starts after or exactly when resA ends, no overlap with resA anymore (since sorted by check_in)
            if (resB.check_in >= resA.check_out) {
              continue;
            }
            
            // Check for real overlap
            if (resA.check_in < resB.check_out) {
              overlaps.push({ resA, resB });
            }
          }
        }

        if (overlaps.length > 0) {
          const smtpHost = process.env.SMTP_HOST;
          const smtpPort = process.env.SMTP_PORT;
          const smtpUser = process.env.SMTP_USER;
          const smtpPassword = process.env.SMTP_PASSWORD;
          const smtpFrom = process.env.SMTP_FROM || 'checkin@viladefenals.com';
          const smtpTo = 'asesorweb@firmax.es';

          if (smtpHost && smtpPort && smtpUser && smtpPassword) {
            const transporter = nodemailer.createTransport({
              host: smtpHost,
              port: parseInt(smtpPort, 10),
              secure: parseInt(smtpPort, 10) === 465,
              auth: { user: smtpUser, pass: smtpPassword },
            });

            let overlapText = `⚠️ ATENCIÓN: Se han detectado solapamientos de fechas en las siguientes reservas.
Esto suele ocurrir cuando un huésped cancela y vuelve a reservar, o por una doble reserva.

Por favor, revisa cada caso y elimina la reserva cancelada o errónea desde su Panel de Administración.

`;
            overlaps.forEach(({ resA, resB }, index) => {
              const urlA = `https://viladefenals.activavivienda.es/viladefenals/acceso/${resA.reservation_code}/admin`;
              const urlB = `https://viladefenals.activavivienda.es/viladefenals/acceso/${resB.reservation_code}/admin`;
              
              overlapText += `--- CONFLICTO #${index + 1} ---
🔴 Reserva 1: [${resA.platform}] ${resA.reservation_code} (Del ${resA.check_in} al ${resA.check_out})
👉 Administrar R1: ${urlA}

🔴 Reserva 2: [${resB.platform}] ${resB.reservation_code} (Del ${resB.check_in} al ${resB.check_out})
👉 Administrar R2: ${urlB}

`;
            });

            overlapText += `Para eliminar la reserva incorrecta, entra en su enlace de administración y pulsa el botón rojo "Eliminar Reserva" al final de la página.

Atentamente,
Portal de Check-in Automático de Vila de Fenals`;

            await transporter.sendMail({
              from: smtpFrom,
              to: smtpTo,
              subject: '[Vila de Fenals] ⚠️ ALERTA: Reservas Solapadas Detectadas',
              text: overlapText
            });
            console.log(`[Overlap Detection] Alerta de solapamiento enviada con ${overlaps.length} conflictos.`);
          }
        }
      }
    } catch (overlapDetectionError) {
      console.error('[Overlap Detection] Error:', overlapDetectionError);
    }

    return NextResponse.json({ success: true, count: allEvents.length });
  } catch (error: any) {
    console.error('Error general en sync-ical:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
