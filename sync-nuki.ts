import { createClient } from '@supabase/supabase-js';
import { getCleanNukiName, deleteNukiKeypadCodesByReservation, createNukiKeypadCode } from './lib/nuki';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const reservation_code = 'HMDRKRWQSK';

function getSpainUtcDate(dateStr: string, localHour: number) {
  const checkDate = new Date(dateStr + 'T12:00:00Z');
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
    const finalDate = new Date(dateStr + 'T00:00:00Z');
    finalDate.setUTCHours(utcHour, 0, 0, 0);
    return finalDate;
  }
  
  const madridHour = parseInt(hourPart.value, 10);
  const offset = madridHour - 12;
  const utcHour = localHour - offset;
  
  const finalDate = new Date(dateStr + 'T00:00:00Z');
  finalDate.setUTCHours(utcHour, 0, 0, 0);
  
  return finalDate;
}

async function run() {
  console.log('Fetching reservation:', reservation_code);
  const { data: res, error } = await supabase.from('reservations').select('*').eq('reservation_code', reservation_code).single();
  if (error || !res) {
    console.error('Error fetching:', error);
    return;
  }

  const nukiPin = res.nuki_pin;
  if (!nukiPin) {
    console.error('No Nuki PIN in DB for this reservation!');
    return;
  }

  let checkInTime = '16:00';
  let checkOutTime = '10:00';
  if (res.platform && res.platform.startsWith('{')) {
    try {
      const parsed = JSON.parse(res.platform);
      checkInTime = parsed.check_in_time || '16:00';
      checkOutTime = parsed.check_out_time || '10:00';
    } catch(e){}
  }

  const checkInHourInput = parseInt(checkInTime.split(':')[0], 10);
  const checkInLocalHour = checkInHourInput - 1;

  const checkOutHourInput = parseInt(checkOutTime.split(':')[0], 10);
  const checkOutLocalHour = checkOutHourInput + 1;

  const checkInDateObj = getSpainUtcDate(res.check_in, checkInLocalHour);
  const checkOutDateObj = getSpainUtcDate(res.check_out, checkOutLocalHour);

  const nukiName = getCleanNukiName(reservation_code, res.summary);

  console.log('Syncing to Nuki for:', nukiName, 'PIN:', nukiPin);
  await deleteNukiKeypadCodesByReservation(reservation_code);
  
  const result = await createNukiKeypadCode(
    nukiName,
    checkInDateObj,
    checkOutDateObj,
    nukiPin
  );
  console.log('Result:', result);
}
run();
