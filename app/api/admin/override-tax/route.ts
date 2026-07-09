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

    // Get current reservation to safely update the platform JSON and check current tax_paid
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('platform, tax_paid, total_guests, has_deposit, deposit_amount, deposit_paid')
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

    platformObj.tax_payment_method = payment_method;

    const currentTaxPaid = parseFloat(reservation.tax_paid || '0');
    const paymentAmount = amount ? parseFloat(amount) : 0;
    const newTaxPaid = currentTaxPaid + paymentAmount;

    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        is_tax_paid: true, 
        tax_paid: newTaxPaid,
        platform: JSON.stringify(platformObj) 
      })
      .eq('reservation_code', reservation_code);

    if (updateError) {
      console.error('Error updating tax override:', updateError);
      return NextResponse.json({ success: false, error: 'Error al actualizar la base de datos.' }, { status: 500 });
    }

    // Check if travelers are complete to trigger finalization
    const { data: travelersData, error: travErr } = await supabase
      .from('travelers')
      .select('id')
      .eq('reservation_code', reservation_code);

    if (!travErr && travelersData) {
      const totalGuests = reservation.total_guests || 2;
      const hasDeposit = reservation.has_deposit === true;
      const depositAmt = parseFloat(reservation.deposit_amount) || 0;
      const depositPaid = parseFloat(reservation.deposit_paid) || 0;
      const isDepositComplete = !hasDeposit || (depositPaid >= depositAmt);

      if (travelersData.length >= totalGuests) {
        const host = request.headers.get('host') || 'localhost:3000';
        const proto = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = `${proto}://${host}`;

        // Ensure mossos email is sent if it wasn't
        try {
          console.log("[Override-tax] Formularios completos. Awaiting mossos-send...");
          const mRes = await fetch(`${baseUrl}/api/mossos-send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_code })
          });
          if (!mRes.ok) console.error("mossos-send returned error:", await mRes.text());
        } catch (mErr) {
          console.error("Excepción en mossos-send:", mErr);
        }

        if (isDepositComplete) {
          console.log(`[Override-tax] Todo completado. Disparando api/registro-final.`);
          try {
            const finalizationRes = await fetch(`${baseUrl}/api/registro-final`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reservation_code })
            });

            if (!finalizationRes.ok) {
              console.error("[Override-tax] Error al disparar api/registro-final:", await finalizationRes.text());
            } else {
              console.log("[Override-tax] api/registro-final completado con éxito.");
            }
          } catch (finalError) {
            console.error("[Override-tax] Excepción en api/registro-final:", finalError);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en override-tax:', error);
    return NextResponse.json({ success: false, error: 'Error interno.' }, { status: 500 });
  }
}
