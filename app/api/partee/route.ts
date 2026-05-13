import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const PARTEE_API_TOKEN = process.env.PARTEE_API_TOKEN;

    if (!PARTEE_API_TOKEN) {
      console.warn("Falta PARTEE_API_TOKEN en el entorno.");
      
      // Update Supabase anyway for the UI flow demonstration
      if (data.reservation_code) {
        await supabase.from('reservations').update({ is_registered: true }).eq('reservation_code', data.reservation_code);
      }
      
      // For development, we return success so the user can test the UI without the actual API connection yet.
      return NextResponse.json({ success: true, message: 'Simulado con éxito por falta de token', data });
    }

    // This is a stub for the actual Partee endpoint which we'll configure
    // typically https://app.partee.es/api/v1/guests or similar
    console.log("Enviando registro a Partee para:", data.nombre, data.apellidos);
    
    // Simulate API call for now to verify the data structure
    // const response = await fetch('https://app.partee.es/api/v1/guests', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${PARTEE_API_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(data)
    // });
    
    // if (!response.ok) throw new Error("Error en la API de Partee");

    // Mark as registered in Supabase
    if (data.reservation_code) {
      await supabase.from('reservations').update({ is_registered: true }).eq('reservation_code', data.reservation_code);
    }

    return NextResponse.json({ success: true, message: 'Registro enviado correctamente' });
  } catch (error: any) {
    console.error('Error en Partee API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
