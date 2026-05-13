'use client';

import React, { useState } from 'react';

// You will need to map these links to your actual Paycomet links eventually.
// For now, this is just a placeholder logic. We will explain to the user how to provide the mapping.
const getPaycometLink = (guests: number, nights: number) => {
  // Placeholder URL. In production, this would look up from a database or a config object
  // containing the actual Paycomet static links the user created.
  return `https://paycomet.placeholder/pay?amount=${(guests * nights * 1.75).toFixed(2)}`;
};

export default function TasaForm({ reservationCode, calculatedNights }: { reservationCode: string, calculatedNights: number }) {
  const [adults, setAdults] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const total = (adults * calculatedNights * 1.75).toFixed(2);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // In a real flow, we would either redirect the user to the Paycomet link,
    // and wait for a webhook from Paycomet to confirm payment in Supabase.
    // For now, we simulate the redirect. Since we don't have the links yet, 
    // we just show an alert or simulate the success.
    
    // Simulate updating Supabase just for demonstration until Paycomet webhooks are ready
    try {
      const res = await fetch('/api/paycomet/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_code: reservationCode, status: 'PAID' })
      });
      if (res.ok) {
        alert(`¡Simulación exitosa! Redirigiendo a enlace de Paycomet por valor de ${total}€...`);
        window.location.href = `/viladefenals/acceso/${reservationCode}`;
      } else {
        alert("Error al simular pago.");
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-white/90">¿Cuántos huéspedes mayores de 17 años se alojan?</label>
        <select 
          value={adults} 
          onChange={(e) => setAdults(Number(e.target.value))}
          className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [&>option]:bg-gray-800 text-lg text-center"
        >
          {Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
            <option key={num} value={num}>{num} {num === 1 ? 'huésped' : 'huéspedes'}</option>
          ))}
        </select>
      </div>

      <div className="pt-4 border-t border-white/20">
        <div className="flex justify-between items-end mb-6">
          <span className="text-white/80 font-medium">Total a pagar:</span>
          <span className="text-4xl font-light text-white drop-shadow-md">{total}€</span>
        </div>

        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-lg hover:from-emerald-300 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <span className="animate-pulse">Procesando...</span>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pagar con Tarjeta
            </>
          )}
        </button>
      </div>
    </div>
  );
}
