'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Lock, Unlock, Key, Car, Map as MapIcon, Wifi, Copy, ExternalLink, 
  CheckCircle2, Users, CreditCard, ShieldAlert, AlertCircle, HelpCircle
} from 'lucide-react';
import OpenDoorButton from './OpenDoorButton';
import ShareButton from './ShareButton';
import TasaForm from './tasa/TasaForm';
import { translations, Lang } from './i18n';

interface AccesoTabsProps {
  reservation: any;
  travelers: any[];
  lang: Lang;
  paymentStatus?: string;
  testMode: boolean;
  isValidTime: boolean;
}

export default function AccesoTabs({ 
  reservation, 
  travelers, 
  lang, 
  paymentStatus, 
  testMode,
  isValidTime
}: AccesoTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSimulated = searchParams.get('simulated') === 'true';
  const dict = translations[lang] || translations['es'];
  const decodedCode = reservation.reservation_code;
  const isTaxPaidFromDB = reservation.is_tax_paid === true;
  const [localTaxPaid, setLocalTaxPaid] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`paycomet_success_${decodedCode}`) === 'true';
      if (stored) {
        setLocalTaxPaid(true);
      }
    }
  }, [decodedCode]);

  const isTaxPaid = isTaxPaidFromDB || localTaxPaid;

  const depositPaidFromDB = parseFloat(reservation.deposit_paid) || 0;
  const [localDepositPaid, setLocalDepositPaid] = useState(depositPaidFromDB);
  const [isSplitSelected, setIsSplitSelected] = useState(false);
  const [cardLimit, setCardLimit] = useState('500');
  const [generatingLinks, setGeneratingLinks] = useState<Record<number, boolean>>({});
  const [hasConfirmedDeposit, setHasConfirmedDeposit] = useState(false);

  useEffect(() => {
    setLocalDepositPaid(parseFloat(reservation.deposit_paid) || 0);
  }, [reservation.deposit_paid]);

  useEffect(() => {
    if (paymentStatus === 'deposit_success' && !hasConfirmedDeposit) {
      const amountStr = searchParams.get('deposit_amount') || '0';
      const parsedAmt = parseFloat(amountStr);
      console.log(`[AccesoTabs] Deposit payment success landed. Confirming deposit amount: ${parsedAmt}€`);

      setHasConfirmedDeposit(true);

      const endpointsToCall = [];
      endpointsToCall.push(
        fetch('/api/payment/confirm-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_code: decodedCode, amount: parsedAmt })
        })
      );

      Promise.all(endpointsToCall).then(async (responses) => {
        const res = responses[0];
        if (res.ok) {
          const data = await res.json();
          console.log("[AccesoTabs] Deposit confirm response:", data);
          if (data.success) {
            setLocalDepositPaid(data.deposit_paid);
          }
        }
        router.refresh();
      }).catch(err => {
        console.error("[AccesoTabs] Error calling confirm-deposit API:", err);
        router.refresh();
      });
    }
  }, [paymentStatus, hasConfirmedDeposit, decodedCode, searchParams, router]);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('acceso');
  
  // WiFi copy state
  const [wifiCopied, setWifiCopied] = useState(false);
  
  // Community rules modal state
  const [showRules, setShowRules] = useState(false);
  
  // Image zoom modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Dynamic counter of minors among unregistered guests to calculate tax in parallel
  const [unregisteredMinorsCount, setUnregisteredMinorsCount] = useState(0);

  // Dynamic share URL constructed from window.location.origin to match exact environments (local, staging, prod)
  const [shareUrl, setShareUrl] = useState(`https://viladefenals.activavivienda.es/viladefenals/acceso/${reservation.reservation_code}/registro?lang=${lang}${testMode ? '&micro_charge=true' : ''}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/viladefenals/acceso/${reservation.reservation_code}/registro?lang=${lang}${testMode ? '&micro_charge=true' : ''}`);
    }
  }, [reservation.reservation_code, lang, testMode]);

  useEffect(() => {
    if (paymentStatus === 'success') {
      console.log("[AccesoTabs] Successful payment landed. Storing persistent state and calling confirm API fallback...");
      
      // Store in localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(`paycomet_success_${decodedCode}`, 'true');
        setLocalTaxPaid(true);
      }

      // Invoke simulated webhook if requested, and also update general confirmation in DB
      const endpointsToCall = [];
      if (isSimulated && !isTaxPaidFromDB) {
        endpointsToCall.push(
          fetch('/api/paycomet/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_code: decodedCode, status: 'PAID' })
          })
        );
      } else if (!isTaxPaidFromDB) {
        endpointsToCall.push(
          fetch('/api/payment/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_code: decodedCode })
          })
        );
      }

      if (endpointsToCall.length > 0) {
        Promise.all(endpointsToCall).then(() => {
          console.log("[AccesoTabs] Backend payment fallbacks successfully updated.");
          router.refresh();
        }).catch(err => {
          console.error("[AccesoTabs] Error in fallback backend confirm calls:", err);
          router.refresh();
        });
      }
    }
  }, [paymentStatus, isSimulated, isTaxPaidFromDB, decodedCode, router]);

  const totalGuests = reservation.total_guests || 2;

  const formattedCheckInDate = (() => {
    try {
      const d = new Date(reservation.check_in);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return reservation.check_in;
    }
  })();

  const completedForms = travelers.length;
  const isPhase1Complete = completedForms >= totalGuests;
  const hasDeposit = reservation.has_deposit === true;
  const depositAmount = parseFloat(reservation.deposit_amount) || 0;
  const depositPaid = Math.max(parseFloat(reservation.deposit_paid) || 0, localDepositPaid);
  const isDepositComplete = !hasDeposit || (depositPaid >= depositAmount);
  const isFullyUnlocked = isPhase1Complete && isTaxPaid && isDepositComplete;

  // Calculate nights
  const checkIn = new Date(reservation.check_in);
  const checkOut = new Date(reservation.check_out);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const rawNights = nights;
  if (nights > 7) nights = 7;
  if (nights < 1) nights = 1;

  // 1. Calculate paying guests already registered (Age >= 16 on check-in date)
  let registeredPaying = 0;
  travelers.forEach((t) => {
    if (!t.fecha_nacimiento) {
      registeredPaying++;
      return;
    }
    const birthDate = new Date(t.fecha_nacimiento);
    let ageOnCheckIn = checkIn.getFullYear() - birthDate.getFullYear();
    const m = checkIn.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && checkIn.getDate() < birthDate.getDate())) {
      ageOnCheckIn--;
    }
    if (ageOnCheckIn >= 16) {
      registeredPaying++;
    }
  });

  // 2. Count unregistered remaining guests
  const unregisteredCount = Math.max(0, totalGuests - completedForms);

  // 3. Compute dynamic paying guests based on unregistered selection
  // Clamp selected minors count between 0 and unregisteredCount
  const safeMinorsCount = Math.min(Math.max(0, unregisteredMinorsCount), unregisteredCount);
  const unregisteredPayingCount = Math.max(0, unregisteredCount - safeMinorsCount);
  
  const payingGuests = registeredPaying + unregisteredPayingCount;
  
  const rate = 1.75;
  const calculatedTax = parseFloat((payingGuests * nights * rate).toFixed(2));

  // Build travelers checklist slots
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

  const handleCopyWifi = () => {
    navigator.clipboard.writeText('86075541');
    setWifiCopied(true);
    setTimeout(() => setWifiCopied(false), 2000);
  };

  const handlePayDeposit = async (amount: number, index: number) => {
    setGeneratingLinks(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/payment/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_code: decodedCode,
          payment_type: 'deposit',
          payment_amount: amount
        })
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error al generar el enlace de pago.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setGeneratingLinks(prev => ({ ...prev, [index]: false }));
    }
  };

  const ContactHostButton = () => {
    const whatsAppLink = `https://wa.me/34661690375?text=${encodeURIComponent(
      lang === 'en'
        ? `Hello! I have a question regarding my reservation ${decodedCode} at Vila de Fenals.`
        : `¡Hola! Tengo una consulta sobre mi reserva ${decodedCode} en Vila de Fenals.`
    )}`;

    return (
      <div className="pt-4 border-t border-white/5 mt-4">
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2.5 w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-md"
        >
          <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.805-9.805.002-2.618-1.013-5.082-2.86-6.93C16.376 1.933 13.91 1.917 12 1.917c-5.41 0-9.809 4.398-9.813 9.815-.002 1.62.476 3.206 1.383 4.622L2.508 21.5l5.244-1.378zM17.472 14.382c-.3-.149-1.778-.878-2.057-.98-.28-.1-.484-.148-.688.15-.2.299-.778.98-.953 1.18-.175.199-.349.224-.65.075-1.125-.562-1.993-1.002-2.774-2.335-.204-.349.204-.324.582-1.077.062-.124.031-.233-.016-.332-.047-.1-.484-1.171-.662-1.602-.175-.42-.35-.362-.484-.369-.125-.007-.268-.007-.41-.007s-.375.053-.57.269c-.2.215-.757.74-.757 1.804s.774 2.09 1.88 2.24c.11.015 2.155 3.292 5.22 4.615.73.315 1.3.503 1.74.643.73.23 1.4.198 1.92.12.58-.087 1.778-.727 2.027-1.43.25-.702.25-1.3.175-1.43-.075-.13-.275-.205-.575-.355z"/>
          </svg>
          <span>{lang === 'en' ? 'Contact Host' : 'Contactar con el Anfitrión'}</span>
        </a>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Payment Status Alerts */}
      {paymentStatus === 'success' && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-sm text-emerald-200 flex items-start gap-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.15)] animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            {isPhase1Complete ? (
              <>
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  {lang === 'en' ? 'Payment Received Successfully!' : '¡PAGO RECIBIDO CORRECTAMENTE!'}
                </span>
                <p className="leading-relaxed opacity-90">
                  {lang === 'en' 
                    ? 'We have processed your Tourist Tax payment securely. In a few moments, Phase 3 will synchronize with your Nuki access code.' 
                    : 'Hemos procesado su pago de la Tasa Turística de forma segura. En unos momentos se sincronizará la Fase 3 con su código de acceso de Nuki.'}
                </p>
              </>
            ) : (
              <>
                <span className="font-bold text-white uppercase tracking-wider text-xs text-emerald-300">
                  {lang === 'en' ? 'Tourist Tax Paid Successfully!' : '¡PAGO DE TASA REGISTRADO CON ÉXITO!'}
                </span>
                <p className="leading-relaxed opacity-90 text-emerald-100">
                  {lang === 'en'
                    ? 'We have processed your Tourist Tax payment securely. However, to unlock your virtual keys and access the apartment, you must still complete the mandatory registration form for all travelers (Phase 1).'
                    : 'Hemos registrado el pago de su Tasa Turística correctamente. Sin embargo, para desbloquear las llaves virtuales y acceder al apartamento, aún debe completar el registro obligatorio de todos los viajeros de la reserva (Fase 1).'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 text-sm text-red-200 flex items-start gap-2.5 shadow-[0_4px_20px_rgba(239,68,68,0.15)] animate-fade-in">
          <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white uppercase tracking-wider text-xs">Error en la Transacción</span>
            <p className="leading-relaxed opacity-90">
              La pasarela de pagos PayComet denegó el cobro o la operación fue cancelada. Por favor, vuelva a intentarlo.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation (Glassmorphic Tabs) */}
      <div className="flex justify-between bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('acceso')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'acceso' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Lock size={16} className={activeTab === 'acceso' ? 'text-white animate-pulse' : 'text-white/60'} /> 
          {dict.tab_access}
        </button>
        
        <button
          onClick={() => setActiveTab('llaves')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'llaves' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Key size={16} className={activeTab === 'llaves' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_zones}
        </button>

        <button
          onClick={() => setActiveTab('parking')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'parking' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Car size={16} className={activeTab === 'parking' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_parking}
        </button>

        <button
          onClick={() => setActiveTab('barrio')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'barrio' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapIcon size={16} className={activeTab === 'barrio' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_neighborhood}
        </button>
      </div>

      {/* ==========================================
          TAB 1: ACCESO (DYNAMIC LOCK/UNLOCK SCREEN)
          ========================================== */}
      {activeTab === 'acceso' && (
        <div className="space-y-4 animate-fade-in">
          {!isFullyUnlocked ? (
            /* locked check-in progression flow */
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 border border-red-500/35 flex items-center justify-center shadow-lg">
                  <Lock size={20} className="text-red-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white/95">{dict.keys_blocked_title || 'Apartment Keys Blocked'}</h4>
                  <p className="text-sm text-white/70 leading-relaxed max-w-xs mx-auto">
                    {dict.keys_blocked_desc || 'La normativa turística de Cataluña exige el registro normativo y la liquidación tributaria antes de habilitar el acceso.'}
                  </p>
                </div>
              </div>

              {/* Phase 1: travelers */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                    <Users size={14} className="text-cyan-400" />
                    <span>{dict.phase1_title || '1. Registro Normativo (Mossos)'}</span>
                  </h3>
                  <span className="text-xs font-bold text-white bg-cyan-400/20 px-2 py-0.5 rounded-full border border-cyan-400/30">
                    {completedForms} / {totalGuests} {dict.completed_text || 'Completados'}
                  </span>
                </div>

                <div className="space-y-2">
                  {guestSlots.map((slot, idx) => {
                    if (slot.registered) {
                      const travelerObj = travelers[idx];
                      return (
                        <div key={idx} className="flex justify-between items-center bg-green-500/10 border border-green-500/25 rounded-xl p-3 text-sm animate-fade-in">
                          <div>
                            <p className="font-semibold text-white">{slot.nombre} {slot.apellidos}</p>
                            <p className="text-[11px] text-green-300/80">
                              {slot.isMinor ? (dict.minor_registered || 'Menor Registrado (Vinculado)') : `${slot.tipo_documento}: ${slot.numero_documento}`}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-md">
                              ✓ {dict.ready_text || 'Listo'}
                            </span>
                            
                            {!isFullyUnlocked && travelerObj?.id && (
                              <Link
                                href={`/viladefenals/acceso/${decodedCode}/registro?lang=${lang}&edit_id=${travelerObj.id}${testMode ? '&micro_charge=true' : ''}`}
                                className="text-xs font-bold text-cyan-300 hover:text-cyan-100 bg-white/5 hover:bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md transition-all active:scale-95 shrink-0"
                              >
                                {dict.edit_action || 'Editar'}
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-3 text-sm">
                          <div>
                            <p className="font-semibold text-white/50">{dict.guest_text || 'Huésped'} {slot.slotIndex}</p>
                            <p className="text-[11px] text-white/30">{dict.pending_obligatory || 'Pendiente de registro obligatorio'}</p>
                          </div>
                          <Link
                            href={`/viladefenals/acceso/${decodedCode}/registro?lang=${lang}${testMode ? '&micro_charge=true' : ''}`}
                            className="text-xs font-bold text-cyan-300 hover:text-cyan-100 bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-1 rounded-md transition-all active:scale-95 shrink-0"
                          >
                            + {dict.register_action || 'Registrar'}
                          </Link>
                        </div>
                      );
                    }
                  })}
                </div>

                {!isPhase1Complete && (
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2 mt-2">
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      {dict.group_share_desc || '¿Viaja en grupo? Comparta este enlace de registro único para que cada viajero rellene su propia ficha desde su móvil:'}
                    </p>
                    <ShareButton 
                      shareUrl={shareUrl} 
                      preFilledText={dict.share_text || 'Hola, te envío el enlace para rellenar el formulario obligatorio de viajeros para nuestro alojamiento en Vila de Fenals:'} 
                      dict={dict} 
                    />
                  </div>
                )}

              </div>

              {/* Phase 2: Tourist Tax */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-cyan-400" />
                    <span>{dict.phase2_title || '2. Pago Tasa Turística'}</span>
                  </h3>
                  {isTaxPaid ? (
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                      ✓ {dict.paid_text || 'Pagado'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
                      {dict.pending_text || 'Pendiente'}
                    </span>
                  )}
                </div>

                {isTaxPaid ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-300 flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-green-400" />
                    <div>
                      <span className="font-bold">{dict.payment_verified || 'Pago verificado correctamente.'}</span>
                      <p className="text-[11px] text-white/60">{dict.payment_verified_desc || 'Tasa turística de la Generalitat liquidada por pasarela PayComet.'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Unregistered guests minors count question (if applicable) */}
                    {unregisteredCount > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                        <p className="text-xs text-white/80 font-semibold leading-tight flex items-center gap-1">
                          <HelpCircle size={12} className="text-cyan-400 shrink-0" />
                          <span>{dict.unregistered_minors_prompt || 'De los viajeros restantes, ¿cuántos son menores de 16 años (exentos de tasa)?'}</span>
                        </p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-white/40 leading-none">
                            {dict.payment_direct_exempt_hint || 'La ley de Cataluña exime del pago de la tasa a los menores de 16 años.'}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setUnregisteredMinorsCount(prev => Math.max(0, prev - 1))}
                              disabled={unregisteredMinorsCount <= 0}
                              className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-white font-bold flex items-center justify-center text-xs hover:bg-white/15 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-white px-1.5 min-w-[12px] text-center">
                              {unregisteredMinorsCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setUnregisteredMinorsCount(prev => Math.min(unregisteredCount, prev + 1))}
                              disabled={unregisteredMinorsCount >= unregisteredCount}
                              className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-white font-bold flex items-center justify-center text-xs hover:bg-white/15 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm bg-white/5 border border-white/5 rounded-xl p-3">
                      <div>
                        <p className="text-white/80 font-medium">
                          {dict.stay_text || 'Estancia'}: {nights} {nights === 1 ? (dict.noche_text || 'noche') : (dict.noches_text || 'noches')} ({dict.capped_text || 'Máx. 7 noches'})
                        </p>
                        <p className="text-[11px] text-white/50">
                          {payingGuests} {dict.de_text || 'de'} {totalGuests} {dict.subjects_tax_text || 'huéspedes sujetos a tasa (≥16 años)'}
                        </p>
                      </div>
                      <p className="text-lg font-light text-cyan-300 font-mono">{(testMode ? 0.10 : calculatedTax).toFixed(2)}€</p>
                    </div>

                    <TasaForm 
                      reservationCode={decodedCode}
                      payingGuests={payingGuests}
                      nights={nights}
                      totalAmount={calculatedTax}
                      unregisteredPayingGuests={unregisteredPayingCount}
                    />
                  </div>
                )}
              </div>

              {/* Phase 3: Fianza / Depósito de Seguridad */}
              {hasDeposit && depositAmount > 0 && (
                <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                      <Key size={14} className="text-cyan-400" />
                      <span>{lang === 'en' ? '3. Security Deposit' : '3. Fianza de Seguridad'}</span>
                    </h3>
                    {isDepositComplete ? (
                      <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                        ✓ {dict.paid_text || 'Pagado'}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
                        {depositPaid > 0 
                          ? `${lang === 'en' ? 'Partial' : 'Parcial'} (${depositPaid}/${depositAmount}€)`
                          : (dict.pending_text || 'Pendiente')}
                      </span>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white/70 leading-relaxed">
                    {lang === 'en'
                      ? 'For security reasons, a temporary deposit is required. It will be refunded manually after checking the apartment\'s condition at the end of your stay.'
                      : 'Por motivos de seguridad, se requiere un depósito temporal que será devuelto manualmente tras comprobar el estado del apartamento al final de la estancia.'}
                  </div>

                  {isDepositComplete ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-300 flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-green-400" />
                      <div>
                        <span className="font-bold">{lang === 'en' ? 'Deposit paid successfully.' : 'Fianza depositada correctamente.'}</span>
                        <p className="text-[11px] text-white/60">
                          {lang === 'en' ? 'Total amount secured.' : 'Importe total garantizado de forma segura.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {/* Split limit checkbox option */}
                      <div className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-xl p-3">
                        <input
                          id="split_deposit_checkbox"
                          type="checkbox"
                          checked={isSplitSelected}
                          onChange={(e) => setIsSplitSelected(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:outline-none cursor-pointer mt-0.5"
                        />
                        <div className="space-y-1 animate-fade-in">
                          <label htmlFor="split_deposit_checkbox" className="text-xs text-white/90 font-medium cursor-pointer block leading-none">
                            {lang === 'en'
                              ? 'Does your card have a single payment limit lower than this amount?'
                              : '¿Tu tarjeta tiene un límite por pago inferior a este importe?'}
                          </label>
                          <span className="text-[10px] text-white/40 block leading-tight mt-1">
                            {lang === 'en'
                              ? 'If checked, you can enter your card transaction limit and we will split the total fianza into multiple smaller payment links.'
                              : 'Si lo marcas, podrás definir el límite por transacción y dividiremos el pago total en varios enlaces de menor importe.'}
                          </span>
                        </div>
                      </div>

                      {isSplitSelected && (
                        <div className="space-y-2 bg-black/10 border border-white/10 rounded-xl p-3 animate-fade-in">
                          <label htmlFor="card_limit_input" className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                            {lang === 'en' ? 'Single Payment Limit (€)' : 'Límite de pago por tarjeta (€)'}
                          </label>
                          <div className="relative">
                            <input
                              id="card_limit_input"
                              type="number"
                              step="0.01"
                              min="0.10"
                              value={cardLimit}
                              onChange={(e) => setCardLimit(e.target.value)}
                              className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 pl-4 pr-10 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/40">
                              EUR
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display the buttons */}
                      {(() => {
                        const limitVal = parseFloat(cardLimit);
                        if (isSplitSelected && limitVal > 0) {
                          // Split logic
                          const totalSplits: number[] = [];
                          let tempTotal = depositAmount;
                          while (tempTotal > 0) {
                            if (tempTotal <= limitVal) {
                              totalSplits.push(parseFloat(tempTotal.toFixed(2)));
                              tempTotal = 0;
                            } else {
                              totalSplits.push(parseFloat(limitVal.toFixed(2)));
                              tempTotal = parseFloat((tempTotal - limitVal).toFixed(2));
                            }
                          }

                          let accumulatedPaid = depositPaid;
                          const splitStatuses = totalSplits.map((splitAmt) => {
                            if (accumulatedPaid >= splitAmt) {
                              accumulatedPaid = parseFloat((accumulatedPaid - splitAmt).toFixed(2));
                              return { amount: splitAmt, status: 'paid' };
                            } else if (accumulatedPaid > 0) {
                              const paidPartial = accumulatedPaid;
                              accumulatedPaid = 0;
                              return { amount: splitAmt, paidPartial, status: 'partial' };
                            } else {
                              return { amount: splitAmt, status: 'pending' };
                            }
                          });

                          return (
                            <div className="space-y-2">
                              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold block mb-1">
                                {lang === 'en' ? 'Payment Parts Required:' : 'Tramos de pago requeridos:'}
                              </p>
                              {splitStatuses.map((split, sIdx) => {
                                if (split.status === 'paid') {
                                  return (
                                    <div key={sIdx} className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs">
                                      <span className="font-semibold text-white/80">
                                        {lang === 'en' ? 'Part' : 'Tramo'} {sIdx + 1} ({split.amount.toFixed(2)}€)
                                      </span>
                                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider bg-green-500/25 px-2 py-0.5 rounded-md border border-green-500/30">
                                        ✓ {lang === 'en' ? 'Paid' : 'Pagado'}
                                      </span>
                                    </div>
                                  );
                                } else if (split.status === 'partial') {
                                  const partialPaid = split.paidPartial || 0;
                                  const pendingAmt = parseFloat((split.amount - partialPaid).toFixed(2));
                                  return (
                                    <div key={sIdx} className="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs">
                                      <div className="space-y-0.5">
                                        <span className="font-semibold text-white/80 block">
                                          {lang === 'en' ? 'Part' : 'Tramo'} {sIdx + 1} ({split.amount.toFixed(2)}€)
                                        </span>
                                        <span className="text-[10px] text-yellow-300/70 block">
                                          {lang === 'en' ? 'Paid:' : 'Pagado:'} {partialPaid.toFixed(2)}€ | {lang === 'en' ? 'Pending:' : 'Pendiente:'} {pendingAmt.toFixed(2)}€
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handlePayDeposit(pendingAmt, sIdx)}
                                        disabled={generatingLinks[sIdx]}
                                        className="text-[11px] font-bold text-white bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 rounded-lg py-1.5 px-3 uppercase tracking-wider flex items-center gap-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
                                      >
                                        {generatingLinks[sIdx] ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <span>{lang === 'en' ? `Pay Remaining (${pendingAmt.toFixed(2)}€)` : `Pagar Resto (${pendingAmt.toFixed(2)}€)`}</span>
                                        )}
                                      </button>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={sIdx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3 text-xs">
                                      <span className="font-semibold text-white/80">
                                        {lang === 'en' ? 'Part' : 'Tramo'} {sIdx + 1} ({split.amount.toFixed(2)}€)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handlePayDeposit(split.amount, sIdx)}
                                        disabled={generatingLinks[sIdx]}
                                        className="text-[11px] font-bold text-white bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 rounded-lg py-1.5 px-3 uppercase tracking-wider flex items-center gap-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
                                      >
                                        {generatingLinks[sIdx] ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <span>{lang === 'en' ? `Pay (${split.amount.toFixed(2)}€)` : `Pagar (${split.amount.toFixed(2)}€)`}</span>
                                        )}
                                      </button>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          );
                        } else {
                          // Single complete payment link
                          const remainingDeposit = parseFloat((depositAmount - depositPaid).toFixed(2));
                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3 text-xs">
                                <span className="text-white/60">
                                  {lang === 'en' ? 'Total Remaining:' : 'Total Restante de Fianza:'}
                                </span>
                                <span className="font-bold text-cyan-300 font-mono text-sm">
                                  {remainingDeposit.toFixed(2)}€
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handlePayDeposit(remainingDeposit, 999)}
                                disabled={generatingLinks[999]}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/15"
                              >
                                {generatingLinks[999] ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{lang === 'en' ? 'Generating Payment Link...' : 'Generando Enlace de Pago...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard size={16} />
                                    <span>{lang === 'en' ? `Pay Security Deposit (${remainingDeposit.toFixed(2)}€)` : `Pagar Fianza Completa (${remainingDeposit.toFixed(2)}€)`}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isValidTime ? (
            /* unlocked portal controls */
            <div className="space-y-4">
              {/* Virtual Key Header */}
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-cyan-400/20 rounded-3xl p-6 text-center space-y-4 shadow-[0_4px_30px_rgba(6,182,212,0.1)]">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg">
                  <Unlock size={22} className="text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">{dict.portal_title}</h3>
                  <p className="text-sm text-white/70">{dict.portal_desc}</p>
                </div>
                
                {/* Physical opening button */}
                <div className="flex flex-col items-center justify-center">
                  <OpenDoorButton reservationCode={decodedCode} dict={dict} />
                </div>
              </div>

              {/* Nuki Keypad Code Reveal Card */}
              {reservation.nuki_pin && (
                <div className="bg-black/20 border border-white/10 rounded-2xl p-5 text-center space-y-3">
                  <h3 className="font-semibold text-base flex items-center justify-center gap-2">
                    <Key size={18} className="text-cyan-400" /> {dict.code_title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
                    {dict.code_desc}
                  </p>
                  
                  <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl py-3 px-6 font-mono text-cyan-100 flex items-center justify-center gap-3 select-all cursor-pointer hover:bg-black/45 transition-all shadow-inner w-full max-w-[280px] mx-auto">
                    <span className="font-bold text-white text-3xl tracking-[0.15em] ml-2">{reservation.nuki_pin}</span>
                  </div>
                </div>
              )}

              {/* WiFi Details Card */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Wifi size={18} className="text-emerald-400" /> {dict.wifi_title}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_network}</span>
                    <span className="font-semibold text-sm text-white">FitelFibra_2G_4168</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_password}</span>
                    <button 
                      onClick={handleCopyWifi}
                      className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm hover:text-emerald-300 transition-colors"
                    >
                      {wifiCopied ? (
                        <>
                          <CheckCircle2 size={14} /> 
                          <span>{dict.wifi_copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 
                          <span>86075541</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* unlocked but too early - virtual keys inactive notice */
            <div className="space-y-4 animate-fade-in">
              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-3xl p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/35 flex items-center justify-center shadow-lg">
                  <Lock size={20} className="text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-1.5 text-white">
                  <h3 className="text-base font-semibold text-cyan-300">{lang === 'en' ? 'Check-in Completed Successfully!' : '¡Check-in Completado con Éxito!'}</h3>
                  <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                    {lang === 'en'
                      ? `Your check-in has been completed correctly. However, your virtual keys and access codes will be automatically activated starting from the scheduled check-in time on your day of arrival ${formattedCheckInDate}.`
                      : `Su check-in se ha completado correctamente. Sin embargo, sus llaves virtuales y códigos de acceso se activarán automáticamente a partir de la hora prevista para su check in del día de llegada ${formattedCheckInDate}.`}
                  </p>
                </div>
                
                <div className="text-left bg-black/25 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5">
                  <p className="flex justify-between items-center">
                    <span className="text-white/50">{lang === 'en' ? 'Check-in:' : 'Entrada:'}</span>
                    <span className="font-bold text-cyan-200">{new Date(reservation.check_in).toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span className="text-white/50">{lang === 'en' ? 'Check-out:' : 'Salida:'}</span>
                    <span className="font-bold text-cyan-200">{new Date(reservation.check_out).toLocaleString(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </p>
                </div>
              </div>

              {/* WiFi Details Card */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Wifi size={18} className="text-emerald-400" /> {dict.wifi_title}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_network}</span>
                    <span className="font-semibold text-sm text-white">FitelFibra_2G_4168</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_password}</span>
                    <button 
                      onClick={handleCopyWifi}
                      className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm hover:text-emerald-300 transition-colors"
                    >
                      {wifiCopied ? (
                        <>
                          <CheckCircle2 size={14} /> 
                          <span>{dict.wifi_copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 
                          <span>86075541</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <ContactHostButton />
        </div>
      )}

      {/* ==========================================
          TAB 2: ZONAS (POOL & DIRECT KEYS INFOS)
          ========================================== */}
      {activeTab === 'llaves' && (
        <div className="space-y-4 animate-fade-in">
          {/* Pool Card */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-lg text-cyan-200 border-b border-white/10 pb-1.5">{dict.pool_title}</h3>
            
            <div className="flex items-start gap-4">
              <p className="text-white/80 text-sm leading-relaxed flex-1">{dict.pool_desc}</p>
              <img 
                src="/images/recursos/llave-piscina.jpeg" 
                alt="Llave Piscina" 
                className="w-20 h-20 object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shrink-0"
                onClick={() => setSelectedImage('/images/recursos/llave-piscina.jpeg')}
              />
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/l9vpUNr4fXA?rel=0"  
                title="Pool Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>

          {/* Back Door Card */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-lg text-cyan-200 border-b border-white/10 pb-1.5">{dict.back_door_title}</h3>
            
            <div className="flex items-start gap-4">
              <p className="text-white/80 text-sm leading-relaxed flex-1">{dict.back_door_desc}</p>
              <img 
                src="/images/recursos/llave-trasera.jpeg" 
                alt="Llave Trasera" 
                className="w-20 h-20 object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shrink-0"
                onClick={() => setSelectedImage('/images/recursos/llave-trasera.jpeg')}
              />
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/B508vUH8AbQ?rel=0" 
                title="Back Door Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>

          {/* Community Rules Button */}
          <div className="text-center py-4">
            <button 
              onClick={() => setShowRules(true)}
              className="font-bold text-base text-cyan-300 hover:text-cyan-100 underline underline-offset-4 transition-colors"
            >
              {dict.rules_link}
            </button>
          </div>
          <ContactHostButton />
        </div>
      )}

      {/* ==========================================
          TAB 3: PARKING (GARAGE SPOTS & CIRCUITS)
          ========================================== */}
      {activeTab === 'parking' && (
        <div className="space-y-4 animate-fade-in">
          {/* Plaza Info Header */}
          <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-cyan-400/20 rounded-3xl p-5 space-y-3.5">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="font-bold text-lg text-cyan-200 flex items-center gap-2">
                <Car className="text-cyan-400" /> {dict.parking_plaza}
              </h3>
              <a 
                href="https://maps.app.goo.gl/2hpbBNMGsopa93T57?g_st=aw" 
                target="_blank" 
                rel="noreferrer"
                className="bg-cyan-500 hover:bg-cyan-400 text-cyan-950 px-3.5 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                {dict.parking_nav} <ExternalLink size={12} />
              </a>
            </div>
            
            <p className="text-sm text-white/80 leading-relaxed">
              {dict.parking_warning}
            </p>
          </div>

          {/* Parking attachments zoom card */}
          <div className="flex gap-4">
            <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
              <p className="text-xs text-white/50 uppercase font-bold tracking-wider">Acceso (Mando)</p>
              <img 
                src="/images/recursos/parking-tag.jpeg" 
                alt="Mando Garaje" 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
                onClick={() => setSelectedImage('/images/recursos/parking-tag.jpeg')}
              />
            </div>
            
            <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
              <p className="text-xs text-white/50 uppercase font-bold tracking-wider">Candado Barrera (0539)</p>
              <img 
                src="/images/recursos/parking-candado.jpeg" 
                alt="Candado Barrera" 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
                onClick={() => setSelectedImage('/images/recursos/parking-candado.jpeg')}
              />
            </div>
          </div>

          {/* Videos Grid */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-cyan-200 border-b border-white/10 pb-1.5">{dict.parking_to_apt_title}</h3>
            <p className="text-white/80 text-sm leading-relaxed">{dict.parking_to_apt_desc}</p>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/bQ3bXpZAA-w?rel=0" 
                title="Elevator Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>

          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-cyan-200 border-b border-white/10 pb-1.5">{dict.parking_car_access_title}</h3>
            <p className="text-white/80 text-sm leading-relaxed">{dict.parking_car_access_desc}</p>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/52aGzhG-6qw?rel=0" 
                title="Car Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>
          <ContactHostButton />
        </div>
      )}

      {/* ==========================================
          TAB 4: BARRIO (NEIGHBORHOOD GPS MAPS)
          ========================================== */}
      {activeTab === 'barrio' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-lg text-cyan-200 border-b border-white/10 pb-1.5">{dict.neighborhood_services}</h3>
            
            {/* Embedded Google Maps Card */}
            <div className="w-full rounded-xl border border-white/10 overflow-hidden relative shadow-lg">
              <div className="aspect-[4/3] w-full relative bg-gray-800 overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/d/embed?mid=1RPK1nvAHLbKV5hhrm6RSG3sRt-7xJOI" 
                  width="100%" 
                  className="absolute left-0 border-0"
                  style={{ top: '-56px', height: 'calc(100% + 56px)' }}
                  title="Neighborhood Services Map"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

            {/* Categorized Neighborhood Links */}
            <div className="space-y-4">
              {/* Basics and health */}
              <div>
                <h4 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-2">🛒 {dict.neighborhood_health}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Supermercado+Consum+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Supermercado Consum</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Farmacia Fenals</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Blanca+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Farmacia Blanca</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/place/Lavander%C3%ADa+24h+(go+laundry)/@41.7136585,2.8309247,19.25z/data=!4m6!3m5!1s0x12bb17812675b779:0x60f19ce56eac64d4!8m2!3d41.7136398!4d2.8307474!16s%2Fg%2F11h_4s81hw?entry=ttu" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">{dict.laundry}</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>

              {/* Eat */}
              <div>
                <h4 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-2">🥘 {dict.neighborhood_eat}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=L%27Arrosseria+de+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">L'Arrosseria de Fenals</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Planiol+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Restaurante Planiol</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=El+Jardi+Parrilla+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">El Jardí Parrilla</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Hay+Motivo+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Restaurante Hay Motivo</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Corsaro+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Pizzería Corsaro</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=heladeria+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">{dict.ice_cream}</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>

              {/* See */}
              <div>
                <h4 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-2">📸 {dict.neighborhood_see}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Jardines+de+Santa+Clotilde+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Jardines de Santa Clotilde</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Cala+Boadella+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Cala Boadella</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Castell+de+Sant+Joan+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Castell de Sant Joan</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Water+World+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Parque Acuático Water World</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL A: IMAGE ENLARGEMENT ZOOM
          ========================================== */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-200">
            <button 
              className="absolute -top-10 right-0 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full border border-white/10 shadow-md backdrop-blur-md"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              Cerrar ✕
            </button>
            <img 
              src={selectedImage} 
              alt="Detalle" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/15"
            />
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL B: COMMUNITY RULES MULTI-LANG MODAL
          ========================================== */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-white/15 rounded-3xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl shadow-cyan-500/10">
            <h3 className="text-lg font-bold mb-4 text-cyan-200 border-b border-white/10 pb-2">{dict.rules_title}</h3>
            
            <div className="overflow-y-auto pr-2 space-y-3 flex-1 text-xs text-white/80 leading-relaxed scrollbar-thin">
              {dict.rules_texts && dict.rules_texts.map((rule: string, idx: number) => (
                <p key={idx} className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{rule}</span>
                </p>
              ))}
            </div>
            
            <button 
              onClick={() => setShowRules(false)}
              className="mt-6 w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-98"
            >
              {dict.rules_close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
