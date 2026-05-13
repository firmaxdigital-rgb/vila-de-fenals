'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroViajeroPage({ params }: { params: { reservation_code: string } }) {
  const router = useRouter();
  const decodedCode = decodeURIComponent(params.reservation_code);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    fecha_expedicion: '',
    fecha_nacimiento: '',
    sexo: 'M',
    nacionalidad: 'ES',
  });

  // Handle canvas drawing for signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ffffff'; // White signature for dark theme
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check if canvas is empty
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // A crude way to check if canvas is blank (just checking a few pixels)
    const ctx = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(ctx!.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const isCanvasBlank = !pixelBuffer.some(color => color !== 0);

    if (isCanvasBlank) {
      setError('La firma es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    
    const signatureBase64 = canvas.toDataURL('image/png');

    try {
      const res = await fetch('/api/partee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_code: decodedCode,
          ...formData,
          firma: signatureBase64
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el registro');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/viladefenals/acceso/${decodedCode}`);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/50 to-cyan-900/70 p-4 relative">
        <div className="absolute inset-0 w-full h-full -z-10 bg-gradient-to-br from-teal-300 to-cyan-600" />
        <div className="relative z-10 w-full max-w-md bg-white/20 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-[0_8px_32px_0_rgba(6,182,212,0.2)] p-8 text-center text-white">
          <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-light mb-2">Registro Completado</h2>
          <p className="text-white/80">Sus datos han sido enviados correctamente a las autoridades.</p>
          <p className="text-white/60 text-sm mt-4">Redirigiendo a su acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-br from-teal-900/40 to-cyan-900/50 relative">
      <div className="absolute inset-0 w-full h-full -z-10 bg-gradient-to-br from-teal-300 to-cyan-600" />
      
      <div className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-6 md:p-8">
        <h1 className="text-3xl font-light text-white mb-2 text-center drop-shadow-md">Registro de Viajero</h1>
        <p className="text-cyan-100/90 text-sm text-center mb-8">
          Por normativa legal, es obligatorio completar este formulario antes de acceder al alojamiento.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6 text-red-100 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">Nombre</label>
              <input required name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="Ej. Juan" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">Apellidos</label>
              <input required name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="Ej. Pérez García" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">Tipo Doc.</label>
              <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [&>option]:bg-gray-800">
                <option value="DNI">DNI</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">Número Doc.</label>
              <input required name="numero_documento" value={formData.numero_documento} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">F. Expedición</label>
              <input required type="date" name="fecha_expedicion" value={formData.fecha_expedicion} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">F. Nacimiento</label>
              <input required type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">Sexo</label>
              <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [&>option]:bg-gray-800">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">Nacionalidad</label>
              <input required name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="ES" maxLength={2} />
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex justify-between items-center">
              <label className="text-xs text-white/80 uppercase tracking-wider font-semibold">Firma del Huésped</label>
              <button type="button" onClick={clearSignature} className="text-xs text-cyan-300 hover:text-cyan-100 transition-colors">
                Limpiar
              </button>
            </div>
            <div className="bg-black/30 border border-white/20 rounded-xl overflow-hidden touch-none relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full h-[150px] cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-8 py-3 px-6 rounded-xl bg-white text-cyan-900 font-bold text-lg hover:bg-cyan-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Registro'}
          </button>
          
          <div className="text-center mt-4">
             <button 
              type="button" 
              onClick={() => router.push(`/viladefenals/acceso/${decodedCode}`)}
              className="text-white/60 text-sm hover:text-white transition-colors"
             >
               Volver al acceso
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
