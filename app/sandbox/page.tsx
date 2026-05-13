'use client';

import React, { useState, Suspense } from 'react';
import { Lock, Key, Car, Map as MapIcon, Wifi, Copy, ExternalLink, ChevronDown, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { translations, Lang } from './i18n';

function LanguageSelector({ currentLang }: { currentLang: string }) {
  const langs = ['es', 'en', 'fr', 'de', 'pl', 'zh', 'uk', 'ru'];
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 w-fit mx-auto">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => router.push(`${pathname}?lang=${l}`)}
          className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${currentLang === l ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function SandboxContent() {
  const [activeTab, setActiveTab] = useState('acceso');
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const langQuery = searchParams.get('lang') || 'es';
  const lang: Lang = (['es', 'en', 'fr', 'de', 'pl', 'zh', 'uk', 'ru'].includes(langQuery) ? langQuery : 'es') as Lang;
  const dict = translations[lang];

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
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light tracking-wider mb-2">{dict.title}</h1>
          <p className="text-gray-300 text-sm mb-4">{dict.subtitle}</p>
          <LanguageSelector currentLang={lang} />
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-between mb-6 bg-white/10 p-1 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('acceso')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'acceso' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock size={18} /> {dict.tab_access}
          </button>
          <button
            onClick={() => setActiveTab('llaves')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'llaves' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key size={18} /> {dict.tab_zones}
          </button>
          <button
            onClick={() => setActiveTab('parking')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'parking' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Car size={18} /> {dict.tab_parking}
          </button>
          <button
            onClick={() => setActiveTab('barrio')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeTab === 'barrio' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapIcon size={18} /> {dict.tab_neighborhood}
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          
          {/* ACCESO TAB */}
          {activeTab === 'acceso' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Botón Principal */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 mb-4 text-center">
                <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-1">{dict.portal_title}</h2>
                <p className="text-gray-300 text-sm mb-4">{dict.portal_desc}</p>
                <button className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl">
                  {dict.portal_btn}
                </button>
              </div>

              {/* Código Puerta */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 mb-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Key size={18} className="text-blue-400" /> {dict.code_title}
                </h3>
                <p className="text-gray-300 text-sm mb-3">{dict.code_desc}</p>
                <div className="bg-black/40 text-center py-3 rounded-xl font-mono text-xl tracking-widest text-blue-300">
                  XXXXXX
                </div>
              </div>

              {/* WiFi */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Wifi size={18} className="text-green-400" /> {dict.wifi_title}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                    <span className="text-gray-400 text-sm">{dict.wifi_network}</span>
                    <span className="font-medium">FitelFibra_2G_4168</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                    <span className="text-gray-400 text-sm">{dict.wifi_password}</span>
                    <button 
                      onClick={handleCopyWifi}
                      className="flex items-center gap-2 text-green-400 font-medium hover:text-green-300 transition-colors"
                    >
                      {copied ? <><CheckCircle2 size={16} /> {dict.wifi_copied}</> : <><Copy size={16} /> 86075541</>}
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
                <h3 className="font-semibold mb-2 text-lg">{dict.pool_title}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-gray-300 text-sm flex-1">{dict.pool_desc}</p>
                  <img 
                    src="/images/recursos/llave-piscina.jpeg" 
                    alt="Llave Piscina" 
                    className="w-20 h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-white/10 shadow-sm shrink-0"
                    onClick={() => setSelectedImage('/images/recursos/llave-piscina.jpeg')}
                  />
                </div>
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
                <h3 className="font-semibold mb-2 text-lg">{dict.back_door_title}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-gray-300 text-sm flex-1">{dict.back_door_desc}</p>
                  <img 
                    src="/images/recursos/llave-trasera.jpeg" 
                    alt="Llave Entrada Trasera" 
                    className="w-20 h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-white/10 shadow-sm shrink-0"
                    onClick={() => setSelectedImage('/images/recursos/llave-trasera.jpeg')}
                  />
                </div>
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

              {/* Enlace a normas comunitarias */}
              <div className="text-center mt-8 mb-4">
                <button 
                  onClick={() => setShowRules(true)}
                  className="font-semibold text-lg text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
                >
                  {dict.rules_link}
                </button>
              </div>
            </div>
          )}

          {/* PARKING TAB */}
          {activeTab === 'parking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
              <div className="bg-blue-500/20 backdrop-blur-md rounded-2xl p-5 border border-blue-500/30">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Car className="text-blue-400" /> {dict.parking_plaza}
                  </h3>
                  <a 
                    href="https://maps.app.goo.gl/2hpbBNMGsopa93T57?g_st=aw" 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    {dict.parking_nav} <ExternalLink size={14} />
                  </a>
                </div>
                <p className="text-blue-100 text-sm mb-4">
                  {dict.parking_warning}
                </p>
              </div>

              {/* Imágenes Parking */}
              <div className="flex gap-4 mb-2">
                <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <p className="text-xs text-gray-300 mb-2 text-center">Acceso (Mando)</p>
                  <img 
                    src="/images/recursos/parking-tag.jpeg" 
                    alt="Mando Garaje" 
                    className="w-full aspect-square object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                    onClick={() => setSelectedImage('/images/recursos/parking-tag.jpeg')}
                  />
                </div>
                <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <p className="text-xs text-gray-300 mb-2 text-center">Candado Barrera ( 0539 )</p>
                  <img 
                    src="/images/recursos/parking-candado.jpeg" 
                    alt="Candado Barrera" 
                    className="w-full aspect-square object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                    onClick={() => setSelectedImage('/images/recursos/parking-candado.jpeg')}
                  />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h3 className="font-semibold mb-2 text-lg">{dict.parking_to_apt_title}</h3>
                <p className="text-gray-300 text-sm mb-4">{dict.parking_to_apt_desc}</p>
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
                <h3 className="font-semibold mb-2 text-lg">{dict.parking_car_access_title}</h3>
                <p className="text-gray-300 text-sm mb-4">{dict.parking_car_access_desc}</p>
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
                <h3 className="font-semibold mb-4 text-lg">{dict.neighborhood_services}</h3>
                
                <div className="w-full rounded-xl border border-white/10 mb-6 overflow-hidden relative shadow-lg">
                  <div className="aspect-[4/3] w-full relative bg-gray-800">
                    <iframe 
                      src="https://www.google.com/maps/d/embed?mid=1Pn-oHu1aNBWlrYxbvHtwy4JC5lCIXjw" 
                      width="100%" 
                      height="100%" 
                      className="absolute inset-0 border-0"
                      title="Mapa de Servicios Cercanos"
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Supermercados & Farmacias */}
                  <div>
                    <h4 className="text-blue-300 font-medium mb-3 flex items-center gap-2">🛒 {dict.neighborhood_health}</h4>
                    <div className="space-y-2">
                      <a href="https://www.google.com/maps/search/?api=1&query=Supermercado+Consum+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Supermercado Consum</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Farmacia Fenals</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Blanca+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Farmacia Blanca</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=lavanderia+Av+Vila+de+Blanes+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">{dict.laundry}</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                    </div>
                  </div>

                  {/* Restaurantes */}
                  <div>
                    <h4 className="text-orange-300 font-medium mb-3 flex items-center gap-2">🥘 {dict.neighborhood_eat}</h4>
                    <div className="space-y-2">
                      <a href="https://www.google.com/maps/search/?api=1&query=L%27Arrosseria+de+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">L'Arrosseria de Fenals</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Planiol+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Restaurante Planiol</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=El+Jardi+Parrilla+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">El Jardí Parrilla</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Hay+Motivo+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Restaurante Hay Motivo</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Corsaro+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Pizzería Corsaro</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Ugolok+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Restaurante Ugolok</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Xurreria+La+Selva+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Xurreria La Selva</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=heladeria+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">{dict.ice_cream}</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                    </div>
                  </div>

                  {/* Turismo */}
                  <div>
                    <h4 className="text-green-300 font-medium mb-3 flex items-center gap-2">📸 {dict.neighborhood_see}</h4>
                    <div className="space-y-2">
                      <a href="https://www.google.com/maps/search/?api=1&query=Jardines+de+Santa+Clotilde+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Jardines de Santa Clotilde</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Cala+Boadella+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Cala Boadella</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Castell+de+Sant+Joan+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
                        <span className="font-medium text-sm">Castell de Sant Joan</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a href="https://www.google.com/maps/search/?api=1&query=Oficina+Turismo+Estacion+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-black/40 p-3 rounded-xl hover:bg-black/60 transition-colors">
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
      
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-200">
            <button 
              className="absolute -top-12 right-0 text-white/70 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              Cerrar ✕
            </button>
            <img 
              src={selectedImage} 
              alt="Ampliada" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Normas Comunitarias Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">{dict.rules_title}</h3>
            <div className="overflow-y-auto pr-2 space-y-3 flex-1 text-sm text-gray-300">
              {dict.rules_texts.map((rule, idx) => (
                <p key={idx}>• {rule}</p>
              ))}
            </div>
            <button 
              onClick={() => setShowRules(false)}
              className="mt-6 w-full bg-white text-gray-900 font-semibold py-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {dict.rules_close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <SandboxContent />
    </Suspense>
  );
}
