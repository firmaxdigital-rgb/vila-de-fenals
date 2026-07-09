import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { pin, reservation_code, payment_method } = await request.json();

    if (!pin || !reservation_code || !payment_method) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    const correctPin = process.env.ADMIN_PIN;
    if (!correctPin || pin !== correctPin) {
      return NextResponse.json({ success: false, error: 'PIN incorrecto.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current reservation to safely update the platform JSON
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('platform')
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
        // If it was just a string, we might just put it inside an object
        platformObj = { original_platform: reservation.platform };
      }
    }

    // Set the new payment method
    platformObj.tax_payment_method = payment_method;

    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        is_tax_paid: true, 
        platform: JSON.stringify(platformObj) 
      })
      .eq('reservation_code', reservation_code);

    if (updateError) {
      console.error('Error updating tax override:', updateError);
      return NextResponse.json({ success: false, error: 'Error al actualizar la base de datos.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en override-tax:', error);
    return NextResponse.json({ success: false, error: 'Error interno.' }, { status: 500 });
  }
}
