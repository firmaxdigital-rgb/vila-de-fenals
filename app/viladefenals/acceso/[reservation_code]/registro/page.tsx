'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, FileText, CheckCircle2, AlertCircle, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { translations, Lang } from '../i18n';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const countries = [
  { code: 'ES', nameEs: 'España', nameEn: 'Spain' },
  { code: 'FR', nameEs: 'Francia', nameEn: 'France' },
  { code: 'DE', nameEs: 'Alemania', nameEn: 'Germany' },
  { code: 'GB', nameEs: 'Reino Unido', nameEn: 'United Kingdom' },
  { code: 'IT', nameEs: 'Italia', nameEn: 'Italy' },
  { code: 'US', nameEs: 'Estados Unidos', nameEn: 'United States' },
  { code: 'PT', nameEs: 'Portugal', nameEn: 'Portugal' },
  { code: 'BE', nameEs: 'Bélgica', nameEn: 'Belgium' },
  { code: 'NL', nameEs: 'Países Bajos', nameEn: 'Netherlands' },
  { code: 'CH', nameEs: 'Suiza', nameEn: 'Switzerland' },
  { code: 'AD', nameEs: 'Andorra', nameEn: 'Andorra' },
  { code: 'AR', nameEs: 'Argentina', nameEn: 'Argentina' },
  { code: 'AT', nameEs: 'Austria', nameEn: 'Austria' },
  { code: 'AU', nameEs: 'Australia', nameEn: 'Australia' },
  { code: 'BR', nameEs: 'Brasil', nameEn: 'Brazil' },
  { code: 'CA', nameEs: 'Canadá', nameEn: 'Canada' },
  { code: 'CL', nameEs: 'Chile', nameEn: 'Chile' },
  { code: 'CN', nameEs: 'China', nameEn: 'China' },
  { code: 'CO', nameEs: 'Colombia', nameEn: 'Colombia' },
  { code: 'DK', nameEs: 'Dinamarca', nameEn: 'Denmark' },
  { code: 'IE', nameEs: 'Irlanda', nameEn: 'Ireland' },
  { code: 'MX', nameEs: 'México', nameEn: 'Mexico' },
  { code: 'NO', nameEs: 'Noruega', nameEn: 'Norway' },
  { code: 'PL', nameEs: 'Polonia', nameEn: 'Poland' },
  { code: 'SE', nameEs: 'Suecia', nameEn: 'Sweden' },
  { code: 'UY', nameEs: 'Uruguay', nameEn: 'Uruguay' },
  { code: 'VE', nameEs: 'Venezuela', nameEn: 'Venezuela' }
].sort((a, b) => a.nameEs.localeCompare(b.nameEs));

const uploadBtnTranslations: Record<string, { search: string; take: string }> = {
  es: { search: 'Buscar Archivos', take: 'Hacer Foto' },
  en: { search: 'Search Files', take: 'Take Photo' },
  fr: { search: 'Chercher des fichiers', take: 'Prendre une photo' },
  de: { search: 'Dateien durchsuchen', take: 'Foto aufnehmen' },
  pl: { search: 'Wyszukaj pliki', take: 'Zrób zdjęcie' },
  zh: { search: '浏览文件', take: '拍照' },
  uk: { search: 'Шукати файли', take: 'Зробити фото' },
  ru: { search: 'Поиск файлов', take: 'Сделать фото' },
  nl: { search: 'Bestanden Zoeken', take: 'Foto Maken' },
  ja: { search: 'ファイルを選択', take: '写真を撮影' }
};

function LanguageSelector({ currentLang, editId }: { currentLang: string; editId: string | null }) {
  const router = useRouter();
  const langs = ['es', 'en', 'fr', 'de', 'pl', 'zh', 'uk', 'ru', 'nl', 'ja'];
  
  const handleLangChange = (newLang: string) => {
    const params = new URLSearchParams();
    params.set('lang', newLang);
    if (editId) {
      params.set('edit_id', editId);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 w-fit mx-auto">
      {langs.map((l) => (
        <button 
          key={l} 
          type="button"
          onClick={() => handleLangChange(l)}
          className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${currentLang === l ? 'text-white drop-shadow-md' : 'text-white/50 hover:text-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

interface AdultCandidate {
  id: string;
  nombre: string;
  apellidos: string;
}

export default function RegistroViajeroPage({ params }: { params: { reservation_code: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'es') as Lang;
  const decodedCode = decodeURIComponent(params.reservation_code);

  const dict = translations[lang] || translations['es'];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // OCR processing states
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; base64: string; mimeType: string }[]>([]);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Registered adults candidates list for minors
  const [adultsList, setAdultsList] = useState<AdultCandidate[]>([]);
  const [totalGuests, setTotalGuests] = useState<number>(2);
  const timeLabels: Record<string, { checkin: string; checkout: string }> = {
    es: { checkin: 'Hora estimada de llegada (Entrada)', checkout: 'Hora estimada de salida (Salida)' },
    en: { checkin: 'Estimated Arrival (Check-in)', checkout: 'Estimated Departure (Check-out)' },
    fr: { checkin: "Heure d'arrivée estimée (Check-in)", checkout: 'Heure de départ estimée (Check-out)' },
    de: { checkin: 'Voraussichtliche Ankunftszeit (Check-in)', checkout: 'Voraussichtliche Abreisezeit (Check-out)' },
    pl: { checkin: 'Planowana godzina przyjazdu (Check-in)', checkout: 'Planowana godzina wyjazdu (Check-out)' },
    zh: { checkin: '预计抵达时间 (入住)', checkout: '预计离店时间 (退房)' },
    uk: { checkin: 'Очікуваний час прибуття (Заїзд)', checkout: 'Очікуваний час виїзду (Виїзд)' },
    ru: { checkin: 'Ожидаемое время прибытия (Заезд)', checkout: 'Ожидаемое время выезда (Выезд)' }
  };
  const currentLabels = timeLabels[lang] || timeLabels['es'];

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    segundo_apellido: '',
    numero_soporte: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    fecha_expedicion: '',
    fecha_caducidad: '',
    fecha_nacimiento: '',
    sexo: 'M',
    nacionalidad: 'ES',
    // Manual required fields (RD 933/2021)
    direccion: '',
    codigo_postal: '',
    municipio: '',
    provincia: '',
    pais_residencia: 'ES',
    telefono: '',
    email: '',
    // Minors fields
    parentesco: '',
    adulto_responsable_id: '',
    // Extra custom fields
    relacion_viajeros: 'Family',
    firma_menor_16: false,
    hora_entrada: '16:00',
    hora_salida: '10:00',
  });

  // Calculate guest age based on birthdate
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge >= 0 ? calculatedAge : 0);
    } else {
      setAge(null);
    }
  }, [formData.fecha_nacimiento]);

  // Automatically precheck and update firma_menor_16 for guests under 16
  useEffect(() => {
    if (age !== null && age < 16) {
      setFormData(prev => ({ ...prev, firma_menor_16: true }));
    } else {
      setFormData(prev => ({ ...prev, firma_menor_16: false }));
    }
  }, [age]);

  // Load existing registered adults under this reservation
  useEffect(() => {
    async function loadAdults() {
      try {
        const res = await fetch(`/api/travelers?reservation_code=${encodeURIComponent(decodedCode)}`);
        const data = await res.json();
        if (res.ok && data.success && data.travelers) {
          // Filter for travelers >= 18 years old
          const candidates = data.travelers
            .filter((t: any) => {
              if (!t.fecha_nacimiento) return true;
              const birthDate = new Date(t.fecha_nacimiento);
              const today = new Date();
              let tAge = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                tAge--;
              }
              return tAge >= 18;
            })
            .map((t: any) => ({
              id: t.id,
              nombre: t.nombre,
              apellidos: t.apellidos
            }));
          setAdultsList(candidates);
        }
      } catch (err) {
        console.error("Error loading adult candidates:", err);
      }
    }
    async function loadReservation() {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('total_guests')
          .eq('reservation_code', decodedCode)
          .single();
        if (!error && data) {
          setTotalGuests(data.total_guests || 2);
        }
      } catch (err) {
        console.error("Error loading reservation details:", err);
      }
    }
    loadAdults();
    loadReservation();
  }, [decodedCode]);

  // Load existing traveler data if in EDIT mode (edit_id query parameter is present)
  const editId = searchParams.get('edit_id');

  useEffect(() => {
    if (!editId) return;

    async function loadEditTraveler() {
      try {
        const res = await fetch(`/api/travelers?reservation_code=${encodeURIComponent(decodedCode)}`);
        const data = await res.json();
        if (res.ok && data.success && data.travelers) {
          const traveler = data.travelers.find((t: any) => t.id === editId);
          if (traveler) {
            setFormData({
              nombre: traveler.nombre || '',
              apellidos: traveler.apellidos || '',
              segundo_apellido: traveler.segundo_apellido || '',
              numero_soporte: traveler.numero_soporte || '',
              tipo_documento: traveler.tipo_documento || 'DNI',
              numero_documento: traveler.numero_documento || '',
              fecha_expedicion: traveler.fecha_expedicion || '',
              fecha_caducidad: traveler.fecha_caducidad || '',
              fecha_nacimiento: traveler.fecha_nacimiento || '',
              sexo: traveler.sexo || 'M',
              nacionalidad: traveler.nacionalidad || 'ES',
              direccion: traveler.direccion || '',
              codigo_postal: traveler.codigo_postal || '',
              municipio: traveler.municipio || '',
              provincia: traveler.provincia || '',
              pais_residencia: traveler.pais_residencia || 'ES',
              telefono: traveler.telefono || '',
              email: traveler.email || '',
              parentesco: traveler.parentesco || '',
              adulto_responsable_id: traveler.adulto_responsable_id || '',
              relacion_viajeros: traveler.relacion_viajeros || 'Family',
              firma_menor_16: traveler.firma_menor_16 || false,
              hora_entrada: traveler.hora_entrada || '16:00',
              hora_salida: traveler.hora_salida || '10:00',
            });

            // Pre-load digital signature on canvas
            if (traveler.firma && canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                };
                img.src = traveler.firma;
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading traveler for editing:", err);
      }
    }

    loadEditTraveler();
  }, [editId, decodedCode, success]);

  // Setup signature canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ffffff'; // White stroke
      }
    }
  }, [success]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
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
    e.preventDefault();
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

  // Client-side image compression & downscaling
  const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = (err) => reject(err);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onerror = (err) => reject(err);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ base64: event.target?.result as string, mimeType: file.type });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          resolve({ base64: compressedBase64, mimeType: 'image/jpeg' });
        };
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Process files helper with compression
  const processFiles = (files: FileList) => {
    if (uploadedFiles.length + files.length > 3) {
      setError(lang === 'en' ? 'Only a maximum of 3 document images are allowed.' : 'Solo se permite subir un máximo de 3 imágenes de documentos.');
      return;
    }

    setError('');
    
    Array.from(files).forEach(async (file) => {
      // Validate format
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError(lang === 'en' ? 'Only images (PNG, JPG, JPEG) or PDF files are allowed.' : 'Solo se permiten imágenes (PNG, JPG, JPEG) o archivos PDF.');
        return;
      }

      if (file.type.startsWith('image/')) {
        try {
          const { base64, mimeType } = await compressImage(file);
          setUploadedFiles(prev => [
            ...prev,
            {
              name: file.name,
              base64,
              mimeType
            }
          ]);
        } catch (err) {
          console.error("Error compressing image:", err);
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => {
            setUploadedFiles(prev => [
              ...prev,
              {
                name: file.name,
                base64: reader.result as string,
                mimeType: file.type
              }
            ]);
          };
        }
      } else {
        // PDF fallback
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          setUploadedFiles(prev => [
            ...prev,
            {
              name: file.name,
              base64: reader.result as string,
              mimeType: file.type
            }
          ]);
        };
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  // Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Trigger Google Cloud Vertex AI Multimodal OCR scan
  const handleTriggerOcr = async () => {
    if (uploadedFiles.length === 0) {
      setError(lang === 'en' ? 'Please upload at least one document image.' : 'Por favor, añada al menos una imagen de su documento.');
      return;
    }

    setIsOcrProcessing(true);
    setOcrSuccess(false);
    setError('');

    try {
      const payloadFiles = uploadedFiles.map(f => ({
        data: f.base64,
        mimeType: f.mimeType
      }));

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payloadFiles })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el escaneo inteligente.');
      }

      const parsed = data.data;
      
      // Update form values with extracted details
      setFormData(prev => ({
        ...prev,
        nombre: parsed.nombre || prev.nombre,
        apellidos: parsed.apellidos || prev.apellidos,
        segundo_apellido: parsed.segundo_apellido || prev.segundo_apellido,
        tipo_documento: parsed.tipo_documento || prev.tipo_documento,
        numero_documento: parsed.numero_documento || prev.numero_documento,
        numero_soporte: parsed.numero_soporte || prev.numero_soporte,
        fecha_expedicion: parsed.fecha_expedicion || prev.fecha_expedicion,
        fecha_caducidad: parsed.fecha_caducidad || prev.fecha_caducidad,
        fecha_nacimiento: parsed.fecha_nacimiento || prev.fecha_nacimiento,
        sexo: parsed.sexo || prev.sexo,
        nacionalidad: parsed.nacionalidad ? parsed.nacionalidad.substring(0, 2).toUpperCase() : prev.nacionalidad,
      }));

      setOcrSuccess(true);
      setTimeout(() => setOcrSuccess(false), 5000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión con la IA de Vertex.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check age logic limits
    const isUnder14 = age !== null && age < 14;
    const isUnder18 = age !== null && age < 18;

    // Validate DNI requirement
    if (!isUnder14 && !formData.numero_documento) {
      setError(lang === 'en' ? 'Document number is mandatory for guests older than 14.' : 'El número de documento es obligatorio para mayores de 14 años.');
      return;
    }

    // Validate Second Surname for DNI (mandatory if DNI)
    if (formData.tipo_documento === 'DNI' && !isUnder14 && !formData.segundo_apellido) {
      setError(lang === 'en' ? 'Second surname is mandatory for document type DNI/NIF.' : 'El segundo apellido es obligatorio para el tipo de documento DNI/NIF.');
      return;
    }

    // Validate Support Number for DNI or NIE
    if ((formData.tipo_documento === 'DNI' || formData.tipo_documento === 'NIE') && !isUnder14 && !formData.numero_soporte) {
      setError(lang === 'en' ? 'Document support number (NUM SOPORT) is mandatory for DNI or NIE.' : 'El número de soporte del documento (NUM SOPORT) es obligatorio para tipo DNI o NIE.');
      return;
    }

    // Validate Minor parent links
    if (isUnder18) {
      if (!formData.parentesco) {
        setError(lang === 'en' ? 'Relationship status is mandatory for guests under 18.' : 'El Grado de Parentesco es obligatorio para menores de 18 años.');
        return;
      }
      if (!formData.adulto_responsable_id) {
        setError(lang === 'en' ? 'You must select a registered adult responsible for the minor.' : 'Debe seleccionar un adulto registrado como responsable del menor.');
        return;
      }
    }

    // Validate residency/contact for adults
    if (!isUnder18) {
      if (
        !formData.direccion || 
        !formData.codigo_postal || 
        !formData.municipio || 
        !formData.pais_residencia || 
        !formData.telefono || 
        !formData.email
      ) {
        setError(lang === 'en' ? 'For adults, contact and residence address details are mandatory.' : 'Para adultos, todos los campos de dirección de contacto y residencia son obligatorios.');
        return;
      }

      // Province validation (Mandatory for Spain residents)
      if (formData.pais_residencia === 'ES' && !formData.provincia) {
        setError(lang === 'en' ? 'Province is mandatory for residents in Spain.' : 'La provincia es obligatoria para residentes en España.');
        return;
      }
    }

    // Canvas Signature check
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(ctx!.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const isCanvasBlank = !pixelBuffer.some(color => color !== 0);

    if (isCanvasBlank) {
      setError(lang === 'en' ? 'Traveler digital signature is strictly mandatory.' : 'La firma digital del viajero es totalmente obligatoria.');
      return;
    }

    setIsSubmitting(true);
    const signatureBase64 = canvas.toDataURL('image/png');

    try {
      const res = await fetch('/api/travelers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId || undefined,
          reservation_code: decodedCode,
          ...formData,
          firma: signatureBase64
        })
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Error al guardar el viajero.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/viladefenals/acceso/${decodedCode}?lang=${lang}`);
        router.refresh();
      }, 3500);

    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative text-white font-sans">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img
            src="/images/IMG_0566.JPG"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.3)] p-8 text-center text-white space-y-4 animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-light tracking-wide">{dict.success_title}</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            {dict.success_desc} <strong>{formData.nombre} {formData.apellidos}</strong>.
          </p>
          <p className="text-white/60 text-xs animate-pulse">
            {dict.success_redirect}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans relative pb-20">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img
          src="/images/IMG_0566.JPG"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-20 max-w-xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light tracking-wider mb-2">Vila de Fenals</h1>
          <LanguageSelector currentLang={lang} editId={editId} />
        </div>

        <div className="relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-6 md:p-8 animate-fade-in">
        
        {/* Header and Back navigation */}
        <div className="flex items-center gap-2 mb-4">
          <button 
            type="button" 
            onClick={() => router.push(`/viladefenals/acceso/${decodedCode}?lang=${lang}`)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all shrink-0 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-white drop-shadow-md">{dict.reg_title}</h1>
            <p className="text-[10px] text-cyan-200 uppercase tracking-widest font-bold">
              {dict.reg_subtitle} | {lang === 'en' ? `Total travelers: ${totalGuests}` : `Total viajeros: ${totalGuests}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6 text-red-100 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================
            SECTION A: DRAG & DROP & MOBILE CAMERA SCANNING ZONE
            ====================================================== */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-6 space-y-4 shadow-lg shadow-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/10 text-white/80">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{dict.ocr_title}</h3>
              <p className="text-[10px] text-white/60">{dict.ocr_desc}</p>
            </div>
          </div>

          {/* Interactive Dotted Drag Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
              isDragging 
                ? 'border-white bg-white/20 scale-[1.01] shadow-[0_0_25px_rgba(255,255,255,0.15)]' 
                : 'border-white/20 hover:border-white/45 bg-white/5 hover:bg-white/10'
            }`}
          >
            <Camera size={32} className="text-white/60 mb-2.5" />
            
            <span className="text-xs text-white/90 font-medium px-4 mb-3 leading-relaxed">
              {dict.ocr_drop_zone}
            </span>
            <span className="text-[9px] text-white/40 mb-4">{dict.ocr_formats}</span>

            {/* Hidden native inputs */}
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/*,application/pdf" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              accept="image/*" 
              capture="environment" 
              onChange={handleCameraCapture} 
              className="hidden" 
            />

            {/* Dual premium explicit action buttons */}
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 text-center"
              >
                📁 {uploadBtnTranslations[lang]?.search || 'Buscar Archivos'}
              </button>
              
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 text-white font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 text-center"
              >
                📸 {uploadBtnTranslations[lang]?.take || 'Hacer Foto'}
              </button>
            </div>
          </div>

          {/* List of uploaded files to process */}
          <div className="space-y-2">
            {uploadedFiles.length === 0 ? (
              <div className="py-3 flex items-center justify-center text-xs text-white/30 border border-white/5 rounded-xl bg-black/10">
                {dict.ocr_no_files}
              </div>
            ) : (
              <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/45 border border-white/10 rounded-xl p-2.5 text-xs text-white animate-fade-in">
                    <span className="truncate max-w-[170px] flex items-center gap-2">
                      <FileText size={14} className="text-white/80 shrink-0" />
                      {file.name}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => removeUploadedFile(idx)} 
                      className="text-white/45 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trigger Scan button */}
          {uploadedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleTriggerOcr}
              disabled={isOcrProcessing}
              className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait active:scale-98"
            >
              {isOcrProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{dict.ocr_scanning}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{dict.ocr_scan_btn}</span>
                </>
              )}
            </button>
          )}

          {ocrSuccess && (
            <div className="bg-white/15 border border-white/25 rounded-xl p-2.5 text-white text-[10px] text-center font-semibold animate-pulse">
              ✓ {dict.ocr_success}
            </div>
          )}
        </div>

        {/* ======================================================
            SECTION B: INDIVIDUAL REGISTRATION FORM
            ====================================================== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-1.5 flex justify-between">
              <span>{dict.form_section_doc}</span>
              {age !== null && <span className="text-white/80 normal-case">{age} {lang === 'en' ? 'years old' : 'años'}</span>}
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_name}</label>
                <input required name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="Juan" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_surnames}</label>
                <input required name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="Pérez" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {dict.form_second_surname} {formData.tipo_documento !== 'DNI' ? `(${lang === 'en' ? 'Opt.' : 'Opc.'})` : ''}
                </label>
                <input name="segundo_apellido" required={formData.tipo_documento === 'DNI' && (age === null || age >= 14)} value={formData.segundo_apellido} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="García" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_doc_type}</label>
                <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-gray-900">
                  <option value="DNI">DNI (Español)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="NIE">NIE / Extranjero</option>
                  <option value="OTRO">Otro Documento</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {dict.form_doc_num} {age !== null && age < 14 ? `(${lang === 'en' ? 'Minor' : 'Menor'})` : ''}
                </label>
                <input 
                  required={age === null || age >= 14} 
                  name="numero_documento" 
                  value={formData.numero_documento} 
                  onChange={handleChange} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 uppercase tracking-wider" 
                  placeholder="Ej. 12345678A"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {dict.form_support_number} {(formData.tipo_documento !== 'DNI' && formData.tipo_documento !== 'NIE') ? `(${lang === 'en' ? 'Opt.' : 'Opc.'})` : ''}
                </label>
                <input 
                  disabled={formData.tipo_documento !== 'DNI' && formData.tipo_documento !== 'NIE'}
                  required={(formData.tipo_documento === 'DNI' || formData.tipo_documento === 'NIE') && (age === null || age >= 14)} 
                  name="numero_soporte" 
                  value={formData.tipo_documento !== 'DNI' && formData.tipo_documento !== 'NIE' ? '' : formData.numero_soporte} 
                  onChange={handleChange} 
                  className="w-full bg-black/40 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 uppercase tracking-wider" 
                  placeholder={formData.tipo_documento !== 'DNI' && formData.tipo_documento !== 'NIE' ? 'N/A' : 'Ej. AAA123456'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_exp_date}</label>
                <input type="date" name="fecha_expedicion" value={formData.fecha_expedicion} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [color-scheme:dark]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_cad_date || 'F. Caducidad'}</label>
                <input type="date" name="fecha_caducidad" value={formData.fecha_caducidad} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [color-scheme:dark]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_birth_date}</label>
                <input required type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [color-scheme:dark]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_nationality}</label>
                <select 
                  required 
                  name="nacionalidad" 
                  value={formData.nacionalidad} 
                  onChange={handleChange} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-gray-900"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {lang === 'en' ? c.nameEn : c.nameEs} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">{dict.form_gender}</label>
                <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-gray-900">
                  <option value="M">{dict.form_gender_m}</option>
                  <option value="F">{dict.form_gender_f}</option>
                </select>
              </div>
              <div className="space-y-1">
                {/* Empty slot for symmetry */}
              </div>
            </div>
          </div>

          {/* ======================================================
              SECTION C-1: MINOR PARENT LINK (Conditional on minor age < 18)
              ====================================================== */}
          {age !== null && age < 18 && (
            <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-yellow-300">
                <AlertCircle size={14} className="shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">{dict.minor_header}</h4>
              </div>
              <p className="text-[10px] text-white/60 leading-relaxed">
                {dict.minor_desc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-yellow-100 uppercase tracking-wider font-semibold">{dict.minor_parentesco}</label>
                  <select required name="parentesco" value={formData.parentesco} onChange={handleChange} className="w-full bg-black/40 border border-yellow-500/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-yellow-400 [&>option]:bg-gray-900">
                    <option value="">{dict.minor_parentesco_select}</option>
                    <option value="Hijo/a">Hijo / Hija</option>
                    <option value="Tutorado/a">Tutorado / Tutorada</option>
                    <option value="Hermano/a">Hermano / Hermana</option>
                    <option value="Otro">Otro grado familiar</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-yellow-100 uppercase tracking-wider font-semibold">{dict.minor_adult_resp}</label>
                  <select required name="adulto_responsable_id" value={formData.adulto_responsable_id} onChange={handleChange} className="w-full bg-black/40 border border-yellow-500/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-yellow-400 [&>option]:bg-gray-900">
                    <option value="">{dict.minor_adult_select}</option>
                    {adultsList.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre} {a.apellidos}</option>
                    ))}
                  </select>
                  {adultsList.length === 0 && (
                    <p className="text-[8px] text-red-300 mt-1">
                      {dict.minor_adult_err}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              SECTION D: MANUAL REQUIRED RESIDENCY & CONTACT
              ====================================================== */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-1.5">
              {dict.form_section_contact}
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_address}</label>
              <input required name="direccion" value={formData.direccion} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="Ej. Calle Gran Vía 12, 3º B" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_cp}</label>
                <input required name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="E.g. 08001" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_city}</label>
                <input required name="municipio" value={formData.municipio} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="Ej. Barcelona" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {dict.form_province} {formData.pais_residencia !== 'ES' ? `(${lang === 'en' ? 'Opt.' : 'Opc.'})` : ''}
                </label>
                <input 
                  required={formData.pais_residencia === 'ES'} 
                  name="provincia" 
                  value={formData.provincia} 
                  onChange={handleChange} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" 
                  placeholder="Ej. Barcelona" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_country}</label>
                <select 
                  required 
                  name="pais_residencia" 
                  value={formData.pais_residencia} 
                  onChange={handleChange} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-gray-900"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {lang === 'en' ? c.nameEn : c.nameEs} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {lang === 'en' ? 'Kinship / Relation' : 'Relación viajeros'}
                </label>
                <select 
                  required 
                  name="relacion_viajeros" 
                  value={formData.relacion_viajeros} 
                  onChange={handleChange} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-gray-900"
                >
                  <option value="Family">{lang === 'en' ? 'Family' : 'Familia'}</option>
                  <option value="Friends">{lang === 'en' ? 'Friends / Group' : 'Amigos / Grupo'}</option>
                  <option value="Business">{lang === 'en' ? 'Business' : 'Trabajo / Empresa'}</option>
                  <option value="Individual">{lang === 'en' ? 'Individual' : 'Individual'}</option>
                  <option value="Other">{lang === 'en' ? 'Other' : 'Otro'}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_phone}</label>
                <input required name="telefono" value={formData.telefono} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="Ej. +34600112233" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_email}</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" placeholder="ejemplo@correo.com" />
            </div>
          </div>

          {/* ======================================================
              SECTION E: TRAVELER TOUCH SIGNATURE
              ====================================================== */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.sig_title}</label>
              <button type="button" onClick={clearSignature} className="text-xs text-white/60 hover:text-white transition-colors uppercase tracking-widest font-bold">
                {dict.sig_clear}
              </button>
            </div>

            {age !== null && age < 16 && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <input 
                    type="checkbox" 
                    id="firma_menor_16" 
                    name="firma_menor_16" 
                    checked={formData.firma_menor_16} 
                    onChange={(e) => setFormData(prev => ({ ...prev, firma_menor_16: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/10 text-white focus:ring-white/20 bg-black/40 cursor-pointer shrink-0"
                  />
                  <label htmlFor="firma_menor_16" className="text-xs text-white/90 cursor-pointer select-none">
                    {lang === 'en' 
                      ? 'Signature on behalf of a minor under 16 years of age' 
                      : 'Firma en nombre de un menor de 16 años'}
                  </label>
                </div>
                
                {formData.firma_menor_16 && (
                  <div className="space-y-1 p-2.5 rounded-xl bg-white/5 border border-white/10 animate-fade-in">
                    <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                      {lang === 'en' ? 'Adult signing on behalf' : 'Adulto que firma en su nombre'}
                    </label>
                    <select 
                      required={formData.firma_menor_16} 
                      name="adulto_responsable_id" 
                      value={formData.adulto_responsable_id} 
                      onChange={handleChange} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-gray-900"
                    >
                      <option value="">{dict.minor_adult_select}</option>
                      {adultsList.map((a) => (
                        <option key={a.id} value={a.id}>{a.nombre} {a.apellidos}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden touch-none relative shadow-inner">
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
            <p className="text-[9px] text-white/40 leading-tight">
              {dict.sig_desc}
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting || isOcrProcessing || (age !== null && age < 18 && adultsList.length === 0)}
            className="w-full mt-6 py-4 px-6 rounded-xl bg-white hover:bg-gray-150 text-gray-900 font-semibold text-base transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider active:scale-99"
          >
            {isSubmitting ? dict.btn_submitting : dict.btn_submit}
          </button>
          
          <div className="text-center mt-3">
             <button 
              type="button" 
              onClick={() => router.push(`/viladefenals/acceso/${decodedCode}?lang=${lang}`)}
              className="text-white/40 text-xs hover:text-white transition-colors"
             >
               {dict.btn_cancel}
             </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}
