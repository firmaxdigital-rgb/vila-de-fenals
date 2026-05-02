import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'; // Usar el Service Role Key para tener permisos de escritura

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AIRBNB_ICAL_URL = 'https://www.airbnb.es/calendar/ical/669455999251966218.ics?t=4ec9256dab9c46a7ae5ddf5a7211208f';
const VRBO_ICAL_URL = 'http://www.vrbo.com/icalendar/e05e2860e5ec4787b14614afc00383b0.ics';

async function fetchAndParseIcal(url: string, platform: string) {
  const response = await fetch(url, { cache: 'no-store' });
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
      const matchSum = (ev.summary || '').match(/(?:Reservation #|Reserva #)?\s*([A-Z0-9\-]{6,})/i);
      if (matchSum && matchSum[1]) {
        code = matchSum[1];
      }
    }

    return {
      reservation_code: code,
      platform,
      check_in: ev.start,
      check_out: ev.end
    };
  });

  return parsedEvents;
}

export async function GET() {
  try {
    const airbnbEvents = await fetchAndParseIcal(AIRBNB_ICAL_URL, 'Airbnb');
    const vrboEvents = await fetchAndParseIcal(VRBO_ICAL_URL, 'VRBO');

    // Filtramos posibles eventos sin código o con código demasiado corto (ej. bloqueos de calendario)
    const allEvents = [...airbnbEvents, ...vrboEvents].filter(ev => ev.reservation_code && ev.reservation_code.length > 3);

    if (allEvents.length === 0) {
       return NextResponse.json({ success: true, message: 'No hay eventos para sincronizar.' });
    }

    // Upsert a Supabase
    const { data, error } = await supabase
      .from('reservations')
      .upsert(
        allEvents,
        { onConflict: 'reservation_code' }
      );

    if (error) {
      console.error('Error sincronizando con Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: allEvents.length });
  } catch (error: any) {
    console.error('Error general en sync-ical:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
