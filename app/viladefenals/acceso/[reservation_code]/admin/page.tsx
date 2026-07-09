'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Users, Lock, Unlock, ArrowRight, ShieldAlert, CheckCircle2, ChevronLeft } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const decodedCode = decodeURIComponent(params.reservation_code as string);

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [reservation, setReservation] = useState<any>(null);
  const [guestsCount, setGuestsCount] = useState(0);
  const [checkInTime, setCheckInTime] = useState('16:00');
  const [checkOutTime, setCheckOutTime] = useState('10:00');
  const [hasDeposit, setHasDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [travelers, setTravelers] = useState<any[]>([]);
  const [isUpdatingOptOut, setIsUpdatingOptOut] = useState<Record<string, boolean>>({});
  const [taxPaymentMethod, setTaxPaymentMethod] = useState('');
  const [isUpdatingTax, setIsUpdatingTax] = useState(false);
  const [taxUpdateSuccess, setTaxUpdateSuccess] = useState(false);

  useEffect(() => {
    async function loadReservationAndTravelers() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('reservation_code', decodedCode)
          .single();

        if (!error && data) {
          setReservation(data);
          setGuestsCount(data.total_guests || 0);
          setHasDeposit(data.has_deposit || false);
          setDepositAmount(data.deposit_amount ? String(data.deposit_amount) : '0');

          if (data.platform && data.platform.startsWith('{')) {
            try {
              const parsed = JSON.parse(data.platform);
              setCheckInTime(parsed.check_in_time || '16:00');
              setCheckOutTime(parsed.check_out_time || '10:00');
              if (data.is_tax_paid && parsed.tax_payment_method) {
                setTaxPaymentMethod(parsed.tax_payment_method);
              }
            } catch (e) {
              console.error("Error parsing platform JSON:", e);
            }
          }
        }

        // Fetch travelers as well
        const { data: travelersData, error: travelersError } = await supabase
          .from('travelers')
          .select('*')
          .eq('reservation_code', decodedCode);

        if (!travelersError && travelersData) {
          const parsed = travelersData.map((t: any) => {
            if (t.firma && t.firma.trim().startsWith('{')) {
              try {
                const extra = JSON.parse(t.firma);
                return {
                  ...t,
                  ...extra,
                  firma: extra.firma || t.firma
                };
              } catch (e) {
                console.error(e);
              }
            }
            return t;
          });
          setTravelers(parsed);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReservationAndTravelers();
  }, [decodedCode]);

  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError(data.error || 'PIN Incorrecto');
      }
    } catch (err) {
      setAuthError('Error de conexión. Inténtelo de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/reservations/update-guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_code: decodedCode,
          total_guests: guestsCount,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          has_deposit: hasDeposit,
          deposit_amount: depositAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          router.refresh();
        }, 1500);
      } else {
        alert(data.error || 'Error al guardar los huéspedes.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverrideTax = async () => {
    if (!taxPaymentMethod) {
      alert("Por favor, selecciona un método de pago.");
      return;
    }
    setIsUpdatingTax(true);
    try {
      const res = await fetch('/api/admin/override-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          reservation_code: decodedCode,
          payment_method: taxPaymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        setTaxUpdateSuccess(true);
        setReservation((prev: any) => ({ ...prev, is_tax_paid: true }));
        setTimeout(() => {
          setTaxUpdateSuccess(false);
        }, 2000);
      } else {
        alert(data.error || 'Error al actualizar la tasa.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red.');
    } finally {
      setIsUpdatingTax(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteReservation = async () => {
    const pwd = window.prompt("⚠️ ATENCIÓN: Esta acción es irreversible.\\nIntroduzca la Contraseña de Administrador para confirmar la eliminación de esta reserva:");
    if (!pwd) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/delete-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationCode: decodedCode, password: pwd })
      });
      const data = await res.json();
      if (data.success) {
        alert('Reserva eliminada con éxito.');
        router.push('/');
      } else {
        alert(data.error || 'Contraseña incorrecta o error al eliminar la reserva.');
      }
    } catch (err) {
      alert('Error de red al intentar eliminar la reserva.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleOptOut = async (travelerId: string, currentVal: boolean) => {
    setIsUpdatingOptOut(prev => ({ ...prev, [travelerId]: true }));
    const newVal = !currentVal;
    
    // Find the traveler
    const t = travelers.find(item => item.id === travelerId);
    if (!t) {
      setIsUpdatingOptOut(prev => ({ ...prev, [travelerId]: false }));
      return;
    }

    try {
      // Call standard POST API to save changes securely
      const res = await fetch('/api/travelers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...t,
          opt_out: newVal
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setTravelers(prev => prev.map(item => item.id === travelerId ? { ...item, opt_out: newVal } : item));
      } else {
        alert(data.error || 'Error al cambiar opt-out.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al actualizar el consentimiento.');
    } finally {
      setIsUpdatingOptOut(prev => ({ ...prev, [travelerId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white font-sans relative flex items-center justify-center">
        <Background />
        <div className="relative z-10 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium tracking-wide text-cyan-200">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen text-white font-sans relative pb-20">
        <Background />
        <div className="relative z-20 max-w-md mx-auto pt-16 px-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
              <p className="text-red-300 text-lg font-medium">Reserva no encontrada</p>
              <p className="text-white/80 text-sm mt-2 opacity-80">
                No hemos podido localizar la reserva {decodedCode} en el sistema.
              </p>
            </div>
            <button 
              onClick={() => router.push(`/viladefenals/acceso/${decodedCode}`)}
              className="mt-6 text-sm text-cyan-300 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <ChevronLeft size={16} /> Volver al portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans relative pb-20">
      <Background />

      <div className="relative z-20 max-w-md mx-auto pt-12 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light tracking-wider mb-2">VILA DE FENALS</h1>
          <p className="text-cyan-300 text-xs tracking-[0.25em] uppercase font-bold">Panel de Administración</p>
        </div>

        {!isAuthenticated ? (
          /* Login Screen */
          <form onSubmit={handleLogin} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-md">
                <Lock size={20} className="text-cyan-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Acceso Restringido</h2>
              <p className="text-xs text-white/60">Ingrese el PIN de administración para gestionar la reserva {decodedCode}.</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Introduzca el PIN de administración"
                className="w-full bg-black/40 border border-white/15 rounded-xl py-3.5 px-4 text-center text-lg font-mono tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
                required
              />

              {authError && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl py-2 px-3 text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <ShieldAlert size={14} className="shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-cyan-500/10"
              >
                <span>Acceder</span>
                <ArrowRight size={16} />
              </button>
            </div>
            
            <button 
              type="button"
              onClick={() => router.push(`/viladefenals/acceso/${decodedCode}`)}
              className="w-full text-center text-xs text-white/40 hover:text-white/60 hover:underline transition-colors mt-2"
            >
              Cancelar y volver al portal
            </button>
          </form>
        ) : (
          /* Admin Dashboard Screen */
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shadow-md">
                <Unlock size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Gestionar Reserva</h2>
              <p className="text-xs text-cyan-200 font-bold uppercase tracking-wider">Código: {decodedCode}</p>
            </div>

            {/* Platform & Dates Details Card */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Plataforma de Origen:</span>
                <span className="font-bold text-white uppercase">
                  {reservation.platform && reservation.platform.startsWith('{')
                    ? JSON.parse(reservation.platform).name || 'Airbnb'
                    : reservation.platform}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Fecha de Entrada:</span>
                <span className="font-bold text-cyan-200">{new Date(reservation.check_in).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Fecha de Salida:</span>
                <span className="font-bold text-cyan-200">{new Date(reservation.check_out).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</span>
              </div>
            </div>

            {/* Interactive Guest Capacity Adjustment Counter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5">
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white/95">Asignación de Huéspedes</p>
                <p className="text-[11px] text-white/50 leading-tight">
                  Establezca el total de plazas. Esto habilitará la cantidad exacta de formularios de registro y recalculará la tasa turística para el viajero.
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={() => setGuestsCount(prev => Math.max(0, prev - 1))}
                  disabled={isSaving || guestsCount <= 0}
                  className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 text-white text-xl font-bold flex items-center justify-center hover:bg-white/15 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  -
                </button>
                <div className="text-center min-w-[70px]">
                  <span className="text-4xl font-mono font-bold text-white tracking-tight">
                    {guestsCount}
                  </span>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mt-1">Plazas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGuestsCount(prev => Math.min(15, prev + 1))}
                  disabled={isSaving || guestsCount >= 15}
                  className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 text-white text-xl font-bold flex items-center justify-center hover:bg-white/15 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Custom Hours Adjustment Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5">
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white/95">Horarios de Entrada y Salida</p>
                <p className="text-[11px] text-white/50 leading-tight">
                  Defina las horas de entrada y salida locales. El código Nuki se activará automáticamente 1 hora antes de la entrada y vencerá 1 hora después de la salida.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">Hora Entrada</label>
                  <select
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-center text-sm font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 8).map(h => {
                      const timeStr = `${String(h).padStart(2, '0')}:00`;
                      return <option key={timeStr} value={timeStr} className="bg-neutral-900 text-white">{timeStr}</option>;
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">Hora Salida</label>
                  <select
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-center text-sm font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 8).map(h => {
                      const timeStr = `${String(h).padStart(2, '0')}:00`;
                      return <option key={timeStr} value={timeStr} className="bg-neutral-900 text-white">{timeStr}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Fianza / Depósito Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5">
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white/95">Fianza / Depósito de Seguridad</p>
                <p className="text-[11px] text-white/50 leading-tight">
                  Configure si esta reserva requiere un depósito de garantía reembolsable. El huésped deberá abonarlo para completar el check-in.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl p-3">
                  <label htmlFor="has_deposit_checkbox" className="text-xs text-white/80 font-medium cursor-pointer">
                    ¿Requiere fianza de seguridad?
                  </label>
                  <input
                    id="has_deposit_checkbox"
                    type="checkbox"
                    checked={hasDeposit}
                    onChange={(e) => setHasDeposit(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  />
                </div>

                {hasDeposit && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="deposit_amount_input" className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                      Importe de la Fianza (€)
                    </label>
                    <div className="relative">
                      <input
                        id="deposit_amount_input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Ej: 300.00"
                        className="w-full bg-black/40 border border-white/15 rounded-xl py-2.5 pl-4 pr-10 text-sm font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/40">
                        EUR
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estado Tasa Turística Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5">
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white/95">Estado Tasa Turística</p>
                <p className="text-[11px] text-white/50 leading-tight">
                  Gestione manualmente el pago de la tasa turística si el huésped utilizó una vía alternativa a Paycomet.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {reservation?.is_tax_paid ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <p className="text-green-400 font-bold text-xs uppercase">Pagada</p>
                    {taxPaymentMethod && (
                      <p className="text-green-200/70 text-[10px] mt-1">Vía: {taxPaymentMethod}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                      <p className="text-yellow-400 font-bold text-xs uppercase">Pendiente de Pago</p>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">Marcar como pagada por otra vía</label>
                      <select
                        value={taxPaymentMethod}
                        onChange={(e) => setTaxPaymentMethod(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded-xl py-2.5 px-3 text-sm text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                      >
                        <option value="" className="bg-neutral-900">Selecciona método...</option>
                        <option value="Airbnb" className="bg-neutral-900">Airbnb</option>
                        <option value="Efectivo (Alojamiento)" className="bg-neutral-900">Efectivo (Alojamiento)</option>
                        <option value="Transferencia Bancaria" className="bg-neutral-900">Transferencia Bancaria</option>
                        <option value="Otro método" className="bg-neutral-900">Otro método</option>
                      </select>
                      
                      <button
                        type="button"
                        onClick={handleOverrideTax}
                        disabled={isUpdatingTax || !taxPaymentMethod}
                        className="w-full py-2.5 mt-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingTax ? 'Actualizando...' : taxUpdateSuccess ? '¡Actualizado!' : 'Confirmar Pago Manual'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Huéspedes Registrados & Consentimiento (Opt-Out) Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold text-white/95 flex items-center justify-center gap-1.5">
                  <Users size={16} className="text-cyan-400" />
                  <span>Huéspedes Registrados y Privacidad</span>
                </h3>
                <p className="text-[11px] text-white/50 leading-tight">
                  Listado oficial de fichas completadas. Puede gestionar la exclusión comercial (Opt-Out) a petición del huésped.
                </p>
              </div>

              {travelers.length === 0 ? (
                <div className="text-center py-4 bg-black/20 border border-white/5 rounded-xl text-xs text-white/40">
                  Ningún huésped registrado todavía en esta reserva.
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {travelers.map((t) => {
                    const isExcluded = t.opt_out === true || t.opt_out === 'true';
                    const hasAccepted = t.has_accepted_terms === true || t.has_accepted_terms === 'true' || t.has_accepted_terms === undefined; // Default true if registered under terms flow
                    
                    return (
                      <div key={t.id} className="bg-black/35 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white">{t.nombre} {t.apellidos}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {t.tipo_documento}: {t.numero_documento}
                            </p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                            hasAccepted 
                              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                          }`}>
                            {hasAccepted ? 'Condiciones Aceptadas' : 'Pendiente Aceptación'}
                          </span>
                        </div>

                        {/* Toggle Checkbox for Opt-Out */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <label 
                            htmlFor={`opt_out_check_${t.id}`} 
                            className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors"
                          >
                            Excluir de comunicaciones (Opt-Out)
                          </label>
                          <div className="flex items-center gap-2">
                            {isUpdatingOptOut[t.id] && (
                              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                            )}
                            <input
                              id={`opt_out_check_${t.id}`}
                              type="checkbox"
                              checked={isExcluded}
                              disabled={isUpdatingOptOut[t.id]}
                              onChange={() => handleToggleOptOut(t.id, isExcluded)}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:outline-none cursor-pointer disabled:opacity-45"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notification alert for Pending status */}
            {guestsCount === 0 && (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 text-xs text-amber-200 leading-relaxed text-center">
                ⚠️ **Estado: Pendiente**. Si guarda con 0 plazas, el viajero verá un aviso amigable de check-in inactivo en espera de que le asignes plazas.
              </div>
            )}

            {guestsCount > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 text-xs text-emerald-200 leading-relaxed text-center">
                ✓ **Estado: Activo**. Al guardar, se habilitarán **{guestsCount}** celdas de registro y se calculará la tasa turística automáticamente para el viajero.
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              {saveSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-500/35 text-emerald-200 text-xs font-semibold rounded-xl py-2 px-3 text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                  <span>¡Plazas actualizadas y check-in activado!</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || saveSuccess}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar y Activar Check-in</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/viladefenals/acceso/${decodedCode}`)}
                className="w-full text-center text-xs text-white/40 hover:text-white/60 hover:underline transition-colors mt-2 py-1"
              >
                Ir al portal del viajero
              </button>

              <div className="pt-6 mt-4 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={handleDeleteReservation}
                  disabled={isDeleting}
                  className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <span>Eliminar Reserva</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
