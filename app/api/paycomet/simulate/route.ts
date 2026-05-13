import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Not paid' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
