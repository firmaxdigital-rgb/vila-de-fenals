import { createClient } from '@supabase/supabase-js';
import OpenDoorButton from './OpenDoorButton';
import { translations, Lang } from './i18n';
import Link from 'next/link';

// Si RLS restringe la lectura pública, usa SUPABASE_SERVICE_ROLE_KEY.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Componente para manejar la imagen de fondo con un tono estival
function Background() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10">
      {/* Fallback de color oceánico */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-300 to-cyan-600" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/Imágenes del Apartamento/fuente_terraza.jpg" 
        alt="Fondo Vila de Fenals" 
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
      />
    </div>
  );
}

function LanguageSelector({ currentLang }: { currentLang: string }) {
  const langs = ['es', 'en', 'fr', 'de', 'pl', 'zh', 'uk', 'ru'];
  return (
    <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex flex-wrap justify-end gap-2 bg-white/20 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/30 shadow-lg max-w-[200px] md:max-w-none">
      {langs.map((l) => (
        <Link 
          key={l} 
          href={`?lang=${l}`}
          className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${currentLang === l ? 'text-white drop-shadow-md' : 'text-white/60 hover:text-white/90'}`}
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
  searchParams: Promise<{ lang?: string }>;
}) {
  const resolvedParams = await params;
  const decodedCode = decodeURIComponent(resolvedParams.reservation_code);

  const resolvedSearchParams = await searchParams;
  const langQuery = resolvedSearchParams?.lang as string;
  const lang: Lang = (['es', 'en', 'fr', 'de', 'pl', 'zh', 'uk', 'ru'].includes(langQuery) ? langQuery : 'es') as Lang;
  const dict = translations[lang];

  console.log("Buscando reserva con el código:", decodedCode);

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', decodedCode)
    .single();

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4 relative">
        <Background />
        <LanguageSelector currentLang={lang} />
        <div className="relative z-10 w-full max-w-md bg-white/20 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-[0_8px_32px_0_rgba(6,182,212,0.2)] p-8 text-center mt-12 md:mt-0">
          <h1 className="text-4xl font-light tracking-wide text-white mb-6 drop-shadow-lg">Vila de Fenals</h1>
          <div className="bg-red-500/20 border border-red-400/50 rounded-2xl p-6">
            <p className="text-red-100 text-xl font-medium">{dict.not_found_title}</p>
            <p className="text-red-50 text-sm mt-2 opacity-80">{dict.not_found_desc}</p>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const checkInDate = new Date(reservation.check_in);
  checkInDate.setHours(15, 0, 0, 0);

  const checkOutDate = new Date(reservation.check_out);
  checkOutDate.setHours(11, 0, 0, 0);

  const isValidTime = now >= checkInDate && now <= checkOutDate;

  if (!isValidTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4 relative">
        <Background />
        <LanguageSelector currentLang={lang} />
        <div className="relative z-10 w-full max-w-md bg-white/20 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-[0_8px_32px_0_rgba(6,182,212,0.2)] p-8 text-center mt-12 md:mt-0">
          <h1 className="text-4xl font-light tracking-wide text-white mb-6 drop-shadow-lg">Vila de Fenals</h1>
          <div className="bg-cyan-500/20 border border-cyan-400/50 rounded-2xl p-6">
            <p className="text-cyan-100 text-lg font-medium mb-3">{dict.inactive_title}</p>
            <div className="text-cyan-50/80 text-sm space-y-2">
              <p>Check-in: {checkInDate.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p>Check-out: {checkOutDate.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-900/40 to-cyan-900/50 p-4 relative">
      <Background />
      <LanguageSelector currentLang={lang} />
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl shadow-[0_16px_40px_0_rgba(6,182,212,0.25)] p-8 text-center flex flex-col items-center mt-12 md:mt-0">
        <h1 className="text-4xl font-light tracking-wide text-white mb-2 drop-shadow-md">Vila de Fenals</h1>
        <p className="text-cyan-100/90 mb-10 text-sm tracking-widest uppercase font-medium">{dict.active_key}</p>
        
        <OpenDoorButton reservationCode={decodedCode} dict={dict} />

        <div className="mt-12 pt-6 border-t border-white/20 w-full flex justify-between items-center text-xs text-white/70 font-medium tracking-wide">
          <span className="uppercase">{reservation.platform}</span>
          <span>{dict.valid_until} {checkOutDate.toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
