'use client';

import React from 'react';
import { ShieldAlert, Key } from 'lucide-react';

export default function BackupPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans relative flex flex-col items-center justify-center px-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-md">
        <div className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Acceso de Emergencia</h1>
        <p className="text-gray-300 text-sm mb-8">
          Utiliza este método únicamente si el sistema de apertura por botón no funciona.
        </p>

        <div className="bg-black/40 rounded-2xl p-5 border border-white/10 mb-6 text-left">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
            <Key size={18} /> Caja Fuerte Exterior
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            A la derecha del portal encontrarás un cajetín de seguridad. Introduce el código proporcionado por el anfitrión para obtener las llaves físicas.
          </p>
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/y8PLkwEWH_s?rel=0" 
              title="Backup Access"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
