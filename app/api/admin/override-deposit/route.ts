import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { pin, reservation_code, payment_method, amount } = await request.json();

    if (!pin || !reservation_code || !payment_method) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    const correctPin = process.env.ADMIN_PIN;
    if (!correctPin || pin !== correctPin) {
      return NextResponse.json({ success: false, error: 'PIN incorrecto.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    });

    // Get current reservation to safely update the platform JSON and check current deposit_paid
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('platform, deposit_paid, deposit_amount')
      .eq('reservation_code', reservation_code)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada.' }, { status: 404 });
    }

    let platformObj: any = {};
    if (reservation.platform && typeof reservation.platform === 'string') {
      try {
        platformObj = JSON.parse(reservation.platform);
      } catch (e) {
        platformObj = { original_platform: reservation.platform };
      }
    }

    platformObj.deposit_payment_method = payment_method;

    const currentDepositPaid = parseFloat(reservation.deposit_paid || '0');
    const paymentAmount = amount ? parseFloat(amount) : 0;
    const newDepositPaid = currentDepositPaid + paymentAmount;

    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        deposit_paid: newDepositPaid,
        platform: JSON.stringify(platformObj) 
      })
      .eq('reservation_code', reservation_code);

    if (updateError) {
      console.error('Error updating deposit override:', updateError);
      return NextResponse.json({ success: false, error: 'Error al actualizar la base de datos.' }, { status: 500 });
    }

    // Sync State Engine
    try {
      const { syncReservationState } = require('../../../../lib/sync');
      await syncReservationState(reservation_code);
    } catch (triggerErr) {
      console.error("Error running sync engine in override-deposit:", triggerErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en override-deposit:', error);
    return NextResponse.json({ success: false, error: 'Error interno.' }, { status: 500 });
  }
}
