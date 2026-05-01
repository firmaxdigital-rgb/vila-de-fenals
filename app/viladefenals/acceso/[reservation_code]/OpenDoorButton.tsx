'use client';

import { useState } from 'react';
import { Key, Unlock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OpenDoorButton({ 
  reservationCode, 
  dict 
}: { 
  reservationCode: string;
  dict: any;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenDoor = async () => {
    setStatus('loading');
    setErrorMessage('');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/open-door', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_code: reservationCode }),
      });

      const data = await response.json();
      
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise(r => setTimeout(r, 3000 - elapsed));
      }

      if (response.ok && data.success) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.message || dict.error);
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise(r => setTimeout(r, 3000 - elapsed));
      }
      setStatus('error');
      setErrorMessage(dict.error_conn);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <button
        onClick={handleOpenDoor}
        disabled={status === 'loading' || status === 'success'}
        className={`relative group w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-500 ease-out outline-none
          ${status === 'idle' ? 'bg-gradient-to-br from-cyan-200/40 to-teal-400/20 border-2 border-white/40 text-cyan-50 shadow-[0_0_40px_rgba(6,182,212,0.2)] hover:shadow-[0_0_60px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95' : ''}
          ${status === 'loading' ? 'bg-white/20 border-2 border-white/50 text-white/90 cursor-wait shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''}
          ${status === 'success' ? 'bg-emerald-500/90 border-2 border-emerald-300 text-white scale-110 shadow-[0_0_60px_rgba(16,185,129,0.5)]' : ''}
          ${status === 'error' ? 'bg-red-500/90 border-2 border-red-300 text-white scale-95 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : ''}
        `}
      >
        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {status === 'idle' && (
          <>
            <Key size={48} strokeWidth={1} className="mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300 text-cyan-100" />
            <span className="font-light text-xl tracking-[0.2em] ml-1">{dict.open}</span>
            <span className="text-[0.65rem] uppercase tracking-widest opacity-70 mt-2 font-medium">{dict.portal}</span>
          </>
        )}

        {status === 'loading' && (
          <>
            <Unlock size={48} strokeWidth={1} className="mb-3 animate-pulse" />
            <span className="font-light text-base tracking-widest animate-pulse">{dict.connecting}</span>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} strokeWidth={1.5} className="mb-3" />
            <span className="font-medium text-lg tracking-widest">{dict.opened}</span>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} strokeWidth={1.5} className="mb-3" />
            <span className="font-medium text-lg tracking-widest">{dict.error}</span>
          </>
        )}
      </button>

      <div className={`mt-6 h-10 transition-all duration-300 ${status === 'error' ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4 pointer-events-none'}`}>
        <p className="text-red-100 bg-red-900/40 backdrop-blur-md border border-red-400/40 px-4 py-2 rounded-xl text-sm font-medium">
          {errorMessage}
        </p>
      </div>
    </div>
  );
}
