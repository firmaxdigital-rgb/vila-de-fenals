'use client';

import { useState } from 'react';
import { Key, Unlock, CheckCircle2, AlertCircle } from 'lucide-react';

const scheduleLabels: Record<string, { checkin: string; checkout: string }> = {
  es: { checkin: 'Horario de Entrada (Check-in)', checkout: 'Horario de Salida (Check-out)' },
  en: { checkin: 'Check-in Time', checkout: 'Check-out Time' },
  fr: { checkin: "Heure d'arrivée (Check-in)", checkout: 'Heure de départ (Check-out)' },
  de: { checkin: 'Check-in Zeit', checkout: 'Check-out Zeit' },
  pl: { checkin: 'Godzina zameldowania (Check-in)', checkout: 'Godzina wymeldowania (Check-out)' },
  nl: { checkin: 'Inchecktijd (Check-in)', checkout: 'Uitchecktijd (Check-out)' },
  uk: { checkin: 'Час заїзду (Check-in)', checkout: 'Час виїзду (Check-out)' },
  ru: { checkin: 'Время заезда (Check-in)', checkout: 'Время выезда (Check-out)' },
  zh: { checkin: '入住时间 (Check-in)', checkout: '退房时间 (Check-out)' },
  ja: { checkin: 'チェックイン時間', checkout: 'チェックアウト時間' }
};

export default function OpenDoorButton({ 
  reservation, 
  lang,
  dict 
}: { 
  reservation: any;
  lang: string;
  dict: any;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const reservationCode = reservation.reservation_code;
  const checkInTime = reservation.checkInTime || '16:00';
  const checkOutTime = reservation.checkOutTime || '10:00';
  const schedLabel = scheduleLabels[lang] || scheduleLabels['es'];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

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
        
        let msg = data.message || dict.error;
        if (msg === 'Fuera del horario permitido') {
          msg = ({
            es: 'Fuera del horario permitido',
            en: 'Outside permitted hours',
            fr: 'En dehors des heures autorisées',
            de: 'Außerhalb der erlaubten Zeiten',
            pl: 'Poza dozwolonymi godzinami',
            nl: 'Buiten de toegestane uren',
            zh: '超出允许的时间段',
            uk: 'Поза дозволеним часом',
            ru: 'Вне разрешенного времени',
            ja: '許可時間外です'
          } as Record<string, string>)[lang] || 'Outside permitted hours';
        }
        setErrorMessage(msg);
        setTimeout(() => setStatus('idle'), 15000); // 15s display duration to easily read scheduling
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

      {status === 'error' && (
        <div className="mt-4 w-full max-w-[280px] bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-xs space-y-2.5 animate-fade-in text-left shadow-inner">
          <p className="flex justify-between items-center">
            <span className="text-white/50">{schedLabel.checkin}:</span>
            <span className="font-bold text-cyan-200">{formatDate(reservation.check_in)} - {checkInTime}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-white/50">{schedLabel.checkout}:</span>
            <span className="font-bold text-cyan-200">{formatDate(reservation.check_out)} - {checkOutTime}</span>
          </p>
        </div>
      )}
    </div>
  );
}
