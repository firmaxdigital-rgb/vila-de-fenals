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
    const { reservation_code, amount, order_id } = await request.json();

    if (!reservation_code || amount === undefined) {
      return NextResponse.json({ success: false, error: 'Falta reservation_code o amount' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Importe no válido' }, { status: 400 });
    }

    console.log(`[Confirm Deposit] Confirmando pago de depósito de ${parsedAmount}€ para reserva ${reservation_code} (Order: ${order_id || 'N/A'})`);

    // Fetch current reservation to get deposit_paid and platform metadata
    const { data: reservation, error: fetchErr } = await supabase
      .from('reservations')
      .select('deposit_amount, deposit_paid, has_deposit, platform')
      .eq('reservation_code', reservation_code)
      .single();

    if (fetchErr || !reservation) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (!reservation.has_deposit) {
      return NextResponse.json({ success: false, error: 'Esta reserva no tiene fianza configurada.' }, { status: 400 });
    }

    let platformObj: any = {};
    if (reservation.platform) {
      if (typeof reservation.platform === 'string' && reservation.platform.trim().startsWith('{')) {
        try {
          platformObj = JSON.parse(reservation.platform);
        } catch (e) {
          console.error("[Confirm Deposit] Error parsing platform JSON:", e);
        }
      } else if (typeof reservation.platform === 'object') {
        platformObj = reservation.platform;
      }
    }

    const processedOrders: string[] = Array.isArray(platformObj.processed_orders) 
      ? platformObj.processed_orders 
      : [];

    const currentPaid = parseFloat(reservation.deposit_paid || '0');
    const depositAmount = parseFloat(reservation.deposit_amount || '0');

    // Check idempotency: if this exact order was already counted, do not add it again
    if (order_id && processedOrders.includes(order_id)) {
      console.log(`[Confirm Deposit] Order ${order_id} already registered. Current total: ${currentPaid}€`);
      const isComplete = currentPaid >= depositAmount;
      return NextResponse.json({
        success: true,
        deposit_paid: currentPaid,
        deposit_complete: isComplete,
        message: 'Orden ya procesada anteriormente.'
      });
    }

    // Accumulate payment amount
    const newPaid = parseFloat((currentPaid + parsedAmount).toFixed(2));
    const cappedPaid = depositAmount > 0 ? Math.min(newPaid, depositAmount) : newPaid;
    const isDepositComplete = cappedPaid >= depositAmount;

    if (order_id) {
      processedOrders.push(order_id);
    }
    platformObj.processed_orders = processedOrders;

    // Persist new deposit_paid and order history to Supabase
    const { error: updateErr } = await supabase
      .from('reservations')
      .update({
        deposit_paid: cappedPaid,
        platform: JSON.stringify(platformObj),
        updated_at: new Date().toISOString()
      })
      .eq('reservation_code', reservation_code);

    if (updateErr) {
      console.error("[Confirm Deposit] Error updating reservations in DB:", updateErr);
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    console.log(`[Confirm Deposit] DB actualizado con éxito: ${currentPaid}€ + ${parsedAmount}€ = ${cappedPaid}€ / ${depositAmount}€. Completo: ${isDepositComplete}`);

    // Sync State Engine
    try {
      const { syncReservationState } = require('../../../../lib/sync');
      await syncReservationState(reservation_code);
    } catch (e) {
      console.error("[Confirm Deposit] Error running sync engine:", e);
    }

    return NextResponse.json({
      success: true,
      deposit_paid: cappedPaid,
      deposit_complete: isDepositComplete,
      message: isDepositComplete ? 'Fianza pagada completamente.' : `Pago parcial registrado. Total pagado: ${cappedPaid}€`
    });
  } catch (error: any) {
    console.error('[Confirm Deposit] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
