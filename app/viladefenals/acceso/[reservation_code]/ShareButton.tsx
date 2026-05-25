'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
  shareUrl: string;
  preFilledText: string;
  dict: any;
}

export default function ShareButton({ shareUrl, preFilledText, dict }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check-in Vila de Fenals',
          text: preFilledText,
          url: shareUrl,
        });
        console.log('Enlace compartido con éxito');
      } catch (err) {
        console.error('Error al compartir:', err);
      }
    } else {
      // Fallback: Copy to Clipboard
      try {
        await navigator.clipboard.writeText(`${preFilledText} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
      }
    }
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${preFilledText} ${shareUrl}`)}`;
  const mailUrl = `mailto:?subject=Vila%20de%20Fenals%20Check-in&body=${encodeURIComponent(`${preFilledText} ${shareUrl}`)}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Native Share / Copy Button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-cyan-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Share2 size={14} />
              <span>{dict.share_link_title || 'Compartir Enlace'}</span>
            </>
          )}
        </button>
      </div>

      <div className="flex gap-2">
        {/* WhatsApp direct link */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.46L0 24zm5.835-4.117c1.62.962 3.2 1.48 4.766 1.481 5.378 0 9.754-4.374 9.757-9.76.002-2.61-1.01-5.063-2.853-6.907C15.698 2.854 13.256 1.84 10.66 1.84c-5.385 0-9.761 4.378-9.764 9.765-.001 1.936.52 3.826 1.508 5.467L1.39 21.24l4.502-1.357zM16.57 13.9c-.276-.138-1.637-.808-1.89-.9-.253-.093-.437-.138-.62.138-.184.276-.713.9-.874 1.085-.162.184-.323.207-.6.069-.276-.138-1.167-.43-2.223-1.372-.821-.733-1.376-1.638-1.537-1.914-.162-.276-.017-.424.12-.562.125-.125.276-.323.415-.483.138-.162.184-.276.276-.46.093-.184.047-.346-.023-.483-.069-.138-.62-1.495-.85-2.047-.224-.54-.479-.466-.62-.473-.138-.007-.298-.007-.46-.007-.162 0-.424.061-.645.3-.223.238-.85.83-1.85.83s-1.956-.99-1.956-2.02c0-1.03.85-2.02 1.85-2.02.161 0 .298.007.46.007.14.007.396-.067.62.138.276.253.943.92 1.15 1.127.207.207.346.438.23.645-.115.207-.23.46-.346.622-.115.162-.23.346-.115.553.115.207.506.83 1.08 1.34.736.657 1.357.86 1.58.975.223.115.353.097.483-.047.13-.146.553-.645.7-.923.146-.276.298-.23.498-.157.198.073 1.258.593 1.474.7.217.108.36.161.415.253.055.093.055.54-.22 1.008-.276.468-1.637 1.164-1.89 1.17-.253.007-1.637-.62-1.89-.9z" />
          </svg>
          {dict.share_whatsapp || 'WhatsApp'}
        </a>

        {/* Email direct link */}
        <a
          href={mailUrl}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {dict.share_email || 'Email'}
        </a>
      </div>
    </div>
  );
}
