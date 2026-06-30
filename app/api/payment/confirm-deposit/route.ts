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

    // Calculamos el nuevo total de manera optimista para devolverlo al cliente.
    // IMPORTANTE: NO guardamos en la BD aquí para evitar duplicar el saldo (condición de carrera con el Webhook).
    // El Webhook de PayComet es la única fuente de verdad autorizada para modificar deposit_paid.
    const currentPaid = parseFloat(reservation.deposit_paid) || 0;
    const depositAmount = parseFloat(reservation.deposit_amount) || 0;
    const newPaid = Math.min(currentPaid + parsedAmount, depositAmount);

    const isDepositComplete = newPaid >= depositAmount;
    console.log(`[Confirm Deposit] Calculado (optimista): ${newPaid}€ / ${depositAmount}€. Completo: ${isDepositComplete}`);

    // Eliminado el update() en DB y la lógica de registro final que se disparaba aquí erróneamente.
    // La responsabilidad de disparar el check-in final recae sobre el webhook de PayComet al procesar el pago real.

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
