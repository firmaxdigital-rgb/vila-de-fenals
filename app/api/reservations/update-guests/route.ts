import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteNukiKeypadCodesByReservation, createNukiKeypadCode, getCleanNukiName } from '../../../../lib/nuki';

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
    const { reservation_code, total_guests, check_in_time, check_out_time, has_deposit, deposit_amount } = await request.json();

    if (!reservation_code || total_guests === undefined) {
      return NextResponse.json({ success: false, error: 'Falta reservation_code o total_guests' }, { status: 400 });
    }

    const guestsNum = parseInt(total_guests, 10);
    if (isNaN(guestsNum) || guestsNum < 0 || guestsNum > 15) {
      return NextResponse.json({ success: false, error: 'Número de huéspedes no válido' }, { status: 400 });
    }

    // 1. Fetch the current reservation to get platform details, check_in/check_out dates, and Nuki PIN
    const { data: reservation, error: fetchErr } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_code', reservation_code)
      .single();

    if (fetchErr || !reservation) {
      console.error("[Update Guests API] Error fetching reservation:", fetchErr);
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    // 2. Resolve original platform name (preserving it)
    let platformName = 'Airbnb'; // Fallback
    if (reservation.platform) {
      if (reservation.platform.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(reservation.platform);
          platformName = parsed.name || 'Airbnb';
        } catch (e) {
          console.error("Error parsing platform JSON in update-guests API:", e);
          platformName = reservation.platform;
        }
      } else {
        platformName = reservation.platform;
      }
    }

    // 3. Construct new platform JSON with custom hours
    const inTime = check_in_time || '14:00';
    const outTime = check_out_time || '12:00';

    const updatedPlatform = JSON.stringify({
      name: platformName,
      check_in_time: inTime,
      check_out_time: outTime
    });

    // Deposit configuration
    const depositEnabled = has_deposit === true;
    const depositAmt = depositEnabled && deposit_amount ? parseFloat(deposit_amount) : 0;

    console.log(`[Update Guests API] Updating reservation ${reservation_code}: guests=${guestsNum}, check-in=${inTime}, check-out=${outTime}, deposit=${depositEnabled ? depositAmt + '€' : 'N/A'}`);

    // 4. Update the database reservation
    const updatePayload: any = {
      total_guests: guestsNum,
      platform: updatedPlatform
    };

    // Include deposit fields (they may not exist yet in some schemas, so we try)
    updatePayload.has_deposit = depositEnabled;
    updatePayload.deposit_amount = depositAmt;
    // Reset deposit_paid to 0 if the deposit amount changes significantly
    if (depositEnabled && reservation.deposit_amount !== depositAmt) {
      updatePayload.deposit_paid = 0;
    }

    const { error: updateErr } = await supabase
      .from('reservations')
      .update(updatePayload)
      .eq('reservation_code', reservation_code);

    if (updateErr) {
      console.error("[Update Guests API] Error updating reservation in DB:", updateErr);
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // 5. Re-provision Nuki keypad code with dynamic offsets if Nuki PIN already exists
    let nukiSyncStatus = 'no_nuki_pin_yet';
    if (reservation.nuki_pin) {
      try {
        console.log(`[Update Guests API] Re-syncing Nuki for ${reservation_code} with new custom hours`);

        // Check-in Spain local hour: input hour - 1 (offset)
        const checkInHourInput = parseInt(inTime.split(':')[0], 10);
        const checkInLocalHour = checkInHourInput - 1;

        // Check-out Spain local hour: input hour + 1 (offset)
        const checkOutHourInput = parseInt(outTime.split(':')[0], 10);
        const checkOutLocalHour = checkOutHourInput + 1;

        // Calculate exact validity dates using Spain local time conversion
        const checkInDateObj = getSpainUtcDate(reservation.check_in, checkInLocalHour);
        const checkOutDateObj = getSpainUtcDate(reservation.check_out, checkOutLocalHour);

        const nukiName = getCleanNukiName(reservation_code, reservation.summary);

        // Delete any existing Nuki keypad authorization for this reservation
        await deleteNukiKeypadCodesByReservation(reservation_code);

        // Create the new Nuki authorization
        await createNukiKeypadCode(nukiName, checkInDateObj, checkOutDateObj, reservation.nuki_pin);
        nukiSyncStatus = 'success';
        console.log(`[Update Guests API] Successfully re-synced Nuki for ${reservation_code} with validity from ${checkInDateObj.toISOString()} to ${checkOutDateObj.toISOString()}`);
      } catch (nukiErr: any) {
        console.error(`[Update Guests API] Failed to re-sync Nuki lock:`, nukiErr);
        nukiSyncStatus = `error: ${nukiErr.message}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reserva actualizada con éxito.',
      nuki_sync: nukiSyncStatus
    });
  } catch (error: any) {
    console.error('[Update Guests API] General error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
