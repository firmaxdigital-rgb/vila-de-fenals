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
    <div className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-black/60 z-10" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/images/IMG_0566.JPG" 
        alt="Fondo Vila de Fenals" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function LanguageSelector({ currentLang }: { currentLang: string }) {
  const langs = ['es', 'en', 'fr', 'nl', 'de', 'pl', 'uk', 'ru', 'zh', 'ja'];
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 w-fit mx-auto">
      {langs.map((l) => (
        <Link 
          key={l} 
          href={`?lang=${l}`}
          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors ${currentLang === l ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white'}`}
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
  const lang: Lang = (['es', 'en', 'fr', 'nl', 'de', 'pl', 'uk', 'ru', 'zh', 'ja'].includes(langQuery) ? langQuery : 'es') as Lang;
  const dict = translations[lang];
  const paymentStatus = resolvedSearchParams?.payment_status as string;
  const testMode = resolvedSearchParams?.test_mode === 'true' || resolvedSearchParams?.micro_charge === 'true' || decodedCode === 'TESTPROD' || decodedCode === 'TEST7GUESTS';

  console.log("Cargando reserva:", decodedCode, "TestMode:", testMode);

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', decodedCode)
    .single();

  if (error || !reservation) {
    return (
      <div className="min-h-screen text-white font-sans relative pb-20">
        <Background />
        <div className="relative z-20 max-w-md mx-auto pt-16 px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-light tracking-wider mb-2">VILA DE FENALS</h1>
            <LanguageSelector currentLang={lang} />
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
              <p className="text-red-300 text-lg font-medium">{dict.not_found_title}</p>
              <p className="text-white/80 text-sm mt-2 opacity-80">{dict.not_found_desc}</p>
            </div>
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

  const totalGuests = reservation.total_guests;

  // Resolve platform name and custom check-in/check-out hours
  let platformName = reservation.platform || 'Airbnb';
  let checkInTime = '14:00';
  let checkOutTime = '12:00';
  if (reservation.platform && reservation.platform.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(reservation.platform);
      platformName = parsed.name || 'Airbnb';
      checkInTime = parsed.check_in_time || '14:00';
      checkOutTime = parsed.check_out_time || '12:00';
    } catch (e) {
      console.error("Error parsing platform JSON in guest page:", e);
    }
  }

  if (totalGuests === 0 || totalGuests === null) {
    return (
      <div className="min-h-screen text-white font-sans relative pb-20">
        <Background />
        <div className="relative z-20 max-w-md mx-auto pt-16 px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-light tracking-wider mb-2">VILA DE FENALS</h1>
            <LanguageSelector currentLang={lang} />
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg">
              <span className="text-cyan-400 text-3xl font-bold animate-pulse">⏰</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-cyan-300">
                {lang === 'en' ? 'Check-in Pending Activation' : 'Check-in Pendiente de Activación'}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                {lang === 'en'
                  ? 'Thank you for your reservation! The Vila de Fenals administration is currently assigning the slot capacity and finalizing details for your stay.'
                  : '¡Gracias por su reserva! La administración de Vila de Fenals está configurando los detalles y la asignación de plazas para su estancia.'}
              </p>
              <p className="text-xs text-white/60 leading-relaxed pt-2">
                {lang === 'en'
                  ? 'The traveler registration and tourist tax payment portal will activate automatically once ready. If you have any urgency, please contact us.'
                  : 'El portal de registro de viajeros y liquidación de tasa turística se activará automáticamente en breve. Si tiene alguna urgencia o duda, por favor póngase en contacto con nosotros.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  // Active check-in timeframe variables (using custom check-in/check-out hours)
  const now = new Date();
  
  const checkInHourInput = parseInt(checkInTime.split(':')[0], 10);
  const checkOutHourInput = parseInt(checkOutTime.split(':')[0], 10);

  const allowedCheckIn = new Date(reservation.check_in);
  allowedCheckIn.setHours(checkInHourInput - 2, 0, 0, 0); // 2 hours buffer before local check-in time

  const allowedCheckOut = new Date(reservation.check_out);
  allowedCheckOut.setHours(checkOutHourInput + 1, 0, 0, 0); // 1 hour buffer after local check-out time

  const isValidTime = now >= allowedCheckIn && now <= allowedCheckOut || testMode || decodedCode === 'TEST7GUESTS' || decodedCode === 'HMMR92E9DJ';

  // Display limits warnings (using local Spain time)
  const displayCheckIn = new Date(reservation.check_in);
  displayCheckIn.setHours(checkInHourInput, 0, 0, 0);

  const displayCheckOut = new Date(reservation.check_out);
  displayCheckOut.setHours(checkOutHourInput, 0, 0, 0);

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
    <div className="min-h-screen text-white font-sans relative pb-20">
      <Background />
      
      <div className="relative z-20 max-w-md mx-auto pt-8 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light tracking-wider mb-2">VILA DE FENALS</h1>
          <p className="text-cyan-300 text-xs tracking-[0.25em] uppercase font-bold mb-4">{dict.active_key}</p>
          <LanguageSelector currentLang={lang} />
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_16px_40px_rgba(6,182,212,0.25)] p-6 md:p-8 text-white space-y-6">
          <AccesoTabs 
            reservation={{
              ...reservation,
              platform: platformName // Pass parsed platform name
            }}
            travelers={travelers}
            lang={lang}
            paymentStatus={paymentStatus}
            testMode={testMode}
            isValidTime={isValidTime}
          />

          {/* Footer with platforms details */}
          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-white/50 uppercase font-bold tracking-wider">
            <span>Reserva: {platformName}</span>
            <span>Salida: {displayCheckOut.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })} a las {checkOutTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
