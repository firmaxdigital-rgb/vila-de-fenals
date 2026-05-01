import { createClient } from '@supabase/supabase-js';
import OpenDoorButton from './OpenDoorButton';

// Nota: En un Server Component, se aconseja no exponer la clave anon, pero como necesitamos leer sin RLS (o si configuraste lectura pública en RLS), podemos usar la Anon Key o la Service Role.
// Si RLS restringe la lectura pública, usa SUPABASE_SERVICE_ROLE_KEY.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Componente para manejar la imagen de fondo y sus fallos
function Background() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10">
      {/* Fallback de color por si la imagen falla */}
      <div className="absolute inset-0 bg-slate-900" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/Imágenes del Apartamento/fuente_terraza.jpg" 
        alt="Fondo Vila de Fenals" 
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}

export default async function AccesoPage({ params }: { params: Promise<{ reservation_code: string }> }) {
  // En Next.js 15+ "params" es una Promise y debe resolverse primero
  const resolvedParams = await params;
  const { reservation_code } = resolvedParams;

  // Consultar en la base de datos
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', reservation_code)
    .single();

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/60 p-4 relative">
        <Background />
        <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8 text-center">
          <h1 className="text-3xl font-light tracking-wide text-white mb-6 drop-shadow-md">Vila de Fenals</h1>
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6">
            <p className="text-red-100 text-lg font-medium">Reserva no encontrada</p>
            <p className="text-red-100/70 text-sm mt-2">Revisa el enlace o contacta con el anfitrión.</p>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  
  // Validar hora de Check-in: a partir de las 15:00
  const checkInDate = new Date(reservation.check_in);
  checkInDate.setHours(15, 0, 0, 0);

  // Validar hora de Check-out: hasta las 11:00
  const checkOutDate = new Date(reservation.check_out);
  checkOutDate.setHours(11, 0, 0, 0);

  const isValidTime = now >= checkInDate && now <= checkOutDate;

  if (!isValidTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/60 p-4 relative">
        <Background />
        <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8 text-center">
          <h1 className="text-3xl font-light tracking-wide text-white mb-6 drop-shadow-md">Vila de Fenals</h1>
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6">
            <p className="text-yellow-100 text-lg font-medium mb-3">Tu llave virtual está inactiva fuera de las fechas de reserva.</p>
            <div className="text-yellow-100/80 text-sm space-y-1">
              <p>Check-in: {checkInDate.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p>Check-out: {checkOutDate.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si todo es válido
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black/50 p-4 relative">
      <Background />
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8 text-center flex flex-col items-center">
        <h1 className="text-3xl font-light tracking-wide text-white mb-2 drop-shadow-md">Vila de Fenals</h1>
        <p className="text-white/70 mb-10 text-sm tracking-widest uppercase">Llave Virtual Activa</p>
        
        <OpenDoorButton reservationCode={reservation_code} />

        <div className="mt-10 pt-6 border-t border-white/10 w-full flex justify-between items-center text-xs text-white/50">
          <span className="uppercase tracking-wider">{reservation.platform}</span>
          <span>Válido hasta {checkOutDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}h</span>
        </div>
      </div>
    </div>
  );
}
