import { createClient } from '@supabase/supabase-js';
import TasaForm from './TasaForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export default async function TasaTuristicaPage({ params }: { params: Promise<{ reservation_code: string }> }) {
  const resolvedParams = await params;
  const decodedCode = decodeURIComponent(resolvedParams.reservation_code);

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', decodedCode)
    .single();

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4">
        <p className="text-white">Error al cargar la reserva.</p>
      </div>
    );
  }

  // Calculate nights
  const checkIn = new Date(reservation.check_in);
  const checkOut = new Date(reservation.check_out);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (nights > 7) nights = 7;
  if (nights < 1) nights = 1;

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-br from-teal-900/40 to-cyan-900/50 relative">
      <div className="absolute inset-0 w-full h-full -z-10 bg-gradient-to-br from-teal-300 to-cyan-600" />
      
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-6 md:p-8">
        <h1 className="text-3xl font-light text-white mb-2 text-center drop-shadow-md">Tasa Turística</h1>
        <p className="text-cyan-100/90 text-sm text-center mb-8">
          Abono del impuesto sobre estancias en establecimientos turísticos.
        </p>
        
        <div className="bg-black/20 border border-white/10 rounded-2xl p-5 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Noches facturables</span>
            <span className="text-white font-bold">{nights}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/70 text-sm">Tarifa por noche/persona</span>
            <span className="text-white font-bold">1.75€</span>
          </div>
          <p className="text-white/40 text-[10px] mt-3 leading-tight">
            * La tasa está limitada a un máximo de 7 noches. Quedan exentos los menores de 17 años.
          </p>
        </div>

        <TasaForm reservationCode={decodedCode} calculatedNights={nights} />

        <div className="text-center mt-6">
          <Link href={`/viladefenals/acceso/${decodedCode}`} className="text-white/60 text-sm hover:text-white transition-colors">
            Volver al acceso
          </Link>
        </div>
      </div>
    </div>
  );
}
