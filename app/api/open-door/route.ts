import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usar Service Role para no depender de RLS en la API
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const IFTTT_WEBHOOK_URL = process.env.IFTTT_WEBHOOK_URL!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: Request) {
  try {
    const { reservation_code } = await request.json();

    if (!reservation_code) {
      return NextResponse.json({ success: false, message: 'Falta código de reserva' }, { status: 400 });
    }

    // Verificar en Supabase
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_code', reservation_code)
      .single();

    if (error || !reservation) {
      return NextResponse.json({ success: false, message: 'Reserva no encontrada' }, { status: 404 });
    }

    const now = new Date();
    
    // Validar hora de Check-in: a partir de las 15:00 del día de entrada
    const checkInDate = new Date(reservation.check_in);
    checkInDate.setHours(15, 0, 0, 0);

    // Validar hora de Check-out: hasta las 11:00 del día de salida
    const checkOutDate = new Date(reservation.check_out);
    checkOutDate.setHours(11, 0, 0, 0);

    if (now < checkInDate || now > checkOutDate) {
      return NextResponse.json({ success: false, message: 'Fuera del horario permitido' }, { status: 403 });
    }

    // Si llegamos aquí, la fecha/hora es válida. Lanzamos el Webhook de IFTTT.
    if (!IFTTT_WEBHOOK_URL) {
        console.warn("Falta IFTTT_WEBHOOK_URL en el .env");
    } else {
        const iftttResponse = await fetch(IFTTT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value1: reservation_code }),
        });

        if (!iftttResponse.ok) {
            return NextResponse.json({ success: false, message: 'Error al contactar con IFTTT' }, { status: 502 });
        }
    }

    return NextResponse.json({ success: true, message: 'Portal abierto exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
