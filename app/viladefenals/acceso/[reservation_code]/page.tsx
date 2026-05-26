import { createClient } from '@supabase/supabase-js';
import { translations, Lang } from './i18n';
import AccesoTabs from './AccesoTabs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const pendingActivationTranslations: Record<string, { title: string; desc1: string; desc2: string }> = {
  es: {
    title: "Check-in Pendiente de Activación",
    desc1: "¡Gracias por su reserva! La administración de Vila de Fenals está configurando los detalles y la asignación de plazas para su estancia.",
    desc2: "El portal de registro de viajeros y liquidación de tasa turística se activará automáticamente en breve. Si tiene alguna urgencia o duda, por favor póngase en contacto con nosotros."
  },
  en: {
    title: "Check-in Pending Activation",
    desc1: "Thank you for your reservation! The Vila de Fenals administration is currently assigning the slot capacity and finalizing details for your stay.",
    desc2: "The traveler registration and tourist tax payment portal will activate automatically once ready. If you have any urgency, please contact us."
  },
  fr: {
    title: "Enregistrement en attente d'activation",
    desc1: "Merci pour votre réservation ! L'administration de Vila de Fenals configure actuellement les détails et l'attribution des places pour votre séjour.",
    desc2: "Le portail d'enregistrement des voyageurs et de paiement de la taxe de séjour s'activera automatiquement sous peu. Si vous avez des questions urgentes, veuillez nous contacter."
  },
  nl: {
    title: "Inchecken wacht op activering",
    desc1: "Bedankt voor uw reservering! Het beheer van Vila de Fenals is momenteel bezig met het toewijzen van de capaciteit en het afronden van de details voor uw verblijf.",
    desc2: "Het portaal voor de registratie van reizigers en de betaling van de toeristenbelasting wordt binnenkort automatisch geactiveerd. Neem bij spoed of vragen contact met ons op."
  },
  de: {
    title: "Check-in wartet auf Aktivierung",
    desc1: "Vielen Dank für Ihre Reservierung! Die Verwaltung von Vila de Fenals konfiguriert derzeit die Details und die Zuweisung der Plätze für Ihren Aufenthalt.",
    desc2: "Das Portal für die Registrierung von Reisenden und die Zahlung der Kurtaxe wird in Kürze automatisch aktiviert. Bei dringenden Fragen kontaktieren Sie uns bitte."
  },
  pl: {
    title: "Zameldowanie oczekuje na aktywację",
    desc1: "Dziękujemy za rezerwację! Administracja Vila de Fenals konfiguruje obecnie szczegóły i przypisuje miejsca na Twój pobyt.",
    desc2: "Portal rejestracji podróżnych i płatności taksy klimatycznej aktywuje się automatycznie wkrótce. W razie pilnych pytań prosimy o kontakt."
  },
  uk: {
    title: "Реєстрація очікує на активацію",
    desc1: "Дякуємо за ваше бронювання! Адміністрація Vila de Fenals наразі налаштовує деталі та розподіляє місця для вашого перебування.",
    desc2: "Портал для реєстрації мандрівників та оплати туристичного збору незабаром активується автоматично. Якщо у вас виникли термінові питання, будь ласка, зв'яжіться з нами."
  },
  ru: {
    title: "Регистрация ожидает активации",
    desc1: "Благодарим вас за бронирование! Администрация Vila de Fenals в настоящее время настраивает детали и распределяет места для вашего пребывания.",
    desc2: "Портал для регистрации путешественников и оплаты туристического сбора активируется автоматически в ближайшее время. Если у вас возникли срочные вопросы, пожалуйста, свяжитесь с нами."
  },
  zh: {
    title: "办理入住等待激活",
    desc1: "感谢您的预订！Vila de Fenals 管理处目前正在配置细节并为您分配入住人数。",
    desc2: "旅客登记和旅游税支付门户将在准备就绪后自动激活。如果您有任何紧急情况或疑问，请与我们联系。"
  },
  ja: {
    title: "チェックインの有効化待ち",
    desc1: "ご予約ありがとうございます！Vila de Fenals管理者は現在、ご滞在の詳細設定と定員の割り当てを行っております。",
    desc2: "旅行者登録および宿泊税お支払いポータルは、準備が整い次第自動的に有効化されます。ご不明な点や緊急の用件がございましたら、お問い合わせください。"
  }
};

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
  const testMode = resolvedSearchParams?.test_mode === 'true' || resolvedSearchParams?.micro_charge === 'true' || decodedCode === 'TESTPROD' || decodedCode === 'TEST7GUESTS' || decodedCode === 'TEST250526';

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
  let checkInTime = '16:00';
  let checkOutTime = '10:00';
  if (reservation.platform && reservation.platform.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(reservation.platform);
      platformName = parsed.name || 'Airbnb';
      checkInTime = parsed.check_in_time || '16:00';
      checkOutTime = parsed.check_out_time || '10:00';
    } catch (e) {
      console.error("Error parsing platform JSON in guest page:", e);
    }
  }

  if (totalGuests === 0 || totalGuests === null) {
    const tPending = pendingActivationTranslations[lang] || pendingActivationTranslations['es'];

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
                {tPending.title}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                {tPending.desc1}
              </p>
              <p className="text-xs text-white/60 leading-relaxed pt-2">
                {tPending.desc2}
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
              platform: platformName, // Pass parsed platform name
              checkInTime,
              checkOutTime
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
