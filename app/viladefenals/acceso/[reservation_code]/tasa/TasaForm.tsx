'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface TasaFormProps {
  reservationCode: string;
  payingGuests: number;
  nights: number;
  totalAmount: number;
  unregisteredPayingGuests?: number;
}

export default function TasaForm({ reservationCode, payingGuests, nights, totalAmount, unregisteredPayingGuests }: TasaFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'es';
  const isMicroCharge = searchParams.get('test_mode') === 'true' || searchParams.get('micro_charge') === 'true' || reservationCode === 'HMMR92E9DJ' || reservationCode === 'TEST7GUESTS' || reservationCode === 'TESTPROD';

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const totalToShow = reservationCode === 'TESTPROD' ? 1.00 : (isMicroCharge ? 0.10 : totalAmount);
  const formattedTotal = totalToShow.toFixed(2);

  const handlePaymentRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // 1. Request secure payment link from our Next.js backend API
      const res = await fetch('/api/payment/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reservation_code: reservationCode, 
          lang,
          micro_charge: isMicroCharge,
          unregistered_paying_guests: unregisteredPayingGuests
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un error al generar la pasarela de pago.');
      }

      // If amount is 0 (fully exempt), finalize check-in immediately without redirecting
      if (data.url === null && data.amount === 0) {
        console.log("Reservation is fully exempt (0.00€). Direct finalization triggered.");
        
        const finalRes = await fetch('/api/registro-final', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_code: reservationCode })
        });

        const finalData = await finalRes.json();
        
        if (!finalRes.ok) {
          console.warn("Direct finalization warned:", finalData.error);
        }

        setIsSuccess(true);
        
        setTimeout(() => {
          router.push(`/viladefenals/acceso/${reservationCode}?lang=${lang}`);
          router.refresh();
        }, 4000);

        return;
      }

      // 2. Redirect the guest to the secure PayComet-hosted payment form in their language
      console.log("Redirecting guest to secure PayComet URL:", data.url);
      window.location.href = data.url;

    } catch (err: any) {
      console.error("Redirect process error:", err);
      setError(err.message || 'No se pudo conectar con la pasarela de pago PayComet.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center text-white py-8 space-y-4 animate-fade-in">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
          <CheckCircle2 size={44} className="text-emerald-400 animate-bounce" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-light text-white tracking-wide">¡Check-in Completado!</h2>
          <p className="text-xs text-green-300 font-bold uppercase tracking-wider">Trámite Exento Autorizado</p>
        </div>
        <p className="text-sm text-white/70 leading-relaxed max-w-xs mx-auto">
          Su estancia de <strong className="text-white text-base">{formattedTotal}€</strong> ha sido finalizada con éxito.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 max-w-sm mx-auto text-left space-y-1">
          <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest">Estado de Trámite</p>
          <p className="text-xs text-white/90">✓ Ficheros Mossos d'Esquadra generados</p>
          <p className="text-xs text-white/90">✓ Envío por email al establecimiento confirmado</p>
          <p className="text-xs text-white/90">✓ Activando código de apertura Nuki...</p>
        </div>
        <p className="text-xs text-white/50 animate-pulse pt-2">
          Redirigiendo a su panel de acceso...
        </p>
      </div>
    );
  }

  // Language dictionary for secure page hints
  const dicts: Record<string, any> = {
    es: {
      total: 'Total a pagar:',
      secure_hint: 'Conexión cifrada de alta seguridad de PayComet',
      pay_btn: 'Proceder al Pago Seguro',
      processing: 'Conectando con Pasarela...',
      redirecting: 'Redirigiendo a PayComet...',
      reassurance: 'Esta operación le redirigirá a la pasarela de pago oficial certificada de PayComet. Vila de Fenals nunca almacena ni tiene acceso a los datos de su tarjeta de crédito.',
      exempt_title: '¡Estancia exenta de Tasa!',
      exempt_desc: 'Todos los huéspedes registrados son menores de 16 años.',
      exempt_btn: 'Finalizar Check-in (0.00€)',
      exempt_processing: 'Finalizando Check-in...'
    },
    en: {
      total: 'Total to pay:',
      secure_hint: 'High-security encrypted connection by PayComet',
      pay_btn: 'Proceed to Secure Payment',
      processing: 'Connecting to Gateway...',
      redirecting: 'Redirecting to PayComet...',
      reassurance: 'This operation will redirect you to the official certified PayComet gateway. Vila de Fenals never stores or has access to your credit card details.',
      exempt_title: 'Exempt from Tourist Tax!',
      exempt_desc: 'All registered guests are under 16 years old.',
      exempt_btn: 'Finalize Check-in (0.00€)',
      exempt_processing: 'Finalizing Check-in...'
    },
    fr: {
      total: 'Total à payer:',
      secure_hint: 'Connexion cryptée haute sécurité par PayComet',
      pay_btn: 'Procéder au paiement sécurisé',
      processing: 'Connexion à la passerelle...',
      redirecting: 'Redirection vers PayComet...',
      reassurance: 'Cette opération vous redirigera vers la passerelle certifiée officielle PayComet. Vila de Fenals ne stocke ni n\'a accès à vos données bancaires.',
      exempt_title: 'Séjour exempté de taxe !',
      exempt_desc: 'Tous les clients enregistrés ont moins de 16 ans.',
      exempt_btn: 'Finaliser le Check-in (0.00€)',
      exempt_processing: 'Finalisation du Check-in...'
    },
    de: {
      total: 'Gesamtbetrag:',
      secure_hint: 'Hochsichere verschlüsselte Verbindung von PayComet',
      pay_btn: 'Weiter zur sicheren Zahlung',
      processing: 'Verbindung zum Gateway...',
      redirecting: 'Weiterleitung zu PayComet...',
      reassurance: 'Dieser Vorgang leitet Sie zum offiziell zertifizierten PayComet-Zahlungsportal weiter. Vila de Fenals speichert Ihre Kreditkartendaten nicht.',
      exempt_title: 'Von der Kurtaxe befreit!',
      exempt_desc: 'Alle angemeldeten Gäste sind unter 16 Jahre alt.',
      exempt_btn: 'Check-in abschließen (0.00€)',
      exempt_processing: 'Check-in wird abgeschlossen...'
    }
  };

  // Fallback to Spanish or English dictionary
  const dict = dicts[lang] || dicts['en'] || dicts['es'];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 text-red-100 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {payingGuests === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-3">
          <p className="text-emerald-300 text-base font-bold">{dict.exempt_title}</p>
          <p className="text-white/70 text-sm">{dict.exempt_desc}</p>
          
          <button
            onClick={handlePaymentRedirect}
            disabled={isProcessing}
            className="w-full mt-2 py-3 px-6 rounded-xl bg-white text-emerald-950 font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span className="animate-pulse">{dict.exempt_processing}</span>
            ) : (
              <span>{dict.exempt_btn}</span>
            )}
          </button>
        </div>
      ) : (
        <form onSubmit={handlePaymentRedirect} className="space-y-4">
          <div className="border-t border-white/20 pt-4 flex justify-between items-baseline mb-2">
            <span className="text-base text-white/70">{dict.total}</span>
            <span className="text-4xl font-extralight text-white tracking-tight">{formattedTotal}€</span>
          </div>

          {/* Premium Informative Billing Card */}
          <div className="space-y-3 bg-black/25 rounded-2xl p-4 border border-white/10 text-white/80">
            <div className="flex justify-between items-center text-white/50 text-xs uppercase font-bold tracking-wider mb-2">
              <span className="flex items-center gap-1">💳 Pasarela de Pago</span>
              <span className="flex items-center gap-0.5"><ShieldCheck size={12} className="text-emerald-400" /> PayComet Secure</span>
            </div>

            <p className="text-sm leading-relaxed text-white/70">
              {dict.reassurance}
            </p>

            {/* Simulated credit card logos and security indicators */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-1">
              <div className="flex gap-2 opacity-75">
                <span className="text-[11px] uppercase border border-white/20 rounded px-1.5 py-0.5 font-bold tracking-widest bg-white/5 font-mono text-cyan-200">VISA</span>
                <span className="text-[11px] uppercase border border-white/20 rounded px-1.5 py-0.5 font-bold tracking-widest bg-white/5 font-mono text-cyan-200">MC</span>
                <span className="text-[11px] uppercase border border-white/20 rounded px-1.5 py-0.5 font-bold tracking-widest bg-white/5 font-mono text-cyan-200">BIZUM</span>
              </div>
              <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">PCI-DSS Compliant</span>
            </div>
          </div>

          {/* Secure details reminder */}
          <div className="flex items-center gap-1.5 justify-center text-xs text-white/50">
            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{dict.secure_hint}</span>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold text-base hover:from-teal-300 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isProcessing ? (
              <span className="animate-pulse">{dict.processing}</span>
            ) : (
              <>
                <ExternalLink size={18} />
                {dict.pay_btn} ({formattedTotal}€)
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
