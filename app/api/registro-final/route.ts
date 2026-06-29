import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateMemorablePin, createNukiKeypadCode, getCleanNukiName, deleteNukiKeypadCodesByReservation } from '../../../lib/nuki';

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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});



export async function POST(request: Request) {
  try {
    const { reservation_code } = await request.json();

    if (!reservation_code) {
      return NextResponse.json({ success: false, error: 'Falta el código de reserva' }, { status: 400 });
    }

    // 1. Fetch Reservation details
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_code', reservation_code)
      .single();

    if (resError || !reservation) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    // 2. Fetch Travelers registered
    const { data: travelers, error: travError } = await supabase
      .from('travelers')
      .select('*')
      .eq('reservation_code', reservation_code);

    if (travError || !travelers) {
      return NextResponse.json({ success: false, error: 'Error al obtener viajeros de la reserva' }, { status: 500 });
    }

    // Dynamically deserialize extra columns stored in 'firma' field
    const parsedTravelers = (travelers || []).map((t: any) => {
      if (t.firma && t.firma.trim().startsWith('{')) {
        try {
          const extra = JSON.parse(t.firma);
          return {
            ...t,
            ...extra,
            firma: extra.firma || t.firma
          };
        } catch (e) {
          console.error("Error parsing traveler JSON in registro-final:", e);
        }
      }
      return t;
    });

    const totalGuests = reservation.total_guests || 2;
    const completedForms = parsedTravelers.length;

    if (completedForms < totalGuests) {
      return NextResponse.json({
        success: false,
        error: `Registro incompleto. Faltan viajeros por registrar (${completedForms}/${totalGuests}).`
      }, { status: 400 });
    }

    // 3. Generate Nuki PIN if not already set
    let nukiPin = reservation.nuki_pin;
    let nukiSyncStatus = 'skipped_no_token';

    if (!nukiPin) {
      nukiPin = generateMemorablePin();
      
      // Update Nuki PIN in reservation database
      const { error: pinUpdateErr } = await supabase
        .from('reservations')
        .update({ nuki_pin: nukiPin })
        .eq('reservation_code', reservation_code);

      if (pinUpdateErr) {
        console.error("Error updating Nuki pin in DB:", pinUpdateErr);
      } else {
        console.log(`Generated and updated memorable Nuki PIN for reservation ${reservation_code}: ${nukiPin}`);
      }

      // Sync with physical Nuki lock if configured
      try {
        let checkInTime = '16:00';
        let checkOutTime = '10:00';
        if (reservation.platform && reservation.platform.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(reservation.platform);
            checkInTime = parsed.check_in_time || '16:00';
            checkOutTime = parsed.check_out_time || '10:00';
          } catch (e) {
            console.error("Error parsing platform JSON in registro-final:", e);
          }
        }

        const checkInHourInput = parseInt(checkInTime.split(':')[0], 10);
        const checkInLocalHour = checkInHourInput - 1;

        const checkOutHourInput = parseInt(checkOutTime.split(':')[0], 10);
        const checkOutLocalHour = checkOutHourInput + 1;

        const checkInDateObj = getSpainUtcDate(reservation.check_in, checkInLocalHour);
        const checkOutDateObj = getSpainUtcDate(reservation.check_out, checkOutLocalHour);

        const nukiName = getCleanNukiName(reservation_code, reservation.summary);

        console.log(`Re-syncing Nuki: Deleting potential existing auths for ${reservation_code}`);
        await deleteNukiKeypadCodesByReservation(reservation_code);

        const nukiResult = await createNukiKeypadCode(
          nukiName,
          checkInDateObj,
          checkOutDateObj,
          nukiPin
        );
        if (nukiResult) {
          nukiSyncStatus = 'success';
          console.log("Nuki keypad PIN successfully synchronized with physical lock.");
        }
      } catch (nukiErr: any) {
        console.error("Nuki physical sync error:", nukiErr);
        nukiSyncStatus = `error: ${nukiErr.message}`;
      }
    }

    // Update reservation state to fully registered
    const { error: regUpdateErr } = await supabase
      .from('reservations')
      .update({ is_registered: true })
      .eq('reservation_code', reservation_code);

    if (regUpdateErr) console.error("Error setting is_registered: true", regUpdateErr);

    return NextResponse.json({
      success: true,
      nuki_pin: nukiPin,
      nuki_sync: nukiSyncStatus
    });

  } catch (error: any) {
    console.error('Error in final check-in route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error durante la finalización del check-in.'
    }, { status: 500 });
  }
}
