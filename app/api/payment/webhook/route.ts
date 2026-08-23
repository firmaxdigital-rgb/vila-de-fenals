import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
});

export async function POST(request: Request) {
  try {
    // 1. Parse body (supports JSON or Form URL-encoded)
    let params: any = {};
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      params = await request.json();
    } else {
      const bodyText = await request.text();
      const searchParams = new URLSearchParams(bodyText);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    // Convert params to lowercase keys for case-insensitive access
    const lowerParams: any = {};
    Object.keys(params).forEach(k => {
      lowerParams[k.toLowerCase()] = params[k];
    });

    console.log("PayComet Webhook recibido para Order:", lowerParams.order || 'N/A');

    // Extract key parameters sent by PayComet
    const responseStr = lowerParams.response || '';
    const rawOrderId = lowerParams.order || '';
    const signature = lowerParams.signature || '';
    const terminal = lowerParams.terminal || '';
    const dateTime = lowerParams.datetime || '';
    const merchantCode = lowerParams.merchantcode || '';
    const transactionType = lowerParams.transactiontype || '1';
    const amountStr = lowerParams.amount || '';
    const currencyStr = lowerParams.currency || '';

    if (!rawOrderId) {
      return NextResponse.json({ success: false, error: 'Falta el Order ID' }, { status: 400 });
    }

    // Extract real reservation code from rawOrderId
    const reservationCode = rawOrderId.includes('_') ? rawOrderId.split('_')[0] : rawOrderId;

    // 2. Validate Signature (Security Check)
    const paycometMerchant = process.env.PAYCOMET_MERCHANT_CODE || '';
    const paycometTerminal = process.env.PAYCOMET_TERMINAL || '';
    const paycometApiKey = process.env.PAYCOMET_API_KEY || ''; 

    let isSignatureValid = false;

    if (!paycometApiKey || !paycometTerminal || !paycometMerchant) {
      console.error("SEGURIDAD: Credenciales de PayComet no configuradas. Webhook rechazado.");
      return NextResponse.json({ success: false, error: 'Configuración de pago incompleta.' }, { status: 500 });
    }

    const md5Password = crypto.createHash('md5').update(paycometApiKey).digest('hex');
    
    // Paycomet has changed signature formats over time and depending on the API used. 
    // We check the most common valid permutations to ensure we don't reject valid webhooks.
    const sig1 = crypto.createHash('sha512').update(`${paycometMerchant}${paycometTerminal}${transactionType}${rawOrderId}${amountStr}${dateTime}${md5Password}`).digest('hex');
    const sig2 = crypto.createHash('sha512').update(`${paycometMerchant}${paycometTerminal}${transactionType}${rawOrderId}${dateTime}${md5Password}`).digest('hex');
    const sig3 = crypto.createHash('sha512').update(`${paycometMerchant}${paycometTerminal}${transactionType}${rawOrderId}${amountStr}${currencyStr}${md5Password}`).digest('hex');
    const sig4 = crypto.createHash('sha512').update(`${paycometMerchant}${paycometTerminal}${transactionType}${rawOrderId}${amountStr}${md5Password}`).digest('hex');

    const validSignatures = [sig1, sig2, sig3, sig4].map(s => s.toLowerCase());
    isSignatureValid = validSignatures.includes(signature.toLowerCase());

    if (!isSignatureValid) {
      console.error(`SEGURIDAD: Firma de PayComet inválida para Order ${rawOrderId}. Webhook rechazado.`);
      console.error(`Recibida: ${signature}. Calculadas: ${validSignatures.join(', ')}`);
      return NextResponse.json({ success: false, error: 'Firma de pago inválida.' }, { status: 403 });
    }

    // 3. Process payment status
    if (responseStr.toUpperCase() === 'OK') {
      console.log(`Pago exitoso confirmado para la reserva: ${reservationCode} (Order ID: ${rawOrderId}). Actualizando base de datos.`);

      const isDeposit = rawOrderId.includes('_DEP');

      if (isDeposit) {
        // Extract payment amount from webhook params
        const amountCents = amountStr || '0';
        const amountPaid = parseFloat(amountCents) / 100;

        if (isNaN(amountPaid) || amountPaid <= 0) {
          console.error(`[Webhook] Importe del depósito no válido: ${amountCents} céntimos`);
          return NextResponse.json({ success: false, error: 'Importe de fianza no válido' }, { status: 400 });
        }

        console.log(`[Webhook] Confirmando pago de depósito de ${amountPaid}€ para la reserva ${reservationCode}`);

        // Fetch current reservation
        const { data: reservation, error: fetchErr } = await supabase
          .from('reservations')
          .select('deposit_amount, deposit_paid, has_deposit, total_guests, is_tax_paid, is_registered')
          .eq('reservation_code', reservationCode)
          .single();

        if (fetchErr || !reservation) {
          console.error(`[Webhook] Reserva no encontrada para fianza: ${reservationCode}`);
          return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
        }

        const currentPaid = parseFloat(reservation.deposit_paid) || 0;
        const depositAmt = parseFloat(reservation.deposit_amount) || 0;
        const newPaid = Math.min(currentPaid + amountPaid, depositAmt);

        const { error: updateErr } = await supabase
          .from('reservations')
          .update({ deposit_paid: newPaid })
          .eq('reservation_code', reservationCode);

        if (updateErr) {
          console.error('[Webhook] Error actualizando deposit_paid:', updateErr);
          throw updateErr;
        }

        const isDepositComplete = newPaid >= depositAmt;
        console.log(`[Webhook] deposit_paid actualizado: ${newPaid}€ / ${depositAmt}€. Completo: ${isDepositComplete}`);

        // Sync State Engine
        try {
          const { syncReservationState } = require('../../../../lib/sync');
          await syncReservationState(reservationCode);
        } catch (e) {
          console.error('[Webhook] Error disparando sync engine:', e);
        }

        return NextResponse.json({ success: true, message: `Pago parcial de fianza registrado: ${amountPaid}€` });
      } else {
        // Normal tax payment
        const amountCents = amountStr || '0';
        const amountPaid = parseFloat(amountCents) / 100;

        const { data: reservation, error: fetchErr } = await supabase
          .from('reservations')
          .select('has_deposit, deposit_amount, deposit_paid, tax_paid')
          .eq('reservation_code', reservationCode)
          .single();

        const currentTaxPaid = parseFloat(reservation?.tax_paid || '0');
        const newTaxPaid = currentTaxPaid + (isNaN(amountPaid) ? 0 : amountPaid);

        const { data: updatedRes, error: dbError } = await supabase
          .from('reservations')
          .update({ is_tax_paid: true, tax_paid: newTaxPaid })
          .eq('reservation_code', reservationCode)
          .select()
          .single();

        if (dbError) {
          console.error("Error al actualizar is_tax_paid en la reserva:", dbError);
          throw dbError;
        }

        console.log("Reserva actualizada en Supabase. Comprobando si se cumplen las condiciones de finalización.");

        // Check if there is a deposit that is NOT paid yet
        const hasDeposit = reservation?.has_deposit;
        const depositAmt = parseFloat(reservation?.deposit_amount) || 0;
        const depositPaid = parseFloat(reservation?.deposit_paid) || 0;
        const isDepositComplete = !hasDeposit || (depositPaid >= depositAmt);

        if (!isDepositComplete) {
          console.log("[Webhook] Pago de tasa verificado, pero falta completar la fianza. No se dispara la finalización aún.");
          return NextResponse.json({ success: true, message: 'Pago de tasa registrado. Esperando pago de fianza.' });
        }

        // Sync State Engine
        try {
          const { syncReservationState } = require('../../../../lib/sync');
          await syncReservationState(reservationCode);
        } catch (e) {
          console.error('[Webhook] Error disparando sync engine:', e);
        }

        return NextResponse.json({ success: true, message: 'Pago verificado y check-in finalizado.' });
      }
    } else {
      console.log(`El pago de PayComet no fue exitoso. Estado recibido: ${responseStr}`);
      return NextResponse.json({ success: false, error: 'El pago no fue autorizado.' });
    }

  } catch (error: any) {
    console.error('Error en PayComet Webhook:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno al procesar el Webhook de pago.'
    }, { status: 500 });
  }
}
