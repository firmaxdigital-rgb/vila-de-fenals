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
  const langs = ['es', 'en', 'fr', 'nl', 'de', 'pl', 'uk', 'ru', 'zh', 'ja'];
  
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

const docTypeTranslations = {
  es: { DNI: 'DNI (Español)', NIE: 'NIE (Español)', PASAPORTE: 'Pasaporte', OTRO: 'Otro Documento / ID Europeo (NO Español)' },
  en: { DNI: 'DNI (Spanish)', NIE: 'NIE (Spanish)', PASAPORTE: 'Passport', OTRO: 'Other Document / European ID (Non-Spanish)' },
  fr: { DNI: 'DNI (Espagnol)', NIE: 'NIE (Espagnol)', PASAPORTE: 'Passeport', OTRO: 'Autre document / ID européen (Non espagnol)' },
  de: { DNI: 'DNI (Spanisch)', NIE: 'NIE (Spanisch)', PASAPORTE: 'Reisepass', OTRO: 'Anderes Dokument / Europäischer Ausweis (Nicht spanisch)' },
  pl: { DNI: 'DNI (Hiszpański)', NIE: 'NIE (Hiszpański)', PASAPORTE: 'Paszport', OTRO: 'Inny document / Europejski dowód tożsamości (Niehiszpański)' },
  zh: { DNI: 'DNI (西班牙)', NIE: 'NIE (西班牙)', PASAPORTE: '护照', OTRO: '其他文件 / 欧洲身份证 (非西班牙)' },
  uk: { DNI: 'DNI (Іспанський)', NIE: 'NIE (Іспанський)', PASAPORTE: 'Паспорт', OTRO: 'Інший документ / Європейське посвідчення (Не іспанське)' },
  ru: { DNI: 'DNI (Испанский)', NIE: 'NIE (Испанский)', PASAPORTE: 'Паспорт', OTRO: 'Другой документ / Европейское удостоверение (Не испанское)' },
  nl: { DNI: 'DNI (Spaans)', NIE: 'NIE (Spaans)', PASAPORTE: 'Paspoort', OTRO: 'Ander document / Europees ID (Niet Spaans)' },
  ja: { DNI: 'DNI (スペイン)', NIE: 'NIE (スペイン)', PASAPORTE: 'パスポート', OTRO: 'その他の書類 / 欧州身分証 (非スペイン)' },
};

const supportHelperTranslations = {
  es: {
    btn_help: "¿Dónde encontrarlo?",
    title: "Número de Soporte",
    close: "Entendido",
    dni_title: "DNI (Español)",
    dni_desc: "Aparece en el anverso (cara delantera) como 'NUM SOPORT'. Consta de 3 letras y 6 números (ej. AAA123456).",
    nie_card_title: "NIE (Tarjeta física)",
    nie_card_desc: "Aparece en el anverso como 'NUM SOPORT'. Consta de la letra 'E' seguida de 8 números. Si tiene menos números, añada ceros a la izquierda (ej. E87654321).",
    nie_paper_title: "NIE (Certificado de papel)",
    nie_paper_desc: "Es el número de certificado del papel verde. Escriba la letra 'C' seguida del número. Si tiene menos de 8 números, añada ceros a la izquierda (ej. si es 1234567, escriba C01234567)."
  },
  en: {
    btn_help: "Where to find it?",
    title: "Support Number",
    close: "Got it",
    dni_title: "DNI (Spanish ID)",
    dni_desc: "Appears on the front as 'NUM SOPORT'. Consists of 3 letters and 6 numbers (e.g. AAA123456).",
    nie_card_title: "NIE (Physical Card)",
    nie_card_desc: "Appears on the front as 'NUM SOPORT'. Consists of the letter 'E' followed by 8 numbers. If it has fewer numbers, pad with zeros on the left (e.g. E87654321).",
    nie_paper_title: "NIE (Paper Certificate)",
    nie_paper_desc: "The certificate number from the green paper sheet. Write the letter 'C' followed by the number. If it has fewer than 8 numbers, pad with zeros on the left (e.g. C01234567)."
  },
  fr: {
    btn_help: "Où le trouver ?",
    title: "Numéro de support",
    close: "Compris",
    dni_title: "DNI (Carte d'identité espagnole)",
    dni_desc: "Apparaît sur le recto comme 'NUM SOPORT'. Composé de 3 lettres et 6 chiffres (ex. AAA123456).",
    nie_card_title: "NIE (Carte physique)",
    nie_card_desc: "Apparaît sur le recto comme 'NUM SOPORT'. Composé de la lettre 'E' suivie de 8 chiffres. S'il y a moins de chiffres, complétez avec des zéros à gauche (ex. E87654321).",
    nie_paper_title: "NIE (Certificat papier)",
    nie_paper_desc: "Le numéro de certificat de la feuille verte. Écrivez la lettre 'C' suivie du numéro. S'il comporte moins de 8 chiffres, complétez avec des zéros à gauche (ex. C01234567)."
  },
  de: {
    btn_help: "Wo zu finden?",
    title: "Support-Nummer",
    close: "Verstanden",
    dni_title: "DNI (Spanischer Ausweis)",
    dni_desc: "Befindet sich auf der Vorderseite als 'NUM SOPORT'. Besteht aus 3 Buchstaben und 6 Zahlen (z. B. AAA123456).",
    nie_card_title: "NIE (Physische Karte)",
    nie_card_desc: "Befindet sich auf der Vorderseite als 'NUM SOPORT'. Besteht aus dem Buchstaben 'E' gefolgt von 8 Zahlen. Bei weniger Zahlen links mit Nullen auffüllen (z. B. E87654321).",
    nie_paper_title: "NIE (Papierzertifikat)",
    nie_paper_desc: "Die Zertifikatsnummer auf dem grünen Papier. Schreiben Sie den Buchstaben 'C' gefolgt von der Nummer. Bei weniger als 8 Zahlen links mit Nullen auffüllen (z. B. C01234567)."
  },
  pl: {
    btn_help: "Gdzie to znaleźć?",
    title: "Numer nośnika (Support)",
    close: "Rozumiem",
    dni_title: "DNI (Hiszpański dowód)",
    dni_desc: "Widnieje na awersie jako 'NUM SOPORT'. Składa się z 3 liter i 6 cyfr (np. AAA123456).",
    nie_card_title: "NIE (Karta fizyczna)",
    nie_card_desc: "Widnieje na awersie jako 'NUM SOPORT'. Składa się z litery 'E' i 8 cyfr. Jeśli ma mniej cyfr, dodaj zera z lewej strony (np. E87654321).",
    nie_paper_title: "NIE (Certyfikat papierowy)",
    nie_paper_desc: "Numer certyfikatu z zielonej karty. Wpisz literę 'C' i numer. Jeśli ma mniej niż 8 cyfr, dodaj zera z lewej strony (np. C01234567)."
  },
  zh: {
    btn_help: "在哪里可以找到？",
    title: "支持号码 (Nº Soporte)",
    close: "明白",
    dni_title: "DNI (西班牙身份证)",
    dni_desc: "显示在正面，标记为 'NUM SOPORT'。由3个字母和6位数字组成 (例如 AAA123456)。",
    nie_card_title: "NIE (物理卡)",
    nie_card_desc: "显示在正面，标记为 'NUM SOPORT'。由字母 'E' 后跟8位数字组成。如果数字较少，请在左侧补零 (例如 E87654321)。",
    nie_paper_title: "NIE (纸质证书)",
    nie_paper_desc: "绿色纸质证书上的证书号。在号码前写上字母 'C'。如果少于8位数字，请在左侧补零 (例如 C01234567)。"
  },
  uk: {
    btn_help: "Де його знайти?",
    title: "Номер підтримки",
    close: "Зрозуміло",
    dni_title: "DNI (Іспанська ID-картка)",
    dni_desc: "Вказано на лицьовій стороні як 'NUM SOPORT'. Складається з 3 літер та 6 цифр (наприклад, AAA123456).",
    nie_card_title: "NIE (Фізична картка)",
    nie_card_desc: "Вказано на лицьовій стороні як 'NUM SOPORT'. Складається з літери 'E' та 8 цифр. Якщо цифр менше, додайте нулі ліворуч (наприклад, E87654321).",
    nie_paper_title: "NIE (Паперовий сертифікат)",
    nie_paper_desc: "Номер сертифіката на зеленому паперовому бланку. Напишіть літеру 'C' та номер. Якщо в ньому менше 8 цифр, додайте нулі ліворуч (наприклад, C01234567)."
  },
  ru: {
    btn_help: "Где его найти?",
    title: "Номер поддержки",
    close: "Понятно",
    dni_title: "DNI (Испанское удостоверение)",
    dni_desc: "Указан на лицевой стороне как 'NUM SOPORT'. Состоит из 3 букв и 6 цифр (например, AAA123456).",
    nie_card_title: "NIE (Физическая карта)",
    nie_card_desc: "Указан на лицевой стороне как 'NUM SOPORT'. Состоит из буквы 'E' и 8 цифр. Если цифр меньше, добавьте нули слева (например, E87654321).",
    nie_paper_title: "NIE (Бумажный сертификат)",
    nie_paper_desc: "Номер сертификата на зеленом бумажном бланке. Напишите букву 'C' и номер. Если в нем меньше 8 цифр, добавьте нули слева (например, C01234567)."
  },
  nl: {
    btn_help: "Waar te vinden?",
    title: "Supportnummer",
    close: "Begrepen",
    dni_title: "DNI (Spaans ID)",
    dni_desc: "Staat op de voorkant als 'NUM SOPORT'. Bestaat uit 3 letters en 6 cijfers (bijv. AAA123456).",
    nie_card_title: "NIE (Fysieke kaart)",
    nie_card_desc: "Staat op de voorkant als 'NUM SOPORT'. Bestaat uit de letter 'E' gevolgd door 8 cijfers. Als het minder cijfers heeft, voeg dan nullen aan de linkerkant toe (bijv. E87654321).",
    nie_paper_title: "NIE (Papieren certificaat)",
    nie_paper_desc: "Het certificaatnummer op het groene papier. Schrijf de letter 'C' gevolgd door het nummer. Als het minder dan 8 cijfers heeft, voeg dan nullen aan de linkerkant toe (bijv. C01234567)."
  },
  ja: {
    btn_help: "どこにありますか？",
    title: "サポート番号 (Nº Soporte)",
    close: "了解",
    dni_title: "DNI (スペイン身分証)",
    dni_desc: "表面に 'NUM SOPORT' として記載されています。3文字 of アルファベットと6桁の数字で構成されます (例: AAA123456)。",
    nie_card_title: "NIE (物理カード)",
    nie_card_desc: "表面に 'NUM SOPORT' として記載されています。アルファベットの 'E' と8桁の数字で構成されます。桁数が足りない場合は、左側に0を追加してください (例: E87654321)。",
    nie_paper_title: "NIE (紙の証明書)",
    nie_paper_desc: "緑色の紙の証明書に記載されている証明書番号です。アルファベットの 'C' に続けて番号を入力してください。8桁未満の場合は、左側に0を追加してください (例: C01234567)。"
  }
};

export default function RegistroViajeroPage({ params }: { params: { reservation_code: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'es') as Lang;
  const decodedCode = decodeURIComponent(params.reservation_code);

  const dict = translations[lang] || translations['es'];
  const docTypes = docTypeTranslations[lang] || docTypeTranslations['es'];
  const supportHelp = supportHelperTranslations[lang] || supportHelperTranslations['es'];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSupportHelp, setShowSupportHelp] = useState(false);
  const [error, setError] = useState('');

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showLegalTextModal, setShowLegalTextModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
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
    tipo_documento: 'OTRO',
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
              tipo_documento: traveler.tipo_documento || 'OTRO',
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

    // Instead of submitting immediately, launch the consent modal flow
    setShowTermsModal(true);
  };

  const performFinalSubmit = async () => {
    setIsSubmitting(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
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
          <h1 className="text-3xl font-light tracking-wider mb-2">VILA DE FENALS</h1>
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
                  <option value="DNI">{docTypes.DNI}</option>
                  <option value="NIE">{docTypes.NIE}</option>
                  <option value="PASAPORTE">{docTypes.PASAPORTE}</option>
                  <option value="OTRO">{docTypes.OTRO}</option>
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
                <div className="flex justify-between items-center h-4">
                  <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate">
                    {dict.form_support_number} {(formData.tipo_documento !== 'DNI' && formData.tipo_documento !== 'NIE') ? `(${lang === 'en' ? 'Opt.' : 'Opc.'})` : ''}
                  </label>
                  {(formData.tipo_documento === 'DNI' || formData.tipo_documento === 'NIE') && (
                    <button
                      type="button"
                      onClick={() => setShowSupportHelp(true)}
                      className="text-[9px] text-cyan-300 hover:text-cyan-100 hover:underline flex items-center gap-0.5 font-bold transition-all focus:outline-none shrink-0"
                    >
                      ❓ {supportHelp.btn_help}
                    </button>
                  )}
                </div>
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

      {/* ==========================================
          MODAL: NÚMERO DE SOPORTE HELPER MODAL
          ========================================== */}
      {showSupportHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in animate-in fade-in duration-200">
          <div className="bg-gray-950/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 shadow-2xl shadow-cyan-500/10 text-white space-y-4">
            <h3 className="text-base font-bold text-cyan-200 border-b border-white/10 pb-2 flex items-center gap-2">
              <span>📋</span> {supportHelp.title}
            </h3>
            
            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1 leading-relaxed">
              {formData.tipo_documento === 'DNI' ? (
                <div className="space-y-1.5 bg-white/5 border border-white/5 p-3 rounded-2xl">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>🪪</span> {supportHelp.dni_title}
                  </h4>
                  <p className="text-white/80 text-[11px]">{supportHelp.dni_desc}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 bg-white/5 border border-white/5 p-3 rounded-2xl">
                    <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>💳</span> {supportHelp.nie_card_title}
                    </h4>
                    <p className="text-white/80 text-[11px]">{supportHelp.nie_card_desc}</p>
                  </div>
                  <div className="space-y-1.5 bg-white/5 border border-white/5 p-3 rounded-2xl">
                    <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>📄</span> {supportHelp.nie_paper_title}
                    </h4>
                    <p className="text-white/80 text-[11px]">{supportHelp.nie_paper_desc}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-2">
              <button 
                type="button"
                onClick={() => setShowSupportHelp(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-cyan-950 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {supportHelp.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: LEGAL CONSENT POPUP (MAIN POPUP)
          ========================================== */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in animate-in fade-in duration-200">
          <div className="bg-gray-950/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 shadow-2xl shadow-cyan-500/10 text-white space-y-4">
            <h3 className="text-base font-bold text-cyan-200 border-b border-white/10 pb-2 flex items-center gap-2">
              <span>⚖️</span> {lang === 'en' ? 'Consent & Legal Terms' : 'Consentimiento y Términos'}
            </h3>
            
            <p className="text-xs text-white/80 leading-relaxed">
              {lang === 'en'
                ? 'To complete your traveler registration and enable key delivery, you must accept our policies.'
                : 'Para completar su registro de viajero y poder habilitar la entrega de llaves, es obligatorio que acepte nuestras políticas.'}
            </p>

            <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
              <input
                id="legal_checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:outline-none cursor-pointer mt-0.5"
              />
              <label htmlFor="legal_checkbox" className="text-xs text-white/95 cursor-pointer leading-relaxed">
                {lang === 'en' ? (
                  <>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setShowLegalTextModal(true)}
                      className="text-cyan-300 hover:text-cyan-100 underline font-bold focus:outline-none"
                    >
                      Conditions of Use and Privacy Policy
                    </button>{' '}
                    of Vila de Fenals.
                  </>
                ) : (
                  <>
                    Acepto las{' '}
                    <button
                      type="button"
                      onClick={() => setShowLegalTextModal(true)}
                      className="text-cyan-300 hover:text-cyan-100 underline font-bold focus:outline-none"
                    >
                      Condiciones de Uso y la Política de Privacidad
                    </button>{' '}
                    de Vila de Fenals.
                  </>
                )}
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setShowTermsModal(false);
                  setTermsAccepted(false);
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all active:scale-95"
              >
                {lang === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              
              <button 
                type="button"
                disabled={!termsAccepted || isSubmitting}
                onClick={async () => {
                  setShowTermsModal(false);
                  await performFinalSubmit();
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-950 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {isSubmitting ? (lang === 'en' ? 'Sending...' : 'Enviando...') : (lang === 'en' ? 'Confirm & Send' : 'Confirmar y Enviar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: LEGAL TERMS FULL TEXT (SECOND POPUP)
          ========================================== */}
      {showLegalTextModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in animate-in fade-in duration-200">
          <div className="bg-gray-950 border border-white/15 rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl shadow-cyan-500/15 text-white space-y-4">
            <h3 className="text-base font-bold text-cyan-200 border-b border-white/10 pb-2 flex items-center gap-2">
              <span>📋</span> {lang === 'en' ? 'Conditions of Use & Privacy Policy' : 'Condiciones de Uso y Política de Privacidad'}
            </h3>
            
            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2 leading-relaxed text-white/90">
              {lang === 'en' ? (
                <>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">1. Mandatory Registration (RD 933/2021)</h4>
                    <p>In compliance with Spanish Royal Decree 933/2021, all guests over 14 years old are legally required to provide true identity details for the official documentary registration of lodging activities before competent authorities.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">2. Data Retention for Legal Compliance</h4>
                    <p>Your personal data (including name, ID document, address, and signature) will be stored securely for the sole purpose of complying with the official registration before the Law Enforcement Agencies (Mossos d\'Esquadra). This data will be kept under strict security measures for the legally required period of 3 years, after which it will be completely deleted.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">3. Commercial Communications Consent</h4>
                    <p>By accepting these conditions, you expressly authorize <strong>Vila de Fenals</strong> to retain your basic contact details (name and email) to send you exclusive offers and personalized promotions about our properties in the future. We will never share this information with any third parties.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">4. No Disclosure to Third Parties</h4>
                    <p>We firmly commit to <strong>never selling, renting, transferring, or sharing</strong> your personal data with any company or third party outside Vila de Fenals, except under mandatory request from police or judicial authorities.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">5. Privacy Rights</h4>
                    <p>You may exercise your rights of access, rectification, erasure, limitation, and opposition at any time by contacting the host directly.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">1. Obligatoriedad del Registro (RD 933/2021)</h4>
                    <p>En cumplimiento del Real Decreto 933/2021, de 26 de octubre, todos los huéspedes mayores de 14 años están legalmente obligados a facilitar sus datos de identidad de forma veraz para el registro de hospedajes ante las autoridades competentes.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">2. Conservación con Fines Legales</h4>
                    <p>Sus datos personales (incluyendo nombre, documento de identidad, dirección y firma) se conservarán de forma segura con la única finalidad de dar cumplimiento al registro oficial ante las Fuerzas y Cuerpos de Seguridad del Estado (Mossos d\'Esquadra). Estos datos serán almacenados bajo estrictas medidas de seguridad durante el plazo legal de 3 años, tras el cual se procederá a su completa destrucción.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">3. Autorización Comercial (Ofertas Personalizadas)</h4>
                    <p>Al aceptar estas condiciones, usted autoriza expresamente a <strong>Vila de Fenals</strong> a conservar sus datos de contacto básicos (nombre y correo electrónico) para informarle en el futuro de ofertas exclusivas y promociones personalizadas sobre nuestros alojamientos, sin compartir sus datos con terceros.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">4. No Cesión a Terceros</h4>
                    <p>Nos comprometemos firmemente a <strong>no vender, alquilar, ceder ni compartir</strong> sus datos personales con ninguna empresa o tercero ajeno a Vila de Fenals, salvo por requerimiento obligatorio de las autoridades policiales o judiciales.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-cyan-300">5. Derechos ARCO</h4>
                    <p>En cualquier momento puede ejercer sus derechos de acceso, rectificación, supresión, limitación y oposición enviando una solicitud directa al anfitrión.</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-2">
              <button 
                type="button"
                onClick={() => setShowLegalTextModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-cyan-950 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {lang === 'en' ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
