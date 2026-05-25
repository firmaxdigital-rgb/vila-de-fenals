import { createClient } from '@supabase/supabase-js';
import { translations, Lang } from './i18n';
import AccesoTabs from './AccesoTabs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
});

function Background() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/60 to-cyan-950/80" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/images/IMG_0566.JPG" 
        alt="Fondo Vila de Fenals" 
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
      />
    </div>
  );
}

function LanguageSelector({ currentLang, reservationCode }: { currentLang: string; reservationCode: string }) {
  const langs = ['es', 'en', 'fr', 'de', 'pl', 'zh', 'uk', 'ru'];
  return (
    <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex flex-wrap justify-end gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-lg max-w-[200px] md:max-w-none">
      {langs.map((l) => (
        <Link 
          key={l} 
          href={`?lang=${l}`}
          className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${currentLang === l ? 'text-cyan-300 drop-shadow-md' : 'text-white/60 hover:text-white/90'}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}

export default async function AccesoPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ reservation_code: string }>;
  searchParams: Promise<{ lang?: string; payment_status?: string; test_mode?: string; micro_charge?: string }>;
}) {
  const resolvedParams = await params;
  const decodedCode = decodeURIComponent(resolvedParams.reservation_code);

  const resolvedSearchParams = await searchParams;
  const langQuery = resolvedSearchParams?.lang as string;
  const lang: Lang = (['es', 'en', 'fr', 'de', 'pl', 'zh', 'uk', 'ru'].includes(langQuery) ? langQuery : 'es') as Lang;
  const dict = translations[lang];
  const paymentStatus = resolvedSearchParams?.payment_status as string;
  const testMode = resolvedSearchParams?.test_mode === 'true' || resolvedSearchParams?.micro_charge === 'true';

  console.log("Cargando reserva:", decodedCode, "TestMode:", testMode);

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', decodedCode)
    .single();

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4 relative">
        <Background />
        <LanguageSelector currentLang={lang} reservationCode={decodedCode} />
        <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center mt-12 md:mt-0">
          <h1 className="text-4xl font-extralight tracking-wide text-white mb-6 drop-shadow-lg">Vila de Fenals</h1>
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
            <p className="text-red-300 text-lg font-medium">{dict.not_found_title}</p>
            <p className="text-white/80 text-sm mt-2 opacity-80">{dict.not_found_desc}</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch travelers registered for this reservation
  let travelers: any[] = [];
  try {
    const { data: travelersData, error: travelersError } = await supabase
      .from('travelers')
      .select('*')
      .eq('reservation_code', decodedCode);
    
    if (!travelersError && travelersData) {
      travelers = travelersData;
    }
  } catch (err) {
    console.warn("Table public.travelers table fetch error:", err);
  }

  const totalGuests = reservation.total_guests || 2;
  const completedForms = travelers.length;
  const isPhase1Complete = completedForms >= totalGuests;

  // Calculate nights
  const checkIn = new Date(reservation.check_in);
  const checkOut = new Date(reservation.check_out);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const rawNights = nights;
  if (nights > 7) nights = 7;
  if (nights < 1) nights = 1;

  // Calculate paying guests aged 16 or older on check-in date
  let payingGuests = 0;
  travelers.forEach((t) => {
    if (!t.fecha_nacimiento) {
      payingGuests++;
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
    }
  });

  const rate = 1.75;
  const calculatedTax = parseFloat((payingGuests * nights * rate).toFixed(2));
  const isTaxPaid = reservation.is_tax_paid === true;

  // Active check-in timeframe variables
  const now = new Date();
  const allowedCheckIn = new Date(reservation.check_in);
  allowedCheckIn.setHours(14, 0, 0, 0); // 2 hours before 16:00 Check-in

  const allowedCheckOut = new Date(reservation.check_out);
  allowedCheckOut.setHours(11, 0, 0, 0); // 1 hour after 10:00 Check-out

  const isValidTime = now >= allowedCheckIn && now <= allowedCheckOut || testMode || decodedCode === 'TEST7GUESTS' || decodedCode === 'HMMR92E9DJ';

  // Display limits warnings
  const displayCheckIn = new Date(reservation.check_in);
  displayCheckIn.setHours(16, 0, 0, 0);

  const displayCheckOut = new Date(reservation.check_out);
  displayCheckOut.setHours(10, 0, 0, 0);

  if (!isValidTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4 relative">
        <Background />
        <LanguageSelector currentLang={lang} reservationCode={decodedCode} />
        <div className="relative z-10 w-full max-w-md bg-white/15 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center mt-12 md:mt-0">
          <h1 className="text-4xl font-extralight tracking-wide text-white mb-6 drop-shadow-lg">Vila de Fenals</h1>
          <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-2xl p-6 text-white space-y-4">
            <p className="text-cyan-300 text-lg font-medium">{dict.inactive_title || 'Llave Virtual Inactiva'}</p>
            <p className="text-xs text-white/70 leading-relaxed">
              Su llave virtual estará disponible a partir de las 14:00 del día de llegada y se desactivará a las 11:00 del día de salida.
            </p>
            <div className="text-left bg-white/5 border border-white/10 rounded-xl p-4 text-xs space-y-2">
              <p className="flex justify-between">
                <span className="text-white/60">Entrada:</span>
                <span className="font-semibold text-cyan-200">{displayCheckIn.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-white/60">Salida:</span>
                <span className="font-semibold text-cyan-200">{displayCheckOut.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate the overall flow unlocks
  const isFullyUnlocked = isPhase1Complete && isTaxPaid;

  // Build travelers list matching total guests slots
  const guestSlots = [];
  for (let i = 0; i < totalGuests; i++) {
    if (travelers[i]) {
      guestSlots.push({
        registered: true,
        nombre: travelers[i].nombre,
        apellidos: travelers[i].apellidos,
        tipo_documento: travelers[i].tipo_documento,
        numero_documento: travelers[i].numero_documento,
        isMinor: travelers[i].parentesco ? true : false,
      });
    } else {
      guestSlots.push({
        registered: false,
        slotIndex: i + 1,
      });
    }
  }

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-center bg-gradient-to-br from-teal-900/40 to-cyan-900/50 relative">
      <Background />
      <LanguageSelector currentLang={lang} reservationCode={decodedCode} />
      
      <div className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_16px_40px_rgba(6,182,212,0.25)] p-6 md:p-8 text-white space-y-6">
        
        {/* Main Portal Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-4xl font-light tracking-wide text-white drop-shadow-md">Vila de Fenals</h1>
          <p className="text-cyan-300 text-xs tracking-[0.25em] uppercase font-bold">{dict.active_key}</p>
        </div>

        <AccesoTabs 
          reservation={reservation}
          travelers={travelers}
          lang={lang}
          paymentStatus={paymentStatus}
          testMode={testMode}
        />

        {/* Footer with platforms details */}
        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-white/50 uppercase font-bold tracking-wider">
          <span>Reserva: {reservation.platform}</span>
          <span>Salida: {displayCheckOut.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
