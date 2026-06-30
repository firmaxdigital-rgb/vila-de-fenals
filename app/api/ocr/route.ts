import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// Initialize Project and Location from environment variables
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'firmax-proptech-core';
let LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'europe-southwest1';

// Para gemini-3.5-flash en Vertex AI, los endpoints regionales específicos (como us-central1 o europe-west3)
// no están disponibles para todos los proyectos y devuelven 404. Debemos usar los endpoints multi-región ("us" o "eu").
// Mapeamos dinámicamente según la región base para garantizar el cumplimiento de normativas de datos (GDPR en Europa):
if (LOCATION.startsWith('europe-') || LOCATION.toLowerCase() === 'eu' || LOCATION.toLowerCase() === 'europe-southwest1') {
  console.log(`Redirigiendo región europea (${LOCATION}) a la multi-región 'eu' para compatibilidad con Gemini 3.5 y cumplimiento estricto de GDPR.`);
  LOCATION = 'eu';
} else if (LOCATION.startsWith('us-') || LOCATION.toLowerCase() === 'us') {
  console.log(`Redirigiendo región americana (${LOCATION}) a la multi-región 'us' para compatibilidad con Gemini 3.5.`);
  LOCATION = 'us';
} else {
  console.log(`Redirigiendo ubicación ${LOCATION} a la multi-región 'eu' por defecto para garantizar cumplimiento de GDPR.`);
  LOCATION = 'eu';
}

let ai: GoogleGenAI | null = null;

try {
  console.log(`Inicializando GoogleGenAI (Vertex AI) con Proyecto: ${PROJECT_ID}, Ubicación: ${LOCATION}`);
  
  const authOpts: any = {};
  let gcpCredentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  // Fallback 1: Si no está configurada la variable específica de JSON, revisamos si la variable estándar contiene el JSON crudo
  if (!gcpCredentialsJson && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const trimmed = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
    if (trimmed.startsWith('{')) {
      gcpCredentialsJson = trimmed;
    }
  }

  if (gcpCredentialsJson) {
    try {
      const credentials = JSON.parse(gcpCredentialsJson);
      authOpts.credentials = credentials;
      console.log("Credenciales de GCP parseadas correctamente desde variable de entorno JSON.");
    } catch (e) {
      console.error("Error al parsear el JSON de credenciales de GCP en Vertex AI:", e);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const localPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    // Fallback 2: Solo asignamos keyFilename si el archivo realmente existe físicamente en el servidor
    if (fs.existsSync(localPath)) {
      authOpts.keyFilename = localPath;
      console.log(`Usando ruta de archivo local existente para credenciales de GCP: ${localPath}`);
    } else {
      console.warn(`El archivo de credenciales de GCP no existe en la ruta física: ${localPath}. Se omitirá para evitar fallos catastróficos en Vercel.`);
      console.warn("Se recurrirá a la autenticación implícita del entorno.");
    }
  }

  ai = new GoogleGenAI({
    vertexai: true,
    project: PROJECT_ID,
    location: LOCATION,
    googleAuthOptions: Object.keys(authOpts).length > 0 ? authOpts : undefined
  });
} catch (err) {
  console.error("Error al inicializar GoogleGenAI con Vertex AI adapter:", err);
}

export async function POST(request: Request) {
  try {
    if (!ai) {
      return NextResponse.json({
        success: false,
        error: "El cliente de Google Gen AI no está inicializado. Verifique sus credenciales de GCP o configuración de Vertex AI."
      }, { status: 500 });
    }

    const { files } = await request.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No se proporcionaron archivos para procesar."
      }, { status: 400 });
    }

    if (files.length > 3) {
      return NextResponse.json({
        success: false,
        error: "Se permite un máximo de 3 archivos por escaneo."
      }, { status: 400 });
    }

    const promptText = `Eres un experto en extracción de datos de documentos de identidad (DNI, Pasaporte, Carta de Identidad, NIE).
Analiza las imágenes adjuntas correspondientes a las caras de un documento de identidad y extrae de forma precisa los siguientes campos en formato JSON estricto.

Campos a extraer:
- nombre: Nombre del titular (sin apellidos).
- apellidos: Primer apellido del titular.
- segundo_apellido: Segundo apellido del titular (especialmente si es de España y tiene dos apellidos). Si no tiene segundo apellido, déjalo vacío "".
- tipo_documento: Tipo de documento. Mapear obligatoriamente a uno de estos: "DNI" (si es documento español), "NIE" (si es NIE español), "PASAPORTE" (si es pasaporte de cualquier país), "CARTA_IDENTIDAD" (si es documento de identidad extranjero o ID Card).
- numero_documento: Número de documento (incluir letras si aplica, sin espacios ni guiones).
- numero_soporte: Número de soporte del documento (ej: "NUM SOPORT" de 9 caracteres en DNI español, o el número que empieza por E o C en el NIE). Si no aplica o no se ve, déjalo vacío "".
- fecha_expedicion: Fecha de expedición en formato "YYYY-MM-DD". Si no aparece, deja en blanco.
- fecha_caducidad: Fecha de caducidad en formato "YYYY-MM-DD".
- fecha_nacimiento: Fecha de nacimiento en formato "YYYY-MM-DD".
- sexo: Sexo o género del titular (mapear obligatoriamente a "M" para masculino, "F" para femenino).
- nacionalidad: Nacionalidad del titular. Devuelve siempre el código de dos letras ISO (ej: "ES" para España, "EE" para Estonia, "FR" para Francia, "DE" para Alemania, "GB" para Reino Unido, etc.). Si no estás seguro, usa el código de dos letras del país correspondiente.

Reglas críticas:
1. Responde ÚNICAMENTE con el objeto JSON solicitado, sin bloques de código Markdown ni explicaciones adicionales.
2. Si un campo no es visible o legible en las imágenes, pon una cadena de texto vacía "".
3. Mantén los nombres y apellidos limpios, sin caracteres de control o tuberías "|".

Ejemplo de salida:
{
  "nombre": "JUAN",
  "apellidos": "PEREZ",
  "segundo_apellido": "GARCIA",
  "tipo_documento": "DNI",
  "numero_documento": "12345678A",
  "numero_soporte": "AAA123456",
  "fecha_expedicion": "2024-05-15",
  "fecha_caducidad": "2029-05-15",
  "fecha_nacimiento": "1990-08-20",
  "sexo": "M",
  "nacionalidad": "ES"
}`;

    // Format content parts with prompt and base64 files
    const parts: any[] = [{ text: promptText }];

    for (const file of files) {
      if (!file.data || !file.mimeType) {
        continue;
      }

      // Clean base64 data (strip prefix if present)
      const base64Data = file.data.includes('base64,')
        ? file.data.split('base64,')[1]
        : file.data;

      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: base64Data
        }
      });
    }

    console.log(`Llamando directamente a gemini-3.5-flash a través del SDK @google/genai en la región ${LOCATION}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const textResult = response.text;

    if (!textResult) {
      throw new Error("El modelo gemini-3.5-flash no devolvió ningún contenido de texto.");
    }

    console.log("Respuesta en crudo del nuevo SDK @google/genai:", textResult);

    // Parse the result
    let jsonResult;
    try {
      jsonResult = JSON.parse(textResult.trim());
    } catch (e) {
      // Fallback clean markdown block if present
      const cleanText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonResult = JSON.parse(cleanText);
    }

    return NextResponse.json({
      success: true,
      data: jsonResult
    });

  } catch (error: any) {
    console.error('Error final en Google Gen AI OCR Route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error al procesar el documento con Google Gen AI."
    }, { status: 500 });
  }
}