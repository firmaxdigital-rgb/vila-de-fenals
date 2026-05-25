'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
}

export default function AccesoTabs({ 
  reservation, 
  travelers, 
  lang, 
  paymentStatus, 
  testMode 
}: AccesoTabsProps) {
  const router = useRouter();
  const dict = translations[lang] || translations['es'];
  
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

  const decodedCode = reservation.reservation_code;
  const totalGuests = reservation.total_guests || 2;
  const completedForms = travelers.length;
  const isPhase1Complete = completedForms >= totalGuests;
  const isTaxPaid = reservation.is_tax_paid === true;
  const isFullyUnlocked = isPhase1Complete && isTaxPaid;

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

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Payment Status Alerts */}
      {paymentStatus === 'success' && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-xs text-emerald-200 flex items-start gap-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.15)] animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            {isPhase1Complete ? (
              <>
                <span className="font-bold text-white uppercase tracking-wider text-[10px]">
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
                <span className="font-bold text-white uppercase tracking-wider text-[10px] text-emerald-300">
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
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 text-xs text-red-200 flex items-start gap-2.5 shadow-[0_4px_20px_rgba(239,68,68,0.15)] animate-fade-in">
          <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">Error en la Transacción</span>
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
          className={`flex-1 py-3 px-1 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'acceso' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Lock size={16} className={activeTab === 'acceso' ? 'text-white animate-pulse' : 'text-white/60'} /> 
          {dict.tab_access}
        </button>
        
        <button
          onClick={() => setActiveTab('llaves')}
          className={`flex-1 py-3 px-1 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'llaves' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Key size={16} className={activeTab === 'llaves' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_zones}
        </button>

        <button
          onClick={() => setActiveTab('parking')}
          className={`flex-1 py-3 px-1 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'parking' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Car size={16} className={activeTab === 'parking' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_parking}
        </button>

        <button
          onClick={() => setActiveTab('barrio')}
          className={`flex-1 py-3 px-1 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
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
                  <h4 className="text-sm font-semibold text-white/95">{dict.keys_blocked_title || 'Apartment Keys Blocked'}</h4>
                  <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                    {dict.keys_blocked_desc || 'La normativa turística de Cataluña exige el registro normativo y la liquidación tributaria antes de habilitar el acceso.'}
                  </p>
                </div>
              </div>

              {/* Phase 1: travelers */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                    <Users size={14} className="text-cyan-400" />
                    <span>{dict.phase1_title || '1. Registro Normativo (Mossos)'}</span>
                  </h3>
                  <span className="text-[10px] font-bold text-white bg-cyan-400/20 px-2 py-0.5 rounded-full border border-cyan-400/30">
                    {completedForms} / {totalGuests} {dict.completed_text || 'Completados'}
                  </span>
                </div>

                <div className="space-y-2">
                  {guestSlots.map((slot, idx) => {
                    if (slot.registered) {
                      const travelerObj = travelers[idx];
                      return (
                        <div key={idx} className="flex justify-between items-center bg-green-500/10 border border-green-500/25 rounded-xl p-3 text-xs animate-fade-in">
                          <div>
                            <p className="font-semibold text-white">{slot.nombre} {slot.apellidos}</p>
                            <p className="text-[9px] text-green-300/80">
                              {slot.isMinor ? (dict.minor_registered || 'Menor Registrado (Vinculado)') : `${slot.tipo_documento}: ${slot.numero_documento}`}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-md">
                              ✓ {dict.ready_text || 'Listo'}
                            </span>
                            
                            {!isFullyUnlocked && travelerObj?.id && (
                              <Link
                                href={`/viladefenals/acceso/${decodedCode}/registro?lang=${lang}&edit_id=${travelerObj.id}${testMode ? '&micro_charge=true' : ''}`}
                                className="text-[10px] font-bold text-cyan-300 hover:text-cyan-100 bg-white/5 hover:bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md transition-all active:scale-95 shrink-0"
                              >
                                {dict.edit_action || 'Editar'}
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
                          <div>
                            <p className="font-semibold text-white/50">{dict.guest_text || 'Huésped'} {slot.slotIndex}</p>
                            <p className="text-[9px] text-white/30">{dict.pending_obligatory || 'Pendiente de registro obligatorio'}</p>
                          </div>
                          <Link
                            href={`/viladefenals/acceso/${decodedCode}/registro?lang=${lang}${testMode ? '&micro_charge=true' : ''}`}
                            className="text-[10px] font-bold text-cyan-300 hover:text-cyan-100 bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-1 rounded-md transition-all active:scale-95 shrink-0"
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
                    <p className="text-[9px] text-white/50 leading-relaxed">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-cyan-400" />
                    <span>{dict.phase2_title || '2. Pago Tasa Turística'}</span>
                  </h3>
                  {isTaxPaid ? (
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                      ✓ {dict.paid_text || 'Pagado'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
                      {dict.pending_text || 'Pendiente'}
                    </span>
                  )}
                </div>

                {isTaxPaid ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs text-green-300 flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-green-400" />
                    <div>
                      <span className="font-bold">{dict.payment_verified || 'Pago verificado correctamente.'}</span>
                      <p className="text-[9px] text-white/60">{dict.payment_verified_desc || 'Tasa turística de la Generalitat liquidada por pasarela PayComet.'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Unregistered guests minors count question (if applicable) */}
                    {unregisteredCount > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] text-white/80 font-semibold leading-tight flex items-center gap-1">
                          <HelpCircle size={12} className="text-cyan-400 shrink-0" />
                          <span>{dict.unregistered_minors_prompt || 'De los viajeros restantes, ¿cuántos son menores de 16 años (exentos de tasa)?'}</span>
                        </p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] text-white/40 leading-none">
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

                    <div className="flex justify-between items-center text-xs bg-white/5 border border-white/5 rounded-xl p-3">
                      <div>
                        <p className="text-white/80 font-medium">
                          {dict.stay_text || 'Estancia'}: {nights} {nights === 1 ? (dict.noche_text || 'noche') : (dict.noches_text || 'noches')} ({dict.capped_text || 'Máx. 7 noches'})
                        </p>
                        <p className="text-[9px] text-white/50">
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
            </div>
          ) : (
            /* unlocked portal controls */
            <div className="space-y-4">
              {/* Virtual Key Header */}
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-cyan-400/20 rounded-3xl p-6 text-center space-y-4 shadow-[0_4px_30px_rgba(6,182,212,0.1)]">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg">
                  <Unlock size={22} className="text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">{dict.portal_title}</h3>
                  <p className="text-xs text-white/70">{dict.portal_desc}</p>
                </div>
                
                {/* Physical opening button */}
                <div className="flex flex-col items-center justify-center">
                  <OpenDoorButton reservationCode={decodedCode} dict={dict} />
                </div>
              </div>

              {/* Nuki Keypad Code Reveal Card */}
              {reservation.nuki_pin && (
                <div className="bg-black/20 border border-white/10 rounded-2xl p-5 text-center space-y-3">
                  <h3 className="font-semibold text-sm flex items-center justify-center gap-2">
                    <Key size={18} className="text-cyan-400" /> {dict.code_title}
                  </h3>
                  <p className="text-white/70 text-xs leading-relaxed max-w-xs mx-auto">
                    {dict.code_desc}
                  </p>
                  
                  <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl py-3 px-6 font-mono text-cyan-100 flex items-center justify-center gap-3 select-all cursor-pointer hover:bg-black/45 transition-all shadow-inner w-full max-w-[280px] mx-auto">
                    <span className="font-bold text-white text-3xl tracking-[0.15em] ml-2">{reservation.nuki_pin}</span>
                  </div>
                </div>
              )}

              {/* WiFi Details Card */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Wifi size={18} className="text-emerald-400" /> {dict.wifi_title}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-xs">{dict.wifi_network}</span>
                    <span className="font-semibold text-xs text-white">FitelFibra_2G_4168</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-xs">{dict.wifi_password}</span>
                    <button 
                      onClick={handleCopyWifi}
                      className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs hover:text-emerald-300 transition-colors"
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
        </div>
      )}

      {/* ==========================================
          TAB 2: ZONAS (POOL & DIRECT KEYS INFOS)
          ========================================== */}
      {activeTab === 'llaves' && (
        <div className="space-y-4 animate-fade-in">
          {/* Pool Card */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-cyan-200 border-b border-white/10 pb-1.5">{dict.pool_title}</h3>
            
            <div className="flex items-start gap-4">
              <p className="text-white/80 text-xs leading-relaxed flex-1">{dict.pool_desc}</p>
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
            <h3 className="font-semibold text-base text-cyan-200 border-b border-white/10 pb-1.5">{dict.back_door_title}</h3>
            
            <div className="flex items-start gap-4">
              <p className="text-white/80 text-xs leading-relaxed flex-1">{dict.back_door_desc}</p>
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
              className="font-bold text-sm text-cyan-300 hover:text-cyan-100 underline underline-offset-4 transition-colors"
            >
              {dict.rules_link}
            </button>
          </div>
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
              <h3 className="font-bold text-base text-cyan-200 flex items-center gap-2">
                <Car className="text-cyan-400" /> {dict.parking_plaza}
              </h3>
              <a 
                href="https://maps.app.goo.gl/2hpbBNMGsopa93T57?g_st=aw" 
                target="_blank" 
                rel="noreferrer"
                className="bg-cyan-500 hover:bg-cyan-400 text-cyan-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                {dict.parking_nav} <ExternalLink size={12} />
              </a>
            </div>
            
            <p className="text-xs text-white/80 leading-relaxed">
              {dict.parking_warning}
            </p>
          </div>

          {/* Parking attachments zoom card */}
          <div className="flex gap-4">
            <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Acceso (Mando)</p>
              <img 
                src="/images/recursos/parking-tag.jpeg" 
                alt="Mando Garaje" 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
                onClick={() => setSelectedImage('/images/recursos/parking-tag.jpeg')}
              />
            </div>
            
            <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Candado Barrera (0539)</p>
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
            <h3 className="font-semibold text-sm text-cyan-200 border-b border-white/10 pb-1.5">{dict.parking_to_apt_title}</h3>
            <p className="text-white/80 text-xs leading-relaxed">{dict.parking_to_apt_desc}</p>
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
            <h3 className="font-semibold text-sm text-cyan-200 border-b border-white/10 pb-1.5">{dict.parking_car_access_title}</h3>
            <p className="text-white/80 text-xs leading-relaxed">{dict.parking_car_access_desc}</p>
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
        </div>
      )}

      {/* ==========================================
          TAB 4: BARRIO (NEIGHBORHOOD GPS MAPS)
          ========================================== */}
      {activeTab === 'barrio' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-cyan-200 border-b border-white/10 pb-1.5">{dict.neighborhood_services}</h3>
            
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
                <h4 className="text-cyan-300 font-bold text-xs uppercase tracking-wider mb-2">🛒 {dict.neighborhood_health}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Supermercado+Consum+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Supermercado Consum</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Farmacia Fenals</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Blanca+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Farmacia Blanca</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/place/Lavander%C3%ADa+24h+(go+laundry)/@41.7136585,2.8309247,19.25z/data=!4m6!3m5!1s0x12bb17812675b779:0x60f19ce56eac64d4!8m2!3d41.7136398!4d2.8307474!16s%2Fg%2F11h_4s81hw?entry=ttu" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">{dict.laundry}</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>

              {/* Eat */}
              <div>
                <h4 className="text-cyan-300 font-bold text-xs uppercase tracking-wider mb-2">🥘 {dict.neighborhood_eat}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=L%27Arrosseria+de+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">L'Arrosseria de Fenals</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Planiol+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Restaurante Planiol</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=El+Jardi+Parrilla+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">El Jardí Parrilla</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Hay+Motivo+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Restaurante Hay Motivo</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Corsaro+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Pizzería Corsaro</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=heladeria+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">{dict.ice_cream}</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>

              {/* See */}
              <div>
                <h4 className="text-cyan-300 font-bold text-xs uppercase tracking-wider mb-2">📸 {dict.neighborhood_see}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Jardines+de+Santa+Clotilde+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Jardines de Santa Clotilde</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Cala+Boadella+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Cala Boadella</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Castell+de+Sant+Joan+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Castell de Sant Joan</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Water+World+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-xs text-white">Parque Acuático Water World</span>
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
