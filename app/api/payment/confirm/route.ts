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
    const { reservation_code } = await request.json();

    if (!reservation_code) {
      return NextResponse.json({ success: false, error: 'Falta el reservation_code' }, { status: 400 });
    }

    console.log(`[Confirm API] Confirmando pago para la reserva: ${reservation_code}`);

    // Update is_tax_paid to true in the database
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ is_tax_paid: true })
      .eq('reservation_code', reservation_code);

    if (updateError) {
      console.error("[Confirm API] Error al actualizar is_tax_paid:", updateError);
      throw updateError;
    }

    // Check if traveler forms are already complete to trigger final check-in processing
    const { data: resData, error: resErr } = await supabase
      .from('reservations')
      .select('total_guests, has_deposit, deposit_amount, deposit_paid')
      .eq('reservation_code', reservation_code)
      .single();

    if (!resErr && resData) {
      const { data: travelersData, error: travErr } = await supabase
        .from('travelers')
        .select('id')
        .eq('reservation_code', reservation_code);

      if (!travErr && travelersData) {
        const totalGuests = resData.total_guests || 2;
        
        // Verify deposit is complete
        const hasDeposit = resData.has_deposit === true;
        const depositAmt = parseFloat(resData.deposit_amount) || 0;
        const depositPaid = parseFloat(resData.deposit_paid) || 0;
        const isDepositComplete = !hasDeposit || (depositPaid >= depositAmt);

        if (travelersData.length >= totalGuests) {
          if (isDepositComplete) {
            console.log(`[Confirm API] Formularios completos (${travelersData.length}/${totalGuests}) y fianza pagada. Disparando api/registro-final.`);
            const host = request.headers.get('host') || 'localhost:3000';
            const proto = request.headers.get('x-forwarded-proto') || 'http';
            const baseUrl = `${proto}://${host}`;

            try {
              const finalizationRes = await fetch(`${baseUrl}/api/registro-final`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservation_code })
              });

              if (!finalizationRes.ok) {
                const finalizationError = await finalizationRes.text();
                console.error("[Confirm API] Error al disparar api/registro-final:", finalizationError);
              } else {
                console.log("[Confirm API] api/registro-final completado con éxito.");
              }
            } catch (finalError) {
              console.error("[Confirm API] Excepción al disparar api/registro-final:", finalError);
            }
          } else {
            console.log(`[Confirm API] Formularios completos pero falta pagar fianza. No se dispara finalización todavía.`);
          }
        } else {
          console.log(`[Confirm API] Formularios incompletos (${travelersData.length}/${totalGuests}). No se dispara finalización todavía.`);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Pago confirmado y guardado.' });
  } catch (error: any) {
    console.error('[Confirm API] Error en confirmación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
