import { createClient } from '@supabase/supabase-js';
import { sendMossosForReservation } from './mossos';
import { upsertNukiKeypadCode, deleteNukiKeypadCodesByReservation, generateMemorablePin } from './nuki';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

export async function syncReservationState(reservationCode: string) {
  console.log(`[Sync Engine] Invocado para ${reservationCode}`);
  
  try {
    // 1. Fetch Reservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_code', reservationCode)
      .single();

    if (resError || !reservation) {
      console.error("[Sync Engine] Error: Reserva no encontrada", resError);
      return { success: false, error: "Reserva no encontrada" };
    }

    // 2. Fetch Travelers
    const { data: travelers, error: travError } = await supabase
      .from('travelers')
      .select('*')
      .eq('reservation_code', reservationCode);

    if (travError || !travelers) {
      console.error("[Sync Engine] Error al obtener viajeros", travError);
      return { success: false, error: "Error al obtener viajeros" };
    }

    const parsedTravelers = (travelers || []).map((t: any) => {
      if (t.firma && t.firma.trim().startsWith('{')) {
        try {
          const extra = JSON.parse(t.firma);
          return { ...t, ...extra, firma: extra.firma || t.firma };
        } catch (e) {}
      }
      return t;
    });

    const totalGuests = reservation.total_guests || 2;
    const completedForms = parsedTravelers.length;

    // Parse Platform metadata to get mossos_sent flag and checkin hours
    let platformData: any = {};
    if (reservation.platform && typeof reservation.platform === 'string') {
      try {
        platformData = JSON.parse(reservation.platform);
      } catch (e) {}
    } else if (reservation.platform && typeof reservation.platform === 'object') {
        platformData = reservation.platform;
    }

    // 3. Evaluate States
    const formsComplete = completedForms >= totalGuests;
    
    // Evaluate Tax
    // Logic: calculatedTax based on travelers vs taxPaid
    let payingGuests = 0;
    const unregisteredCount = Math.max(0, totalGuests - completedForms);
    payingGuests += unregisteredCount; // unregistered are assumed adults

    const getAgeAtCheckin = (birthDateStr: string, checkInStr: string): number | null => {
      if (!birthDateStr || !checkInStr) return null;
      const birthDate = new Date(birthDateStr);
      const checkInDate = new Date(checkInStr);
      if (isNaN(birthDate.getTime()) || isNaN(checkInDate.getTime())) return null;
      let age = checkInDate.getFullYear() - birthDate.getFullYear();
      const m = checkInDate.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && checkInDate.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    parsedTravelers.forEach(t => {
      const age = getAgeAtCheckin(t.fecha_nacimiento, reservation.check_in);
      if (age === null || age >= 16) payingGuests++;
    });

    const checkInDateObjRaw = new Date(reservation.check_in);
    const checkOutDateObjRaw = new Date(reservation.check_out);
    const diffTime = Math.abs(checkOutDateObjRaw.getTime() - checkInDateObjRaw.getTime());
    let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (nights > 7) nights = 7;
    if (nights < 1) nights = 1;

    const calculatedTax = parseFloat((payingGuests * nights * 1.75).toFixed(2));
    const taxPaid = parseFloat(reservation.tax_paid || 0);
    const taxComplete = taxPaid >= calculatedTax;

    // Evaluate Deposit
    const depositRequired = reservation.has_deposit === true;
    const depositAmount = parseFloat(reservation.deposit_amount || 0);
    const depositPaid = parseFloat(reservation.deposit_paid || 0);
    const depositComplete = !depositRequired || depositPaid >= depositAmount;

    const isFullyUnlocked = formsComplete && taxComplete && depositComplete;
    
    // DB Updates payload
    let updatePayload: any = {};
    let platformNeedsUpdate = false;

    // 4. Action: MOSSOS
    if (formsComplete && !platformData.mossos_sent) {
      console.log(`[Sync Engine] Formularios completos y Mossos no enviados. Enviando Mossos...`);
      const mRes = await sendMossosForReservation(reservation, parsedTravelers);
      if (mRes.success) {
        platformData.mossos_sent = true;
        platformNeedsUpdate = true;
      }
    } else if (!formsComplete && platformData.mossos_sent) {
      // Revert mossos sent so it resends when completed again
      console.log(`[Sync Engine] Formularios incompletos. Revirtiendo estado de Mossos.`);
      platformData.mossos_sent = false;
      platformNeedsUpdate = true;
    }

    // 5. Action: NUKI
    if (isFullyUnlocked) {
      console.log(`[Sync Engine] Reserva totalmente desbloqueada. Sincronizando Nuki...`);
      
      let nukiPin = reservation.nuki_pin;
      if (!nukiPin) {
        nukiPin = generateMemorablePin();
        updatePayload.nuki_pin = nukiPin;
      }

      let checkInTime = platformData.check_in_time || '16:00';
      let checkOutTime = platformData.check_out_time || '10:00';

      const checkInHourInput = parseInt(checkInTime.split(':')[0], 10);
      const checkInLocalHour = checkInHourInput - 1;
      const checkOutHourInput = parseInt(checkOutTime.split(':')[0], 10);
      const checkOutLocalHour = checkOutHourInput + 1;

      const checkInDateObj = getSpainUtcDate(reservation.check_in, checkInLocalHour);
      const checkOutDateObj = getSpainUtcDate(reservation.check_out, checkOutLocalHour);

      const nukiRes = await upsertNukiKeypadCode(reservationCode, reservation.summary, checkInDateObj, checkOutDateObj, nukiPin);
      
      if (!reservation.is_registered) {
        updatePayload.is_registered = true;
      }
    } else {
      console.log(`[Sync Engine] Reserva NO desbloqueada. (Forms: ${formsComplete}, Tax: ${taxComplete}, Deposit: ${depositComplete}).`);
      // Revoke Nuki if exists
      await deleteNukiKeypadCodesByReservation(reservationCode);
      if (reservation.is_registered) {
        updatePayload.is_registered = false;
      }
    }

    // 6. Save State
    if (platformNeedsUpdate) {
      updatePayload.platform = JSON.stringify(platformData);
    }
    
    // Override tax complete status if it was manually set but differs from calculation (fail safe)
    if (reservation.is_tax_paid !== taxComplete) {
       updatePayload.is_tax_paid = taxComplete;
    }

    if (Object.keys(updatePayload).length > 0) {
      console.log(`[Sync Engine] Actualizando BD para ${reservationCode}:`, Object.keys(updatePayload));
      await supabase.from('reservations').update(updatePayload).eq('reservation_code', reservationCode);
    } else {
      console.log(`[Sync Engine] Ningún estado requirió actualización en BD para ${reservationCode}.`);
    }

    return { success: true, is_registered: isFullyUnlocked };

  } catch (err: any) {
    console.error("[Sync Engine] Fatal Error:", err);
    return { success: false, error: err.message };
  }
}
