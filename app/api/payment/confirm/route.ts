import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
});

export async function POST(request: Request) {
  try {
    const { reservation_code, amount } = await request.json();

    if (!reservation_code) {
      return NextResponse.json({ success: false, error: 'Falta el reservation_code' }, { status: 400 });
    }

    console.log(`[Confirm API] Confirmando pago para la reserva: ${reservation_code}`);

    // Fetch current tax_paid to accumulate the new amount
    const { data: currentRes } = await supabase
      .from('reservations')
      .select('tax_paid')
      .eq('reservation_code', reservation_code)
      .single();

    const currentTaxPaid = parseFloat(currentRes?.tax_paid || '0');
    const paymentAmount = amount ? parseFloat(amount) : 0;
    const newTaxPaid = currentTaxPaid + paymentAmount;

    // Update is_tax_paid to true in the database and save the accumulated tax_paid
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ is_tax_paid: true, tax_paid: newTaxPaid })
      .eq('reservation_code', reservation_code);

    if (updateError) {
      console.error("[Confirm API] Error al actualizar is_tax_paid:", updateError);
      throw updateError;
    }

    // Sync State Engine
    try {
      const { syncReservationState } = require('../../../../lib/sync');
      await syncReservationState(reservation_code);
    } catch (triggerErr) {
      console.error("[Confirm API] Error running sync engine:", triggerErr);
    }

    return NextResponse.json({ success: true, message: 'Pago confirmado y guardado.' });
  } catch (error: any) {
    console.error('[Confirm API] Error en confirmación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
