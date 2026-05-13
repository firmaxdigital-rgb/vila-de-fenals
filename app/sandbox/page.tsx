'use client';

import React, { useState } from 'react';
import { Lock, Key, Car, Map as MapIcon, Wifi, Copy, ExternalLink, ChevronDown, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState('acceso');
  const [copied, setCopied] = useState(false);

  const handleCopyWifi = () => {
    navigator.clipboard.writeText('86075541');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans relative pb-20">
      {/* Background Image (Mock) */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img
          src="/images/IMG_0566.JPG"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-md mx-auto pt-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-wider mb-2">VILA DE FENALS</h1>
          <p className="text-gray-300 text-sm">Guía del Huésped</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-between mb-6 bg-white/10 p-1 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('acceso')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'acceso' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock size={18} /> Acceso
          </button>
          <button
            onClick={() => setActiveTab('llaves')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'llaves' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key size={18} /> Zonas
          </button>
          <button
            onClick={() => setActiveTab('parking')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'parking' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Car size={18} /> Parking
          </button>
          <button
            onClick={() => setActiveTab('barrio')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'barrio' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapIcon size={18} /> Barrio
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          
          {/* ACCESO TAB */}
          {activeTab === 'acceso' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Botón Principal (Mock) */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 mb-4 text-center">
                <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Portal Principal</h2>
                <p className="text-gray-300 text-sm mb-4">Pulsa aquí para abrir la puerta de la calle</p>
                <button className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl">
                  Abrir Portal
                </button>
              </div>

              {/* Código Puerta */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 mb-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Key size={18} className="text-blue-400" /> Código del Apartamento
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Usa este código en el teclado numérico de la puerta. Para cerrar con pestillo por dentro, pulsa la tecla triangular.
                </p>
                <div className="bg-black/40 text-center py-3 rounded-xl font-mono text-xl tracking-widest text-blue-300">
                  XXXXXX
                </div>
              </div>

              {/* WiFi */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Wifi size={18} className="text-green-400" /> WiFi del Apartamento
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                    <span className="text-gray-400 text-sm">Red</span>
                    <span className="font-medium">FitelFibra_2G_4168</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                    <span className="text-gray-400 text-sm">Clave</span>
                    <button 
                      onClick={handleCopyWifi}
                      className="flex items-center gap-2 text-green-400 font-medium hover:text-green-300 transition-colors"
                    >
                      {copied ? <><CheckCircle2 size={16} /> Copiada</> : <><Copy size={16} /> 86075541</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ZONAS TAB */}
          {activeTab === 'llaves' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-2 text-lg">Acceso a la Piscina</h3>
                <p className="text-gray-300 text-sm mb-4">
                  En la mesa encontrarás unas llaves con un llavero de Tortuga Ninja y una llave magnética azul. Úsalas como se muestra en el vídeo para entrar a la zona de la piscina.
                </p>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/l9vpUNr4fXA?rel=0" 
                    title="Pool Access"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-2 text-lg">Entrada Trasera (Directa)</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Las otras llaves de la mesa abren la puerta de la calle trasera. Es la forma más rápida y cómoda de entrar al edificio.
                </p>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/B508vUH8AbQ?rel=0" 
                    title="Direct Access"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>

              {/* Enlace discreto a normas comunitarias */}
              <div className="text-center mt-6">
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
                >
                  Ver Normas Comunitarias
                </a>
              </div>
            </div>
          )}

          {/* PARKING TAB */}
          {activeTab === 'parking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
              <div className="bg-blue-500/20 backdrop-blur-md rounded-2xl p-5 border border-blue-500/30">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Car className="text-blue-400" /> Plaza 75
                  </h3>
                  <a 
                    href="https://maps.app.goo.gl/2hpbBNMGsopa93T57?g_st=aw" 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    Navegar <ExternalLink size={14} />
                  </a>
                </div>
                <p className="text-blue-100 text-sm mb-4">
                  ⚠️ <strong>Importante:</strong> Al salir con el coche, sube siempre la barrera con el candado para evitar que otros aparquen en tu plaza.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-2 text-lg">Del Parking al Apartamento</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Usa la llave azul magnética para acceder desde el garaje al interior del edificio mediante el ascensor.
                </p>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/bQ3bXpZAA-w?rel=0" 
                    title="Elevator Access"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-2 text-lg">Acceso con el Coche</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Usa el mando que está en el soporte rojo del parasol para abrir la puerta del garaje desde la calle.
                </p>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/52aGzhG-6qw?rel=0" 
                    title="Car Access"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          )}

          {/* BARRIO TAB */}
          {activeTab === 'barrio' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-4 text-lg">Servicios Cercanos</h3>
                
                <div className="w-full bg-white/5 rounded-xl border border-white/10 p-2 mb-4">
                   <p className="text-sm text-gray-400 text-center py-8">[Aquí irá el Mapa que has enviado con las indicaciones de los Supermercados]</p>
                </div>

                <div className="space-y-6">
                  {/* Supermercados & Farmacias */}
                  <div>
                    <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">🛒 Básicos y Salud</h4>
                    <div className="space-y-2">
                      <a href="https://maps.app.goo.gl/3fC2ZtN4q3xKJh3s6" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Supermercado Consum</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/mKQ1uA5gP1k4vXQz7" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Farmacia Fenals</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/wL1y3q7N6y5YF6uP7" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Farmacia Blanca</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=lavanderia+Av+Vila+de+Blanes+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Lavandería (Av. Vila de Blanes)</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                    </div>
                  </div>

                  {/* Restaurantes */}
                  <div>
                    <h4 className="text-orange-300 font-medium mb-3 flex items-center gap-2">🥘 Dónde Comer</h4>
                    <div className="space-y-2">
                      <a href="https://maps.app.goo.gl/3D2bN6R2jF4A8zXv8" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">L'Arrosseria de Fenals</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/zXy7sT4xY1mP8n7b7" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Restaurante Planiol</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/9tHqM2jD8qE6kXm79" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">El Jardí Parrilla</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/8vNqX2L4pM7uYk9j6" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Restaurante Hay Motivo</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/7jM4vK8pP2tU1n6h8" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Pizzería Corsaro</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/2kH7uL9nM4wY5v8f6" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Restaurante Ugolok</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Xurreria+La+Selva+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Xurreria La Selva</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=heladeria+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Heladería de Fenals</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                    </div>
                  </div>

                  {/* Turismo */}
                  <div>
                    <h4 className="text-green-300 font-medium mb-3 flex items-center gap-2">📸 Qué Ver y Hacer</h4>
                    <div className="space-y-2">
                      <a href="https://maps.app.goo.gl/5qN2mP8kL4tY9j7b6" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Jardines de Santa Clotilde</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/4kN7mP8kL4tY9j7b6" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Cala Boadella</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/3jN7mP8kL4tY9j7b6" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Castell de Sant Joan</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://maps.app.goo.gl/1hN7mP8kL4tY9j7b6" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Oficina Turismo (Estación)</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Water+World+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Water World</span>
                        <ExternalLink size={16} className="text-blue-400" />
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
