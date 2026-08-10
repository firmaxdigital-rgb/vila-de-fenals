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

import { COUNTRIES as rawCountries } from '../../../../../lib/countries';
const getSortedCountries = (lang: string) => {
  let displayNames: Intl.DisplayNames;
  try {
    displayNames = new Intl.DisplayNames([lang], { type: 'region' });
  } catch (e) {
    displayNames = new Intl.DisplayNames(['es'], { type: 'region' });
  }

  return [...rawCountries].map(c => {
    let localizedName = c.nameEs;
    try {
      const translated = displayNames.of(c.code);
      if (translated) localizedName = translated;
    } catch (e) {}
    // Ensure capitalized first letter
    localizedName = localizedName.charAt(0).toUpperCase() + localizedName.slice(1);
    return { ...c, localizedName };
  }).sort((a, b) => a.localizedName.localeCompare(b.localizedName, lang));
};

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
  es: { DNI: 'DNI (Español)', NIE: 'NIE (Español)', PASAPORTE: 'Pasaporte', CARTA_IDENTIDAD: 'Carta de Identidad (ID Europeo/Extranjero)', OTRO: 'Otro Documento' },
  en: { DNI: 'DNI (Spanish)', NIE: 'NIE (Spanish)', PASAPORTE: 'Passport', CARTA_IDENTIDAD: 'Identity Card (European/Foreign ID)', OTRO: 'Other Document' },
  fr: { DNI: 'DNI (Espagnol)', NIE: 'NIE (Espagnol)', PASAPORTE: 'Passeport', CARTA_IDENTIDAD: "Carte d'identité (ID européen/étranger)", OTRO: 'Autre document' },
  de: { DNI: 'DNI (Spanisch)', NIE: 'NIE (Spanisch)', PASAPORTE: 'Reisepass', CARTA_IDENTIDAD: 'Personalausweis (Europäischer/Ausländischer Ausweis)', OTRO: 'Anderes Dokument' },
  pl: { DNI: 'DNI (Hiszpański)', NIE: 'NIE (Hiszpański)', PASAPORTE: 'Paszport', CARTA_IDENTIDAD: 'Dowód tożsamości (Europejski/Zagraniczny ID)', OTRO: 'Inny document' },
  zh: { DNI: 'DNI (西班牙)', NIE: 'NIE (西班牙)', PASAPORTE: '护照', CARTA_IDENTIDAD: '身份证 (欧洲/外国身份证)', OTRO: '其他文件' },
  uk: { DNI: 'DNI (Іспанський)', NIE: 'NIE (Іспанський)', PASAPORTE: 'Паспорт', CARTA_IDENTIDAD: 'Посвідчення особи (Європейське/Іноземне ID)', OTRO: 'Інший документ' },
  ru: { DNI: 'DNI (Испанский)', NIE: 'NIE (Испанский)', PASAPORTE: 'Паспорт', CARTA_IDENTIDAD: 'Удостоверение личности (Европейское/Иностранное ID)', OTRO: 'Другой документ' },
  nl: { DNI: 'DNI (Spaans)', NIE: 'NIE (Spaans)', PASAPORTE: 'Paspoort', CARTA_IDENTIDAD: 'Identiteitskaart (Europees/Buitenlands ID)', OTRO: 'Ander document' },
  ja: { DNI: 'DNI (スペイン)', NIE: 'NIE (スペイン)', PASAPORTE: 'パスポート', CARTA_IDENTIDAD: '身分証明書 (欧州/外国身分証)', OTRO: 'その他の書類' },
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

interface LegalTranslation {
  consent_title: string;
  consent_desc: string;
  consent_accept_prefix: string;
  consent_link_text: string;
  consent_accept_suffix: string;
  btn_cancel: string;
  btn_confirm: string;
  btn_sending: string;
  terms_title: string;
  close_btn: string;
  clauses: { title: string; body: string }[];
}

const legalConsentTranslations: Record<string, LegalTranslation> = {
  es: {
    consent_title: "Consentimiento y Términos",
    consent_desc: "Para completar su registro de viajero y poder habilitar la entrega de llaves, es obligatorio que acepte nuestras políticas.",
    consent_accept_prefix: "Acepto las ",
    consent_link_text: "Condiciones de Uso y la Política de Privacidad",
    consent_accept_suffix: " de Vila de Fenals.",
    btn_cancel: "Cancelar",
    btn_confirm: "Confirmar y Enviar",
    btn_sending: "Enviando...",
    terms_title: "Condiciones de Uso y Política de Privacidad",
    close_btn: "Cerrar",
    clauses: [
      {
        title: "1. Obligatoriedad del Registro (RD 933/2021)",
        body: "En cumplimiento del Real Decreto 933/2021, de 26 de octubre, todos los huéspedes mayores de 14 años están legalmente obligados a facilitar sus datos de identidad de forma veraz para el registro de hospedajes ante las autoridades competentes."
      },
      {
        title: "2. Conservación con Fines Legales",
        body: "Sus datos personales (incluyendo nombre, documento de identidad, dirección y firma) se conservarán de forma segura con la única finalidad de dar cumplimiento al registro oficial ante las Fuerzas y Cuerpos de Seguridad del Estado (Mossos d'Esquadra). Estos datos serán almacenados bajo estrictas medidas de seguridad durante el plazo legal de 3 años, tras el cual se procederá a su completa destrucción."
      },
      {
        title: "3. Autorización Comercial (Ofertas Personalizadas)",
        body: "Al aceptar estas condiciones, usted autoriza expresamente a Vila de Fenals a conservar sus datos de contacto básicos (nombre y correo electrónico) para informarle en el futuro de ofertas exclusivas y promociones personalizadas sobre nuestros alojamientos, sin compartir sus datos con terceros."
      },
      {
        title: "4. No Cesión a Terceros",
        body: "Nos comprometemos firmemente a no vender, alquilar, ceder ni compartir sus datos personales con ninguna empresa o tercero ajeno a Vila de Fenals, salvo por requerimiento obligatorio de las autoridades policiales o judiciales."
      },
      {
        title: "5. Derechos ARCO",
        body: "En cualquier momento puede ejercer sus derechos de acceso, rectificación, supresión, limitación y oposición enviando una solicitud directa al anfitrión."
      }
    ]
  },
  en: {
    consent_title: "Consent & Legal Terms",
    consent_desc: "To complete your traveler registration and enable key delivery, you must accept our policies.",
    consent_accept_prefix: "I accept the ",
    consent_link_text: "Conditions of Use and Privacy Policy",
    consent_accept_suffix: " of Vila de Fenals.",
    btn_cancel: "Cancel",
    btn_confirm: "Confirm & Send",
    btn_sending: "Sending...",
    terms_title: "Conditions of Use & Privacy Policy",
    close_btn: "Close",
    clauses: [
      {
        title: "1. Mandatory Registration (RD 933/2021)",
        body: "In compliance with Spanish Royal Decree 933/2021, all guests over 14 years old are legally required to provide true identity details for the official documentary registration of lodging activities before competent authorities."
      },
      {
        title: "2. Data Retention for Legal Compliance",
        body: "Your personal data (including name, ID document, address, and signature) will be stored securely for the sole purpose of complying with the official registration before the Law Enforcement Agencies (Mossos d'Esquadra). This data will be kept under strict security measures for the legally required period of 3 years, after which it will be completely deleted."
      },
      {
        title: "3. Commercial Communications Consent",
        body: "By accepting these conditions, you expressly authorize Vila de Fenals to retain your basic contact details (name and email) to send you exclusive offers and personalized promotions about our properties in the future. We will never share this information with any third parties."
      },
      {
        title: "4. No Disclosure to Third Parties",
        body: "We firmly commit to never selling, renting, transferring, or sharing your personal data with any company or third party outside Vila de Fenals, except under mandatory request from police or judicial authorities."
      },
      {
        title: "5. Privacy Rights",
        body: "You may exercise your rights of access, rectification, erasure, limitation, and opposition at any time by contacting the host directly."
      }
    ]
  },
  fr: {
    consent_title: "Consentement et conditions légales",
    consent_desc: "Pour finaliser votre enregistrement de voyageur et permettre la remise des clés, vous devez accepter nos politiques.",
    consent_accept_prefix: "J'accepte les ",
    consent_link_text: "Conditions d'utilisation et politique de confidentialité",
    consent_accept_suffix: " de Vila de Fenals.",
    btn_cancel: "Annuler",
    btn_confirm: "Confirmer et envoyer",
    btn_sending: "Envoi en cours...",
    terms_title: "Conditions d'utilisation et politique de confidentialité",
    close_btn: "Fermer",
    clauses: [
      {
        title: "1. Enregistrement obligatoire (RD 933/2021)",
        body: "Conformément au décret royal espagnol 933/2021, tous les clients de plus de 14 ans sont légalement tenus de fournir des informations d'identité véridiques pour l'enregistrement documentaire officiel des activités d'hébergement auprès des autorités compétentes."
      },
      {
        title: "2. Conservation des données à des fins légales",
        body: "Vos données personnelles (y compris nom, document d'identité, adresse et signature) seront stockées en toute sécurité dans le seul but de se conformer à l'enregistrement officiel auprès des forces de sécurité (Mossos d'Esquadra). Ces données seront conservées sous des mesures de sécurité strictes pendant la période légale de 3 ans, après quoi elles seront complètement supprimées."
      },
      {
        title: "3. Consentement aux communications commerciales",
        body: "En acceptant ces conditions, vous autorisez expressément Vila de Fenals à conserver vos coordonnées de base (nom et e-mail) pour vous envoyer des offres exclusives et des promotions personnalisées à l'avenir. Nous ne partagerons jamais ces informations avec des tiers."
      },
      {
        title: "4. Non-divulgation à des tiers",
        body: "Nous nous engageons fermement à ne jamais vendre, louer, transférer ou partager vos données personnelles avec une entreprise ou un tiers extérieur à Vila de Fenals, sauf sur demande obligatoire de la police ou des autorités judiciaires."
      },
      {
        title: "5. Droits de confidentialité (Droits ARCO)",
        body: "Vous pouvez exercer vos droits d'accès, de rectification, de suppression, de limitation et d'opposition à tout moment en contactant directement l'hôte."
      }
    ]
  },
  de: {
    consent_title: "Einwilligung & rechtliche Bedingungen",
    consent_desc: "Um Ihre Registrierung als Reisender abzuschließen und die Schlüsselübergabe zu ermöglichen, müssen Sie unsere Richtlinien akzeptieren.",
    consent_accept_prefix: "Ich akzeptiere die ",
    consent_link_text: "Nutzungsbedingungen und Datenschutzrichtlinie",
    consent_accept_suffix: " von Vila de Fenals.",
    btn_cancel: "Abbrechen",
    btn_confirm: "Bestätigen & Senden",
    btn_sending: "Senden...",
    terms_title: "Nutzungsbedingungen & Datenschutzrichtlinie",
    close_btn: "Schließen",
    clauses: [
      {
        title: "1. Registrierungspflicht (RD 933/2021)",
        body: "In Übereinstimmung mit dem spanischen königlichen Dekret 933/2021 sind alle Gäste über 14 Jahre gesetzlich verpflichtet, wahrheitsgemäße Identitätsdaten für die offizielle dokumentarische Registrierung von Beherbergungsaktivitäten bei den zuständigen Behörden anzugeben."
      },
      {
        title: "2. Datenaufbewahrung zur gesetzlichen Einhaltung",
        body: "Ihre personenbezogenen Daten (einschließlich Name, Identitätsdokument, Adresse und Unterschrift) werden sicher und ausschließlich zum Zweck der Erfüllung der offiziellen Registrierung bei den Strafverfolgungsbehörden (Mossos d'Esquadra) gespeichert. Diese Daten werden unter strengen Sicherheitsvorkehrungen für die gesetzlich vorgeschriebene Dauer von 3 jahre aufgewahrt und danach vollständig gelöscht."
      },
      {
        title: "3. Einwilligung in werbliche Kommunikation",
        body: "Durch die Annahme dieser Bedingungen ermächtigen Sie Vila de Fenals ausdrücklich dazu, Ihre grundlegenden Kontaktdaten (Name und E-Mail) aufzubewahren, um Ihnen in Zukunft exklusive Angebote und personalisierte Werbeaktionen über unsere Unterkünfte zuzusenden. Wir werden diese Informationen niemals an Dritte weitergeben."
      },
      {
        title: "4. Keine Weitergabe an Dritte",
        body: "Wir verpflichten uns feierlich, Ihre personenbezogenen Daten niemals an Unternehmen oder Dritte außerhalb von Vila de Fenals zu verkaufen, zu vermieten, zu übertragen oder weiterzugeben, es sei denn, dies wird von Polizei- oder Justizbehörden zwingend verlangt."
      },
      {
        title: "5. Datenschutzrechte",
        body: "Sie können Ihre Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung und Widerspruch jederzeit ausüben, indem Sie sich direkt an den Gastgeber wenden."
      }
    ]
  },
  pl: {
    consent_title: "Zgoda i Warunki Prawne",
    consent_desc: "Aby dokończyć rejestrację podróżnego i umożliwić przekazanie kluczy, musisz zaakceptować naszą politykę.",
    consent_accept_prefix: "Akceptuję ",
    consent_link_text: "Warunki Użytkowania i Politykę Prywatności",
    consent_accept_suffix: " Vila de Fenals.",
    btn_cancel: "Anuluj",
    btn_confirm: "Potwierdź i Wyślij",
    btn_sending: "Wysyłanie...",
    terms_title: "Warunki Użytkowania i Polityka Prywatności",
    close_btn: "Zamknij",
    clauses: [
      {
        title: "1. Obowiązkowa Rejestracja (RD 933/2021)",
        body: "Zgodnie z hiszpańskim dekretem królewskim 933/2021, wszyscy goście powyżej 14 roku życia są prawnie zobowiązani do podania prawdziwych danych tożsamości w celu oficjalnej rejestracji zakwaterowania przed właściwymi organami."
      },
      {
        title: "2. Przechowywanie Danych do Celów Prawnych",
        body: "Twoje dane osobowe (w tym imię, nazwisko, dokument tożsamości, adres i podpis) będą bezpiecznie przechowywane wyłącznie w celu dopełnienia oficjalnej rejestracji przed organami ścigania (Mossos d'Esquadra). Dane te będą przechowywane przy użyciu ścisłych środków bezpieczeństwa przez wymagany prawem okres 3 lat, po czym zostaną całkowicie usunięte."
      },
      {
        title: "3. Zgoda na Komunikację Handlową",
        body: "Akceptując te warunki, wyraźnie upoważniasz Vila de Fenals do zachowania podstawowych danych kontaktowych (imię, nazwisko i e-mail) w celu wysyłania ekskluzywnych ofert i spersonalizowanych promocji dotyczących naszych obiektów w przyszłości. Nigdy nie udostępnimy tych informacji osobom trzecim."
      },
      {
        title: "4. Brak Udostępniania Danych Osobom Trzecim",
        body: "Zobowiązujemy się do nigdy niesprzedawania, niewynajmowania, nieprzekazywania ani nieudostępniania Twoich danych osobowych żadnej firmie ani osobie trzeciej spoza Vila de Fenals, z wyjątkiem obowiązkowego wezwania policji lub organów sądowych."
      },
      {
        title: "5. Prawa Prywatności (Prawa ARCO)",
        body: "W każdej chwili możesz skorzystać z prawa do dostępu, sprostowania, usunięcia, ograniczenia i sprzeciwu wobec przetwarzania danych, kontaktując się bezpośrednio z gospodarzem."
      }
    ]
  },
  nl: {
    consent_title: "Toestemming & Juridische Voorwaarden",
    consent_desc: "Om uw registratie als reiziger te voltooien en de sleuteloverdracht mogelijk te maken, moet u ons beleid accepteren.",
    consent_accept_prefix: "Ik accepteer de ",
    consent_link_text: "Gebruiksvoorwaarden en het Privacybeleid",
    consent_accept_suffix: " van Vila de Fenals.",
    btn_cancel: "Annuleren",
    btn_confirm: "Bevestigen & Verzenden",
    btn_sending: "Verzenden...",
    terms_title: "Gebruiksvoorwaarden & Privacybeleid",
    close_btn: "Sluiten",
    clauses: [
      {
        title: "1. Verplichte Registratie (RD 933/2021)",
        body: "In overeenstemming met het Spaanse Koninklijk Besluit 933/2021 zijn alle gasten ouder dan 14 jaar wettelijk verplicht om correcte identiteitsgegevens te verstrekken voor de officiële registratie van logiesactiviteiten bij de bevoegde autoriteiten."
      },
      {
        title: "2. Gegevensbewaring voor Wettelijke Naleving",
        body: "Uw persoonlijke gegevens (inclusief naam, identiteitsbewijs, adres en handtekening) worden veilig opgeslagen met als enig doel te voldoen aan de officiële registratie bij de wetshandhavingsinstanties (Mossos d'Esquadra). Deze gegevens worden onder strikte veiligheidsmaatregelen bewaard gedurende de wettelijk verplichte periode van 3 jaar, waarna ze volledig worden verwijderd."
      },
      {
        title: "3. Toestemming voor Commerciële Communicatie",
        body: "Door deze voorwaarden te accepteren, geeft u Vila de Fenals uitdrukkelijk toestemming om uw basiscontactgegevens (naam en e-mailadres) te bewaren om u in de toekomst exclusieve aanbiedingen en gepersonaliseerde promoties over onze accommodaties te sturen. We zullen deze informatie nooit met derden delen."
      },
      {
        title: "4. Geen Openbaarmaking aan Derden",
        body: "Wij verbinden ons er formeel toe uw persoonlijke gegevens nooit te verkopen, verhuren, over te dragen of te delen met enig bedrijf of derde partij buiten Vila de Fenals, behalve op verplicht verzoek van politie of justitiële autoriteiten."
      },
      {
        title: "5. Privacyrechten",
        body: "U kunt op elk moment uw recht op toegang, rectificatie, wissen, beperking en verzet uitoefenen door rechtstreeks contact op te nemen met de gastheer."
      }
    ]
  },
  uk: {
    consent_title: "Згода та юридичні умови",
    consent_desc: "Для завершення реєстрації мандрівника та отримання ключів необхідно прийняти наші правила.",
    consent_accept_prefix: "Я приймаю ",
    consent_link_text: "Умови використання та Політику конфіденційності",
    consent_accept_suffix: " Vila de Fenals.",
    btn_cancel: "Скасувати",
    btn_confirm: "Підтвердити та надіслати",
    btn_sending: "Надсилання...",
    terms_title: "Умови використання та Політика конфіденційності",
    close_btn: "Закрити",
    clauses: [
      {
        title: "1. Обов'язкова реєстрація (RD 933/2021)",
        body: "Відповідно до Королівського указу Іспанії 933/2021, усі гості віком від 14 років за законом зобов'язані надати точні ідентифікаційні дані для офіційної реєстрації проживання перед компетентними органами."
      },
      {
        title: "2. Збереження даних для дотримання закону",
        body: "Ваші персональні дані (включаючи ім'я, документ, що посвідчує особу, адресу та підпис) будуть надійно зберігатися виключно з метою дотримання вимог офіційної реєстрації перед правоохоронними органами (Mossos d'Esquadra). Ці дані зберігатимуться під суворими заходами безпеки протягом встановленого законом терміну в 3 роки, після чого будуть повністю видалені."
      },
      {
        title: "3. Згода на комерційні розсилки",
        body: "Приймаючи ці умови, ви прямо дозволяєте Vila de Fenals зберігати ваші основні контактні дані (ім'я та електронну пошту) для надсилання вам ексклюзивних пропозицій та персоналізованих акцій щодо нашого житла в майбутньому. Ми ніколи не передаватимемо цю інформацію третім особам."
      },
      {
        title: "4. Нерозголошення третім особам",
        body: "Ми твердо зобов'язуємося ніколи не продавати, не здавати в оренду, не передавати та не ділитися вашими персональними даними з жодною компанією чи третьою стороною за межами Vila de Fenals, за винятком обов'язкового запиту поліції чи судових органів."
      },
      {
        title: "5. Права на конфіденційність (Права ARCO)",
        body: "Ви можете в будь-який час реалізувати свої права на доступ, виправлення, видалення, обмеження та заперечення проти обробки даних, звернувшись безпосередньо до господаря."
      }
    ]
  },
  ru: {
    consent_title: "Согласие и юридические условия",
    consent_desc: "Для завершения регистрации путешественника и получения ключей необходимо принять наши правила.",
    consent_accept_prefix: "Я принимаю ",
    consent_link_text: "Условия использования и Политику конфиденциальности",
    consent_accept_suffix: " Vila de Fenals.",
    btn_cancel: "Отмена",
    btn_confirm: "Подтвердить и отправить",
    btn_sending: "Отправка...",
    terms_title: "Условия использования и Политика конфиденциальности",
    close_btn: "Закрыть",
    clauses: [
      {
        title: "1. Обязательная регистрация (RD 933/2021)",
        body: "В соответствии с Королевским указом Испании 933/2021, все гости старше 14 лет по закону обязаны предоставить достоверные удостоверяющие личность данные для официальной регистрации проживания перед компетентными органами."
      },
      {
        title: "2. Хранение данных в юридических целях",
        body: "Ваши персональные данные (включая имя, документ, удостоверяющий личность, адрес и подпись) будут надежно храниться исключительно с целью соблюдения официальной регистрации в правоохранительных органах (Mossos d'Esquadra). Эти данные будут храниться с соблюдением строгих мер безопасности в течение установленного законом периода в 3 года, после чего будут полностью удалены."
      },
      {
        title: "3. Согласие на коммерческие рассылки",
        body: "Принимая эти условия, вы прямо разрешаете Vila de Fenals сохранять ваши основные контактные данные (имя и адрес электронной почты) для отправки вам эксклюзивных предложений и персонализированных акций о нашем жилье в будущем. Мы никогда не будем делиться этой информацией с третьими лицами."
      },
      {
        title: "4. Неразглашение третьим лицам",
        body: "Мы твердо обязуемся никогда не продавать, не сдавать в аренду, не передавать и не делиться вашими персональными данными с какими-либо компаниями или третьими лицами за пределами Vila de Fenals, за исключением обязательных запросов со стороны полиции или судебных органов."
      },
      {
        title: "5. Права на конфиденциальность (Права ARCO)",
        body: "Вы можете в любое время воспользоваться своими правами на доступ, исправление, удаление, ограничение и возражение против обработки данных, связавшись напрямую с хозяином."
      }
    ]
  },
  zh: {
    consent_title: "同意与法律条款",
    consent_desc: "为完成您的旅客登记并能够获取钥匙，您必须接受我们的相关政策。",
    consent_accept_prefix: "我接受 Vila de Fenals 的 ",
    consent_link_text: "使用条款和隐私政策",
    consent_accept_suffix: "。",
    btn_cancel: "取消",
    btn_confirm: "确认并发送",
    btn_sending: "发送中...",
    terms_title: "使用条款与隐私政策",
    close_btn: "关闭",
    clauses: [
      {
        title: "1. 强制登记 (西班牙 RD 933/2021 法令)",
        body: "根据西班牙第 933/2021 号皇家法令，所有 14 岁以上的住客在入住前必须向主管机关提供真实有效的身份信息，以进行官方住宿登记备案。"
      },
      {
        title: "2. 依法保留和存储数据",
        body: "您的个人数据（包括姓名、身份证件、地址和签名）将被安全存储，其唯一目的是为了遵守向执法机构（加泰罗尼亚警方 Mossos d'Esquadra）进行的官方登记。这些数据将在严格的安全措施下保存法定年限（3 年），期满后将予以彻底删除。"
      },
      {
        title: "3. 同意商业推广通讯",
        body: "接受本条款即表示您明确授权 Vila de Fenals 保留您的基本联系方式（姓名和电子邮件），以便日后向您发送有关我们房源的独家优惠和个性化促销信息。我们绝不会将此信息分享给任何第三方。"
      },
      {
        title: "4. 绝不向第三方透露",
        body: "我们郑重承诺，绝不向 Vila de Fenals 之外的任何公司或第三方出售、出租、转让或分享您的个人数据，警方或司法机关的强制性要求除外。"
      },
      {
        title: "5. 隐私权及相关权利",
        body: "您可随时直接联系房东，行使您的访问、更正、删除、限制及反对处理您个人数据的权利。"
      }
    ]
  },
  ja: {
    consent_title: "同意事項および法的条件",
    consent_desc: "宿泊者登録を完了し、鍵の受け取りを有効にする death 、当社のポリシーに同意していただく必要があります。",
    consent_accept_prefix: "私は Vila de Fenals の ",
    consent_link_text: "利用規約およびプライバシーポリシー",
    consent_accept_suffix: "に同意します。",
    btn_cancel: "キャンセル",
    btn_confirm: "確認して送信",
    btn_sending: "送信中...",
    terms_title: "利用規約およびプライバシーポリシー",
    close_btn: "閉じる",
    clauses: [
      {
        title: "1. 義務的な登録 (RD 933/2021)",
        body: "スペインの王室法令 RD 933/2021 に基づき、14歳以上のすべての宿泊者は、関係当局への公式な宿泊活動の登録のため、正確な身元情報を提供する法的義務があります。"
      },
      {
        title: "2. 法的遵守のためのデータ保存",
        body: "お客様の個人データ（氏名、身分証明書、住所、署名など）は、法執行機関（カタルーニャ警察 Mossos d'Esquadra）への公式登録を遵守する目的のみに安全に保存されます。このデータは厳格なセキュリティ対策のもとで法定の3年間保存され、期間終了後は完全に消去されます。"
      },
      {
        title: "3. 商業プロモーションへの同意",
        body: "これらの条件に同意することにより、将来、当宿泊施設に関する限定オファーやカスタマイズされたプロモーション情報をお送りするために、Vila de Fenals がお客様の基本連絡先（氏名およびメールアドレス）を保存することを明示的に許可したものとみなされます。この情報を第三者に共有することは一切ありません。"
      },
      {
        title: "4. 第三者への非開示の約束",
        body: "当社は、警察または司法当局からの義務的な要請がある場合を除き、お客様の個人データを Vila de Fenals 以外のいかなる企業や第三者にも売却、賃貸、譲渡、または共有しないことを固くお約束します。"
      },
      {
        title: "5. プバシに関する権利",
        body: "お客様は、ホストに直接連絡することにより、個人データへのアクセス、訂正、削除、制限、および異議唱えを行う権利をいつでも行使することができます。"
      }
    ]
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
  const legal = legalConsentTranslations[lang] || legalConsentTranslations['es'];
  const sortedCountries = React.useMemo(() => getSortedCountries(lang), [lang]);
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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Scroll to top when an error occurs so the user sees it
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);
  
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
    sin_caducidad: false,
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
    // Data origin
    data_scanned: false,
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
              sin_caducidad: false,
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
              data_scanned: traveler.data_scanned || false,
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
    const { name, value, type } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value };
      if (name === 'nacionalidad') {
        next.pais_residencia = value;
      }
      if (name === 'sin_caducidad' && next.sin_caducidad) {
        next.fecha_caducidad = ''; // Clear expiration date if they check "no expiration"
      }
      return next as typeof prev;
    });
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
        pais_residencia: parsed.nacionalidad ? parsed.nacionalidad.substring(0, 2).toUpperCase() : prev.pais_residencia,
        data_scanned: true,
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

  const isFieldInvalid = (fieldName: keyof typeof formData) => {
    if (!hasAttemptedSubmit) return false;
    
    const isUnder14 = age !== null && age < 14;
    const isUnder18 = age !== null && age < 18;
    const isEsp = formData.nacionalidad === 'ES';

    switch (fieldName) {
      case 'nombre':
      case 'apellidos':
      case 'tipo_documento':
      case 'fecha_expedicion':
      case 'fecha_nacimiento':
      case 'nacionalidad':
      case 'sexo':
        return !formData[fieldName];

      case 'fecha_caducidad':
        return !formData.sin_caducidad && !formData.fecha_caducidad;
      
      case 'numero_documento':
        return !isUnder14 && !formData.numero_documento;

      case 'segundo_apellido':
        return formData.tipo_documento === 'DNI' && isEsp && !isUnder14 && !formData.segundo_apellido;

      case 'numero_soporte':
        const isSpanishDniOrNie = (formData.tipo_documento === 'DNI' && isEsp) || formData.tipo_documento === 'NIE';
        return isSpanishDniOrNie && !isUnder14 && !formData.numero_soporte;

      case 'parentesco':
      case 'adulto_responsable_id':
        return isUnder18 && !formData[fieldName];

      case 'direccion':
      case 'codigo_postal':
      case 'municipio':
      case 'pais_residencia':
      case 'telefono':
      case 'email':
        return !isUnder18 && !formData[fieldName];

      case 'provincia':
        return !isUnder18 && formData.pais_residencia === 'ES' && !formData.provincia;

      default:
        return false;
    }
  };

  const getFieldClass = (fieldName: keyof typeof formData, isSelect = false) => {
    const base = `w-full bg-black/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 ${isSelect ? '[&>option]:bg-gray-900' : '[color-scheme:dark]'}`;
    const invalid = 'border-2 border-red-500/80 focus:border-red-500 focus:ring-red-500/50';
    const valid = 'border border-white/10 focus:ring-white/30';
    return `${base} ${isFieldInvalid(fieldName) ? invalid : valid}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setError('');

    // Check age logic limits
    const isUnder14 = age !== null && age < 14;
    const isUnder18 = age !== null && age < 18;

    const todayStr = new Date().toISOString().split('T')[0];

    // Validate Expedicion Date (Must be present or past)
    if (!formData.fecha_expedicion) {
      setError(lang === 'en' ? 'Document issue date is mandatory.' : 'La fecha de expedición del documento es obligatoria.');
      return;
    }
    if (formData.fecha_expedicion > todayStr) {
      setError(lang === 'en' ? 'Invalid issue date. It must be a present or past date.' : 'Fecha de expedición no válida. Debe ser una fecha presente o pasada.');
      return;
    }

    // Validate Caducidad Date (Must be present or future, unless no expiry)
    if (!formData.sin_caducidad) {
      if (!formData.fecha_caducidad) {
        setError(lang === 'en' ? 'Document expiration date is mandatory. If it has no expiration, check the "No expiration" box.' : 'La fecha de caducidad es obligatoria. Si no tiene, marque la casilla "Sin caducidad".');
        return;
      }
      if (formData.fecha_caducidad < todayStr) {
        setError(lang === 'en' ? 'Document has expired. Expiration date must be present or future.' : 'El documento ha caducado. La fecha de caducidad debe ser presente o futura.');
        return;
      }
    }

    if (!isUnder14 && !formData.numero_documento) {
      setError(lang === 'en' ? 'Document number is mandatory for guests older than 14.' : 'El número de documento es obligatorio para mayores de 14 años.');
      return;
    }

    // Validate Second Surname for DNI (mandatory if DNI and Spanish national)
    const isEsp = formData.nacionalidad === 'ES';
    if (formData.tipo_documento === 'DNI' && !isUnder14 && !formData.segundo_apellido && isEsp) {
      setError(lang === 'en' ? 'Second surname is mandatory for document type DNI/NIF.' : 'El segundo apellido es obligatorio para el tipo de documento DNI/NIF.');
      return;
    }

    // Validate Support Number for DNI or NIE
    const isSpanishDniOrNie = (formData.tipo_documento === 'DNI' && isEsp) || formData.tipo_documento === 'NIE';
    if (isSpanishDniOrNie && !isUnder14 && !formData.numero_soporte) {
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
          firma: signatureBase64,
          has_accepted_terms: true
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
                <input name="nombre" value={formData.nombre} onChange={handleChange} className={getFieldClass('nombre', false)} placeholder="Juan" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_surnames}</label>
                <input name="apellidos" value={formData.apellidos} onChange={handleChange} className={getFieldClass('apellidos', false)} placeholder="Pérez" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {dict.form_second_surname} {(formData.tipo_documento !== 'DNI' || formData.nacionalidad !== 'ES') ? `(${lang === 'en' ? 'Opt.' : 'Opc.'})` : ''}
                </label>
                <input name="segundo_apellido" value={formData.segundo_apellido} onChange={handleChange} className={getFieldClass('segundo_apellido', false)} placeholder="García" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_doc_type}</label>
                <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className={getFieldClass('tipo_documento', true)}>
                  <option value="DNI">{docTypes.DNI}</option>
                  <option value="NIE">{docTypes.NIE}</option>
                  <option value="PASAPORTE">{docTypes.PASAPORTE}</option>
                  <option value="CARTA_IDENTIDAD">{docTypes.CARTA_IDENTIDAD}</option>
                  <option value="OTRO">{docTypes.OTRO}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {dict.form_doc_num} {age !== null && age < 14 ? `(${lang === 'en' ? 'Minor' : 'Menor'})` : ''}
                </label>
                <input 
                 
                  name="numero_documento" 
                  value={formData.numero_documento} 
                  onChange={handleChange} 
                  className={getFieldClass('numero_documento', false)} 
                  placeholder="Ej. 12345678A"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center h-4">
                  <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate">
                    {dict.form_support_number} {!((formData.tipo_documento === 'DNI' && formData.nacionalidad === 'ES') || formData.tipo_documento === 'NIE') ? `(${lang === 'en' ? 'Opt.' : 'Opc.'})` : ''}
                  </label>
                  {((formData.tipo_documento === 'DNI' && formData.nacionalidad === 'ES') || formData.tipo_documento === 'NIE') && (
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
                  disabled={!((formData.tipo_documento === 'DNI' && formData.nacionalidad === 'ES') || formData.tipo_documento === 'NIE')}
                 
                  name="numero_soporte" 
                  value={!((formData.tipo_documento === 'DNI' && formData.nacionalidad === 'ES') || formData.tipo_documento === 'NIE') ? '' : formData.numero_soporte} 
                  onChange={handleChange} 
                  className={getFieldClass('numero_soporte', false)} 
                  placeholder={!((formData.tipo_documento === 'DNI' && formData.nacionalidad === 'ES') || formData.tipo_documento === 'NIE') ? 'N/A' : 'Ej. AAA123456'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_exp_date}</label>
                <input type="date" name="fecha_expedicion" value={formData.fecha_expedicion} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className={getFieldClass('fecha_expedicion')} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center h-4">
                  <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate">{dict.form_cad_date || 'F. Caducidad'}</label>
                  <label className="text-[9px] text-white/60 flex items-center gap-1 cursor-pointer hover:text-white shrink-0">
                    <input type="checkbox" name="sin_caducidad" checked={formData.sin_caducidad} onChange={handleChange} className="w-2.5 h-2.5 bg-white/5 border-white/20 rounded-sm focus:ring-cyan-500 focus:ring-offset-0" />
                    Sin caducidad
                  </label>
                </div>
                <input type="date" name="fecha_caducidad" disabled={formData.sin_caducidad} value={formData.fecha_caducidad} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className={getFieldClass('fecha_caducidad', false)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4 flex items-center gap-1">
                  {dict.form_birth_date}
                  {age !== null && <span className="text-cyan-300 font-bold normal-case">(Edad: {age} años)</span>}
                </label>
                <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className={getFieldClass('fecha_nacimiento', false)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_nationality}</label>
                <select 
                  
                  name="nacionalidad" 
                  value={formData.nacionalidad} 
                  onChange={handleChange} 
                  className={getFieldClass('nacionalidad', true)}
                >
                  {sortedCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.localizedName} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">{dict.form_gender}</label>
                <select name="sexo" value={formData.sexo} onChange={handleChange} className={getFieldClass('sexo', true)}>
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
                  <select name="parentesco" value={formData.parentesco} onChange={handleChange} className={getFieldClass('parentesco', true)}>
                    <option value="">{dict.minor_parentesco_select}</option>
                    <option value="Hijo/a">Hijo / Hija</option>
                    <option value="Tutorado/a">Tutorado / Tutorada</option>
                    <option value="Hermano/a">Hermano / Hermana</option>
                    <option value="Otro">Otro grado familiar</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-yellow-100 uppercase tracking-wider font-semibold">{dict.minor_adult_resp}</label>
                  <select name="adulto_responsable_id" value={formData.adulto_responsable_id} onChange={handleChange} className={getFieldClass('adulto_responsable_id', true)}>
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
              <input name="direccion" value={formData.direccion} onChange={handleChange} className={getFieldClass('direccion', false)} placeholder="Ej. Calle Gran Vía 12, 3º B" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_cp}</label>
                <input name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} className={getFieldClass('codigo_postal', false)} placeholder="E.g. 08001" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_city}</label>
                <input name="municipio" value={formData.municipio} onChange={handleChange} className={getFieldClass('municipio', false)} placeholder="Ej. Barcelona" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {dict.form_province} {formData.pais_residencia !== 'ES' ? `(${lang === 'en' ? 'Opt.' : 'Opc.'})` : ''}
                </label>
                <input 
                 
                  name="provincia" 
                  value={formData.provincia} 
                  onChange={handleChange} 
                  className={getFieldClass('provincia', false)} 
                  placeholder="Ej. Barcelona" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_country}</label>
                <select 
                  
                  name="pais_residencia" 
                  value={formData.pais_residencia} 
                  onChange={handleChange} 
                  className={getFieldClass('pais_residencia', true)}
                >
                  {sortedCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.localizedName} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">
                  {lang === 'en' ? 'Kinship / Relation' : 'Relación viajeros'}
                </label>
                <select 
                  
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
                <input name="telefono" value={formData.telefono} onChange={handleChange} className={getFieldClass('telefono', false)} placeholder="Ej. +34600112233" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/80 uppercase tracking-wider font-semibold block truncate h-4">{dict.form_email}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={getFieldClass('email', false)} placeholder="ejemplo@correo.com" />
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
              <span>⚖️</span> {legal.consent_title}
            </h3>
            
            <p className="text-xs text-white/80 leading-relaxed">
              {legal.consent_desc}
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
                <>
                  {legal.consent_accept_prefix}
                  <button
                    type="button"
                    onClick={() => setShowLegalTextModal(true)}
                    className="text-cyan-300 hover:text-cyan-100 underline font-bold focus:outline-none"
                  >
                    {legal.consent_link_text}
                  </button>
                  {legal.consent_accept_suffix}
                </>
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
                {legal.btn_cancel}
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
                {isSubmitting ? legal.btn_sending : legal.btn_confirm}
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
              <span>📋</span> {legal.terms_title}
            </h3>
            
            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2 leading-relaxed text-white/90">
              {legal.clauses.map((clause, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="font-bold text-cyan-300">{clause.title}</h4>
                  <p>{clause.body}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <button 
                type="button"
                onClick={() => setShowLegalTextModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-cyan-950 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {legal.close_btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
