'use client';

import { useState } from 'react';
import { Key, Unlock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OpenDoorButton({ reservationCode }: { reservationCode: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenDoor = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/open-door', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservation_code: reservationCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        // Vuelve al estado inicial después de 5 segundos
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Error al abrir la puerta');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Error de conexión. Revisa tu internet.');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <button
        onClick={handleOpenDoor}
        disabled={status === 'loading' || status === 'success'}
        className={`relative group w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-500 ease-out outline-none
          ${status === 'idle' ? 'bg-gradient-to-b from-white/20 to-white/5 border-2 border-white/30 text-white shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95' : ''}
          ${status === 'loading' ? 'bg-white/10 border-2 border-white/50 text-white/80 cursor-wait shadow-[0_0_30px_rgba(255,255,255,0.2)]' : ''}
          ${status === 'success' ? 'bg-emerald-500/80 border-2 border-emerald-400 text-white scale-110 shadow-[0_0_60px_rgba(16,185,129,0.5)]' : ''}
          ${status === 'error' ? 'bg-red-500/80 border-2 border-red-400 text-white scale-95 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : ''}
        `}
      >
        {/* Efecto hover Glassmorphism */}
        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {status === 'idle' && (
          <>
            <Key size={48} strokeWidth={1} className="mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-light text-xl tracking-[0.2em] ml-1">ABRIR</span>
            <span className="text-[0.65rem] uppercase tracking-widest opacity-60 mt-2 font-medium">Portal Edificio</span>
          </>
        )}

        {status === 'loading' && (
          <>
            <Unlock size={48} strokeWidth={1} className="mb-3 animate-pulse" />
            <span className="font-light text-lg tracking-widest animate-pulse">ABRIENDO</span>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} strokeWidth={1.5} className="mb-3" />
            <span className="font-medium text-lg tracking-widest">¡ABIERTO!</span>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} strokeWidth={1.5} className="mb-3" />
            <span className="font-medium text-lg tracking-widest">ERROR</span>
          </>
        )}
      </button>

      {/* Mensaje de Error */}
      <div className={`mt-6 h-10 transition-all duration-300 ${status === 'error' ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4 pointer-events-none'}`}>
        <p className="text-red-200 bg-red-900/30 backdrop-blur-md border border-red-500/30 px-4 py-2 rounded-xl text-sm font-medium">
          {errorMessage}
        </p>
      </div>
    </div>
  );
}
