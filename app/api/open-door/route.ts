import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
// Usar Service Role para no depender de RLS en la API
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const IFTTT_WEBHOOK_URL = process.env.IFTTT_WEBHOOK_URL || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
});

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

export async function POST(request: Request) {
  try {
    const { reservation_code } = await request.json();

    if (!reservation_code) {
      return NextResponse.json({ success: false, message: 'Falta código de reserva' }, { status: 400 });
    }

    // Verificar en Supabase
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_code', reservation_code)
      .single();

    if (error || !reservation) {
      return NextResponse.json({ success: false, message: 'Reserva no encontrada' }, { status: 404 });
    }

    // Security: Only allow door opening for fully completed check-ins
    if (!reservation.is_registered || !reservation.is_tax_paid) {
      return NextResponse.json({ success: false, message: 'Check-in no completado o tasa no pagada.' }, { status: 403 });
    }

    const now = new Date();
    
    // Parse custom times from platform JSON
    let inTime = '16:00';
    let outTime = '10:00';

    if (reservation.platform && reservation.platform.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(reservation.platform);
        if (parsed.check_in_time) inTime = parsed.check_in_time;
        if (parsed.check_out_time) outTime = parsed.check_out_time;
      } catch (e) {
        console.error("Error parsing platform JSON in open-door API:", e);
      }
    }

    const checkInHourInput = parseInt(inTime.split(':')[0], 10);
    const checkInLocalHour = checkInHourInput - 1; // 1 hora antes de la oficial

    const checkOutHourInput = parseInt(outTime.split(':')[0], 10);
    const checkOutLocalHour = checkOutHourInput + 1; // 1 hora después de la oficial

    const checkInDate = getSpainUtcDate(reservation.check_in, checkInLocalHour);
    const checkOutDate = getSpainUtcDate(reservation.check_out, checkOutLocalHour);

    if (now < checkInDate || now > checkOutDate) {
      return NextResponse.json({ success: false, message: 'Fuera del horario permitido' }, { status: 403 });
    }

    // Si llegamos aquí, la fecha/hora es válida. Lanzamos el Webhook de IFTTT.
    if (!IFTTT_WEBHOOK_URL) {
        console.warn("Falta IFTTT_WEBHOOK_URL en el .env");
    } else {
        const iftttResponse = await fetch(IFTTT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value1: reservation_code }),
        });

        if (!iftttResponse.ok) {
            return NextResponse.json({ success: false, message: 'Error al contactar con IFTTT' }, { status: 502 });
        }
    }

    return NextResponse.json({ success: true, message: 'Portal abierto exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
