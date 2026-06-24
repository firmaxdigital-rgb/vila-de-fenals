import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteNukiKeypadCodesByReservation } from '../../../lib/nuki';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { reservationCode, password } = await request.json();

    if (!reservationCode || !password) {
      return NextResponse.json({ success: false, error: 'Código de reserva y contraseña requeridos.' }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password !== adminPassword) {
      return NextResponse.json({ success: false, error: 'Contraseña incorrecta.' }, { status: 401 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Attempt to delete Nuki codes (if any)
    try {
      await deleteNukiKeypadCodesByReservation(reservationCode);
    } catch (nukiErr) {
      console.error(`Error deleting Nuki auths for ${reservationCode}:`, nukiErr);
      // We don't fail the deletion if Nuki fails (maybe it was already deleted or Nuki API is down)
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('reservation_code', reservationCode);

    if (error) {
      console.error('Error borrando en Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Also optionally delete the traveler record to keep DB clean, though ON DELETE CASCADE might be set.
    // We do it manually just in case.
    await supabase
      .from('travelers')
      .delete()
      .eq('reservation_code', reservationCode);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error general en delete-reservation:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
