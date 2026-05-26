import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export async function POST(request: Request) {
  try {
    const { reservation_code, amount } = await request.json();

    if (!reservation_code || !amount) {
      return NextResponse.json({ success: false, error: 'Falta reservation_code o amount' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Importe no válido' }, { status: 400 });
    }

    console.log(`[Confirm Deposit] Confirmando pago de depósito de ${parsedAmount}€ para reserva ${reservation_code}`);

    // Fetch current reservation to get deposit_paid
    const { data: reservation, error: fetchErr } = await supabase
      .from('reservations')
      .select('deposit_amount, deposit_paid, has_deposit')
      .eq('reservation_code', reservation_code)
      .single();

    if (fetchErr || !reservation) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (!reservation.has_deposit) {
      return NextResponse.json({ success: false, error: 'Esta reserva no tiene fianza configurada.' }, { status: 400 });
    }

    // Add the paid amount to the current deposit_paid
    const currentPaid = parseFloat(reservation.deposit_paid) || 0;
    const newPaid = Math.min(currentPaid + parsedAmount, parseFloat(reservation.deposit_amount) || 0);

    const { error: updateErr } = await supabase
      .from('reservations')
      .update({ deposit_paid: newPaid })
      .eq('reservation_code', reservation_code);

    if (updateErr) {
      console.error('[Confirm Deposit] Error updating deposit_paid:', updateErr);
      throw updateErr;
    }

    const isDepositComplete = newPaid >= (parseFloat(reservation.deposit_amount) || 0);
    console.log(`[Confirm Deposit] deposit_paid actualizado: ${newPaid}€ / ${reservation.deposit_amount}€. Completo: ${isDepositComplete}`);

    // If deposit is now complete, check if we should trigger finalization
    if (isDepositComplete) {
      const { data: fullRes } = await supabase
        .from('reservations')
        .select('total_guests, is_tax_paid, is_registered')
        .eq('reservation_code', reservation_code)
        .single();

      if (fullRes && fullRes.is_tax_paid && !fullRes.is_registered) {
        // Check if all travelers are registered
        const { data: travelers } = await supabase
          .from('travelers')
          .select('id')
          .eq('reservation_code', reservation_code);

        if (travelers && travelers.length >= (fullRes.total_guests || 2)) {
          console.log(`[Confirm Deposit] All conditions met. Triggering finalization for ${reservation_code}`);
          const host = request.headers.get('host') || 'localhost:3000';
          const proto = request.headers.get('x-forwarded-proto') || 'http';
          const baseUrl = `${proto}://${host}`;

          fetch(`${baseUrl}/api/registro-final`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_code })
          }).catch(e => console.error('[Confirm Deposit] Error triggering finalization:', e));
        }
      }
    }

    return NextResponse.json({
      success: true,
      deposit_paid: newPaid,
      deposit_complete: isDepositComplete,
      message: isDepositComplete ? 'Fianza pagada completamente.' : `Pago parcial registrado. Total pagado: ${newPaid}€`
    });
  } catch (error: any) {
    console.error('[Confirm Deposit] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
