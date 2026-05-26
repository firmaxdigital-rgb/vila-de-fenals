import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
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

    console.log("PayComet Webhook recibido para Order:", params.Order || params.order || 'N/A');

    // Extract key parameters sent by PayComet (case-insensitive fallback)
    const responseStr = params.Response || params.response || '';
    const rawOrderId = params.Order || params.order || '';
    const signature = params.Signature || params.signature || '';
    const terminal = params.Terminal || params.terminal || '';
    const dateTime = params.DateTime || params.datetime || '';
    const merchantCode = params.MerchantCode || params.merchantcode || '';
    const transactionType = params.TransactionType || params.transactiontype || '1';

    if (!rawOrderId) {
      return NextResponse.json({ success: false, error: 'Falta el Order ID' }, { status: 400 });
    }

    // Extract real reservation code from rawOrderId (if it contains unique suffix like HMMR92E9DJ_1777652721)
    const reservationCode = rawOrderId.includes('_') ? rawOrderId.split('_')[0] : rawOrderId;

    // 2. Validate Signature (Security Check)
    const paycometMerchant = process.env.PAYCOMET_MERCHANT_CODE || '';
    const paycometTerminal = process.env.PAYCOMET_TERMINAL || '';
    const paycometApiKey = process.env.PAYCOMET_API_KEY || ''; // Typically used as password in API calls

    let isSignatureValid = false;

    if (!paycometApiKey || !paycometTerminal || !paycometMerchant) {
      console.error("SEGURIDAD: Credenciales de PayComet no configuradas. Webhook rechazado.");
      return NextResponse.json({ success: false, error: 'Configuración de pago incompleta.' }, { status: 500 });
    }

    const md5Password = crypto.createHash('md5').update(paycometApiKey).digest('hex');
    const signatureSource = `${paycometMerchant}${paycometTerminal}${transactionType}${rawOrderId}${dateTime}${md5Password}`;
    const computedSignature = crypto.createHash('sha512').update(signatureSource).digest('hex');

    isSignatureValid = (computedSignature.toLowerCase() === signature.toLowerCase());

    if (!isSignatureValid) {
      console.error(`SEGURIDAD: Firma de PayComet inválida para Order ${rawOrderId}. Webhook rechazado.`);
      return NextResponse.json({ success: false, error: 'Firma de pago inválida.' }, { status: 403 });
    }

    // 3. Process payment status
    if (responseStr.toUpperCase() === 'OK') {
      console.log(`Pago exitoso confirmado para la reserva: ${reservationCode} (Order ID: ${rawOrderId}). Actualizando base de datos.`);

      // Update is_tax_paid in Supabase reservations table
      const { data: updatedRes, error: dbError } = await supabase
        .from('reservations')
        .update({ is_tax_paid: true })
        .eq('reservation_code', reservationCode)
        .select()
        .single();

      if (dbError) {
        console.error("Error al actualizar is_tax_paid en la reserva:", dbError);
        throw dbError;
      }

      console.log("Reserva actualizada en Supabase. Disparando finalización de registro y Nuki.");

      // 4. Trigger Check-in Finalization
      // We fetch internally to trigger generating Nuki PIN, registering Mossos TXT and sending Email
      const host = request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = `${proto}://${host}`;

      try {
        const finalizationRes = await fetch(`${baseUrl}/api/registro-final`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reservation_code: reservationCode })
        });

        if (!finalizationRes.ok) {
          const finalizationError = await finalizationRes.text();
          console.error("Error al disparar api/registro-final:", finalizationError);
        } else {
          const finalizationData = await finalizationRes.json();
          console.log("Finalización de check-in exitosa:", finalizationData);
        }
      } catch (finalError) {
        console.error("Excepción al llamar a api/registro-final:", finalError);
        // We do not fail the webhook since the DB was already updated successfully
      }

      return NextResponse.json({ success: true, message: 'Pago verificado y check-in finalizado.' });
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
