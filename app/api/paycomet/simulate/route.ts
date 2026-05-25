import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: Request) {
  try {
    const { reservation_code, status } = await request.json();

    if (status === 'PAID') {
      const { error } = await supabase
        .from('reservations')
        .update({ is_tax_paid: true })
        .eq('reservation_code', reservation_code);

      if (error) throw error;

      // Also trigger Check-in Finalization (/api/registro-final) to generate Nuki PIN and Mossos files
      const host = request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = `${proto}://${host}`;

      try {
        const finalizationRes = await fetch(`${baseUrl}/api/registro-final`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reservation_code: reservation_code })
        });

        if (!finalizationRes.ok) {
          const finalizationError = await finalizationRes.text();
          console.error("Simulation finalization error:", finalizationError);
        } else {
          const finalizationData = await finalizationRes.json();
          console.log("Simulation finalization success:", finalizationData);
        }
      } catch (finalError) {
        console.error("Simulation finalization exception:", finalError);
      }
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Not paid' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
