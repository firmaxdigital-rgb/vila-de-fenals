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

  // 1. Fetch reservation
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', decodedCode)
    .single();

  if (resError || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4">
        <p className="text-white">Error al cargar la reserva.</p>
      </div>
    );
  }

  // 2. Fetch travelers to cross-reference their birthdates for tourist tax calculation
  const { data: travelers, error: travError } = await supabase
    .from('travelers')
    .select('*')
    .eq('reservation_code', decodedCode);

  if (travError || !travelers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4">
        <p className="text-white">Error al cargar los datos de viajeros.</p>
      </div>
    );
  }

  // Calculate nights
  const checkIn = new Date(reservation.check_in);
  const checkOut = new Date(reservation.check_out);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const rawNights = nights;
  if (nights > 7) nights = 7; // Cap at 7 nights
  if (nights < 1) nights = 1;

  // Calculate paying guests (aged 17 or older on check-in date)
  let payingGuests = 0;
  let exemptGuests = 0;
  const payingGuestNames: string[] = [];
  const exemptGuestNames: string[] = [];

  travelers.forEach((t) => {
    if (!t.fecha_nacimiento) {
      payingGuests++;
      payingGuestNames.push(`${t.nombre} ${t.apellidos}`);
      return;
    }

    const birthDate = new Date(t.fecha_nacimiento);
    let ageOnCheckIn = checkIn.getFullYear() - birthDate.getFullYear();
    const m = checkIn.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && checkIn.getDate() < birthDate.getDate())) {
      ageOnCheckIn--;
    }

    if (ageOnCheckIn >= 16) {
      payingGuests++;
      payingGuestNames.push(`${t.nombre} ${t.apellidos} (${ageOnCheckIn} años)`);
    } else {
      exemptGuests++;
      exemptGuestNames.push(`${t.nombre} ${t.apellidos} (${ageOnCheckIn} años - Exento menor de 16)`);
    }
  });

  const rate = 1.75;
  const totalToPay = parseFloat((payingGuests * nights * rate).toFixed(2));

  return (
    <div className="min-h-screen text-white font-sans relative pb-20">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/images/IMG_0566.JPG" 
          alt="Fondo Vila de Fenals" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative z-20 max-w-md mx-auto pt-8 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light tracking-wider mb-2">VILA DE FENALS</h1>
          <p className="text-cyan-300 text-xs tracking-[0.25em] uppercase font-bold">Tasa Turística</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_16px_40px_rgba(6,182,212,0.25)] p-6 md:p-8">
          <p className="text-cyan-100/90 text-sm text-center mb-8">
            Abono obligatorio del impuesto sobre estancias en establecimientos turísticos (Generalitat de Catalunya).
          </p>
          
          {/* Breakdown Card */}
          <div className="bg-black/30 border border-white/15 rounded-2xl p-5 mb-6 text-white space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
              <span className="text-white/60">Huéspedes sujetos a tasa (≥16 años)</span>
              <span className="font-bold text-cyan-300">{payingGuests} de {travelers.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
              <span className="text-white/60">Noches de estancia (Facturables)</span>
              <span className="font-bold text-cyan-300">{rawNights} {rawNights > 7 ? '(Capped a 7 noches)' : ''}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Tarifa general Cataluña</span>
              <span className="font-bold text-cyan-300">1.75€ / noche por huésped</span>
            </div>
          </div>

          {/* Dynamic breakdown detail */}
          <div className="mb-6 space-y-2">
            {payingGuestNames.length > 0 && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs uppercase tracking-wider text-teal-300 font-bold mb-1">Huéspedes Sujetos a Pago</p>
                <ul className="text-sm text-white/80 list-disc list-inside space-y-0.5">
                  {payingGuestNames.map((name, i) => <li key={i}>{name}</li>)}
                </ul>
              </div>
            )}
            {exemptGuestNames.length > 0 && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs uppercase tracking-wider text-yellow-300 font-bold mb-1">Huéspedes Exentos</p>
                <ul className="text-sm text-white/60 list-disc list-inside space-y-0.5">
                  {exemptGuestNames.map((name, i) => <li key={i}>{name}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* TasaForm carrying paycomet simulation details */}
          <TasaForm 
            reservationCode={decodedCode} 
            payingGuests={payingGuests} 
            nights={nights} 
            totalAmount={totalToPay} 
          />

          <div className="text-center mt-6">
            <Link href={`/viladefenals/acceso/${decodedCode}`} className="text-white/50 text-sm hover:text-white transition-colors">
              Volver al acceso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
