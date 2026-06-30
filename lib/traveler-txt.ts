/**
 * Mossos d'Esquadra / Spanish Police Traveler Record TXT Formatter
 * Strictly complies with the May 2025 Mossos d'Esquadra Web Portal Instructions Manual (v8)
 * and Spanish RD 933/2021 specifications.
 */

export interface TravelerData {
  nombre: string;
  apellidos: string;
  segundo_apellido?: string;
  numero_soporte?: string;
  tipo_documento: string; // D (DNI/NIF/TIE), N (NIE), P (Passport), O (Others)
  numero_documento: string;
  fecha_expedicion: string; // YYYY-MM-DD
  fecha_nacimiento: string; // YYYY-MM-DD
  sexo: string; // M or F
  nacionalidad: string; // ISO 2-letter or 3-letter code
  direccion: string;
  codigo_postal: string;
  municipio: string;
  provincia?: string;
  pais_residencia: string; // ISO 2-letter or 3-letter code
  telefono: string;
  email: string;
  parentesco?: string;
  check_in_date?: string; // YYYY-MM-DD
  check_out_date?: string; // YYYY-MM-DD
  hora_entrada?: string; // HH:MM
  hora_salida?: string; // HH:MM
  data_scanned?: boolean;
}

// Convert YYYY-MM-DD to AAAAMMDD
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '');
}

// Format text fields: uppercase, trim, remove accents or pipes if any
function formatText(text?: string): string {
  if (!text) return '';
  const clean = text.trim().toUpperCase().replace(/\|/g, ' ');
  return clean === '-' ? '' : clean;
}

import { COUNTRIES, getAlpha3FromCode } from './countries';

// Convert ISO 2-letter country code to ISO 3166-1 Alfa-3 (3-letter code)
function getAlpha3(code: string): string {
  const clean = (code || '').toUpperCase().trim();
  const alpha3 = getAlpha3FromCode(clean);
  if (alpha3) return alpha3;
  return clean.length >= 3 ? clean.substring(0, 3) : 'ESP';
}

// Map guest relationship to official Mossos 2-letter codes
function getParentescoCode(text?: string): string {
  const clean = (text || '').toLowerCase().trim();
  if (clean.includes('hijo') || clean.includes('hija') || clean.includes('son') || clean.includes('daughter') || clean.includes('hj')) return 'HJ';
  if (clean.includes('padre') || clean.includes('madre') || clean.includes('parent') || clean.includes('father') || clean.includes('mother') || clean.includes('pm')) return 'PM';
  if (clean.includes('cónyuge') || clean.includes('espos') || clean.includes('spouse') || clean.includes('wife') || clean.includes('husband') || clean.includes('pareja') || clean.includes('cy')) return 'CY';
  if (clean.includes('hermano') || clean.includes('hermana') || clean.includes('brother') || clean.includes('sister') || clean.includes('hr')) return 'HR';
  if (clean.includes('tuto') || clean.includes('guard') || clean.includes('tu')) return 'TU';
  if (clean.includes('abuel') || clean.includes('grand') || clean.includes('ab')) return 'AB';
  if (clean.includes('niet') || clean.includes('grandch') || clean.includes('ni')) return 'NI';
  if (clean.includes('tío') || clean.includes('tía') || clean.includes('uncle') || clean.includes('aunt') || clean.includes('ti')) return 'TI';
  if (clean.includes('sobrin') || clean.includes('nephew') || clean.includes('niece') || clean.includes('sb')) return 'SB';
  return 'OT'; // Default 'Otros'
}

// Split apellidos into first and second surname
function splitSurnames(apellidos: string): { first: string; second: string } {
  const parts = apellidos.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { first: formatText(apellidos), second: '' };
  }
  return {
    first: formatText(parts[0]),
    second: formatText(parts.slice(1).join(' '))
  };
}

/**
 * Generates Mossos d'Esquadra formatted files from a list of travelers.
 * Returns an array of generated text files with partition logic.
 */
export function generateMossosTxtFiles(
  travelers: TravelerData[],
  establishmentNif: string = 'ESB12345678',
  establishmentCode: string = 'EST0000001',
  checkInDate: string = formatDate(new Date().toISOString().split('T')[0]),
  establishmentName: string = 'VILA DE FENALS',
  totalGuests: number = travelers.length
): { filename: string; content: string; guests: string[] }[] {
  const files: { filename: string; content: string; guests: string[] }[] = [];
  
  // Date of creation (today)
  const today = new Date();
  const creationDateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const creationTimeStr = today.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4); // HHMM
  
  // Cumulative partition logic if guest count > 5:
  // - File 1: first 5 travelers
  // - File 2: first 6 travelers
  // - File 3: first 7 travelers (if applicable)
  let chunks: TravelerData[][] = [];
  if (travelers.length > 5) {
    chunks.push(travelers.slice(0, 5));
    chunks.push(travelers.slice(0, 6));
    if (travelers.length >= 7) {
      chunks.push(travelers.slice(0, 7));
    }
  } else {
    // For 5 or fewer travelers, generate a single file containing all of them
    chunks.push(travelers);
  }
  
  // Generate files from chunks
  chunks.forEach((chunk, index) => {
    const fileIndex = index + 1;
    const sequenceNo = String(fileIndex).padStart(3, '0'); // Incremental counter sequence: e.g. 001, 002
    
    // LINEA ESTABLECIMIENTO (Type 1) - Must have exactly 7 fields
    // 1: Tipo registro (1)
    // 2: Código establecimiento
    // 3: Nombre establecimiento (max 40 chars)
    // 4: Fecha confección (yyyyMMdd)
    // 5: Hora confección (HHmm)
    // 6: Número de registros (5 chars max)
    // 7: Formato fichero (V24)
    const formattedEstName = formatText(establishmentName).substring(0, 40);
    let fileContent = `1|${formatText(establishmentCode)}|${formattedEstName}|${creationDateStr}|${creationTimeStr}|${chunk.length}|V24|\r\n`;
    
    const guestNames: string[] = [];
    
    // Add Traveler Details (Type 2) - Must have exactly 32 fields
    chunk.forEach((traveler) => {
      let primerApellido = '';
      let segundoApellido = '';
      
      if (traveler.segundo_apellido) {
        primerApellido = formatText(traveler.apellidos);
        segundoApellido = formatText(traveler.segundo_apellido);
      } else {
        const split = splitSurnames(traveler.apellidos);
        primerApellido = split.first;
        segundoApellido = split.second;
      }

      const nombre = formatText(traveler.nombre);
      guestNames.push(`${nombre} ${traveler.apellidos}${traveler.segundo_apellido ? ' ' + traveler.segundo_apellido : ''}`);
      
      // Determine Spanish vs Foreign Document Fields (conditional formatting)
      const docType = formatText(traveler.tipo_documento).substring(0, 1);
      const isSpanishDoc = (docType === 'D' || (docType === 'P' && getAlpha3(traveler.nacionalidad) === 'ESP'));
      
      const docNumEsp = isSpanishDoc ? formatText(traveler.numero_documento) : '';
      const docNumExt = !isSpanishDoc ? formatText(traveler.numero_documento) : '';
      
      // Support number validation (mandatory for NIF/DNI/NIE if Spanish, 9 chars max/exact)
      const soporteNum = formatText(traveler.numero_soporte).substring(0, 9);
      
      // Mandatory Dates and Times
      const expedicionDate = formatDate(traveler.fecha_expedicion);
      const nacimientoDate = formatDate(traveler.fecha_nacimiento);
      const entryDate = formatDate(traveler.check_in_date || checkInDate);
      const entryTime = traveler.hora_entrada ? traveler.hora_entrada.replace(/:/g, '').trim() : '1600'; // HHmm
      
      const exitDate = formatDate(traveler.check_out_date || traveler.check_in_date || checkInDate);
      const exitTime = traveler.hora_salida ? traveler.hora_salida.replace(/:/g, '').trim() : '1000'; // HHmm
      
      const contractDate = entryDate; // Must be equal or anterior to today's date
      const contractType = 'C'; // 'C' for Contrato en curso, 'R' for Reserva
      const contractNum = formatText(traveler.numero_documento).substring(0, 20); // Contract/Reservation Reference
      
      // Demographics & Contacts
      const sexo = formatText(traveler.sexo).substring(0, 1) || 'M';
      const nacionalidadAlpha3 = getAlpha3(traveler.nacionalidad);
      
      const telefono = traveler.telefono ? traveler.telefono.replace(/\D/g, '').substring(0, 20) : '';
      const email = formatText(traveler.email).substring(0, 100);
      
      // Payment details
      const paymentType = 'PLATF'; // 'PLATF' (Plataforma), 'TARJT' (Tarjeta), 'EFECT' (Efectivo)
      const roomsNum = '1';
      const hasInternet = 'S'; // 'S' for Sí, 'N' for No
      
      // Relationship for minors under 18
      const relationship = getParentescoCode(traveler.parentesco);
      
      // Address & Location mapping
      const direccion = formatText(traveler.direccion).substring(0, 100);
      const cp = formatText(traveler.codigo_postal).substring(0, 20);
      
      const isSpainResidencia = (getAlpha3(traveler.pais_residencia) === 'ESP');
      
      // Spanish residence: mandatory municipio (INE 6-digit) and provincia (INE 2-digit derived from CP)
      // Foreign residence: mandatory localidad
      const paisPostal = getAlpha3(traveler.pais_residencia);
      const localitatPostal = !isSpainResidencia ? formatText(traveler.municipio).substring(0, 100) : '';
      
      const provinciaPostal = isSpainResidencia ? cp.substring(0, 2).padStart(2, '0') : ''; // First 2 digits of CP = Province Code
      const municipiPostal = isSpainResidencia ? cp.padEnd(6, '0').substring(0, 6) : ''; // Pad CP to form valid 6-char INE code
      
      // Assemble exactly 32 pipe-separated columns for "LÍNEA VIAJERO" (Type 2)
      const travelerRecord = [
        '2',                  // 1. Tipo registro
        docNumEsp,            // 2. Número de documento español
        docNumExt,            // 3. Número de documento extranjero
        docType,              // 4. Tipo de documento identificador
        expedicionDate,       // 5. Fecha expedición documento
        primerApellido,       // 6. Primer apellido
        segundoApellido,      // 7. Segundo apellido
        nombre,               // 8. Nombre
        sexo,                 // 9. Sexo
        nacimientoDate,       // 10. Fecha nacimiento
        nacionalidadAlpha3,   // 11. Pais nacionalidad (ISO 3-letter)
        entryDate,            // 12. Fecha entrada
        entryTime,            // 13. Hora entrada
        exitDate,             // 14. Fecha salida
        exitTime,             // 15. Hora salida
        contractDate,         // 16. Fecha contrato
        contractType,         // 17. Tipo contrato
        contractNum,          // 18. Número contrato
        totalGuests.toString(), // 19. Número viajeros (Total in booking)
        roomsNum,             // 20. Número habitaciones
        hasInternet,          // 21. Internet (S/N)
        paymentType,          // 22. Tipo pago
        telefono,             // 23. Teléfono
        relationship,         // 24. Relación de parentesco
        email,                // 25. Email
        soporteNum,           // 26. Número soporte documento
        direccion,            // 27. Dirección postal
        provinciaPostal,      // 28. Provincia postal (2 digits)
        municipiPostal,       // 29. Municipi postal (6 digits)
        localitatPostal,      // 30. Localitat postal
        paisPostal,           // 31. Pais postal (ISO 3-letter)
        cp                    // 32. Código postal
      ];
      
      fileContent += travelerRecord.join('|') + '|\r\n';
    });
    
    files.push({
      filename: `${establishmentCode}.${sequenceNo}.txt`, // Matching Mossos standard naming: CODE.001.txt
      content: fileContent,
      guests: guestNames
    });
  });
  
  return files;
}
