import { generateMossosTxtFiles, TravelerData } from './traveler-txt';
import nodemailer from 'nodemailer';

export async function sendMossosForReservation(reservation: any, parsedTravelers: any[]) {
  const totalGuests = reservation.total_guests || 2;
  const completedForms = parsedTravelers.length;

  if (completedForms < totalGuests) {
    console.log(`[Mossos] Registro incompleto (${completedForms}/${totalGuests}). No se enviará email todavía.`);
    return { success: false, error: 'Registro incompleto' };
  }

  // Generate Mossos d'Esquadra TXT Files
  // Map database travelers to Mossos TravelerData interface
  const formattedTravelers: TravelerData[] = parsedTravelers.map(tRaw => {
    let t = { ...tRaw };
    if (t.firma && typeof t.firma === 'string' && t.firma.trim().startsWith('{')) {
      try {
        const extra = JSON.parse(t.firma);
        t = { ...t, ...extra };
      } catch (e) {
        console.error("[Mossos] Error parsing traveler serialized JSON from firma field:", e);
      }
    }

    // Map standard document types to official Mossos codes (DNI -> D, NIE -> N, PASAPORTE -> P, OTROS -> O)
    let docType = 'D';
    const rawDocType = (t.tipo_documento || '').toUpperCase();
    const rawNac = (t.nacionalidad || 'ES').toUpperCase().trim();
    const isEsp = rawNac === 'ES' || rawNac === 'ESP';
    
    if (rawDocType.includes('PASAPORTE') || rawDocType.includes('PASSPORT')) {
      docType = 'P';
    } else if (rawDocType.includes('NIE') || rawDocType.includes('EXTRANJERO')) {
      docType = 'N'; // Mossos code for NIE is N
    } else if (rawDocType.includes('CARTA') || rawDocType.includes('IDENTIDAD') || rawDocType.includes('OTRO') || rawDocType.includes('OTHER')) {
      docType = 'O'; // Others is O
    } else {
      // If the document is declared as DNI but traveler is not Spanish, it is a foreign ID card, so it must be 'O'
      if (rawDocType.includes('DNI') && !isEsp) {
        docType = 'O';
      } else {
        docType = isEsp ? 'D' : 'O';
      }
    }

    return {
      nombre: t.nombre,
      apellidos: t.apellidos,
      segundo_apellido: t.segundo_apellido || '',
      numero_soporte: t.numero_soporte || '',
      tipo_documento: docType,
      numero_documento: t.numero_documento,
      fecha_expedicion: t.fecha_expedicion || '',
      fecha_nacimiento: t.fecha_nacimiento,
      sexo: t.sexo,
      nacionalidad: t.nacionalidad || 'ES',
      direccion: t.direccion || 'No proporcionada',
      codigo_postal: t.codigo_postal || '00000',
      municipio: t.municipio || 'No proporcionado',
      provincia: t.provincia || '',
      pais_residencia: t.pais_residencia || 'ES',
      telefono: t.telefono || '',
      email: t.email || '',
      parentesco: t.parentesco || t.relacion_viajeros || '',
      check_in_date: reservation.check_in,
      check_out_date: reservation.check_out,
      hora_entrada: '16:00', // Forced by system
      hora_salida: '10:00'   // Forced by system
    };
  });

  const establishmentNif = 'ESB99887766';
  const establishmentCode = 'ID50008886';
  
  const mossosFiles = generateMossosTxtFiles(
    formattedTravelers,
    establishmentNif,
    establishmentCode,
    reservation.check_in,
    'VILA DE FENALS',
    totalGuests
  );

  console.log(`[Mossos] Generated ${mossosFiles.length} Mossos d'Esquadra TXT file(s) for ${parsedTravelers.length} guests.`);

  // Send files via Email (Nodemailer)
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || 'checkin@viladefenals.com';
  const smtpTo = process.env.SMTP_TO || smtpFrom; // Send to admin

  let emailSent = false;
  let emailStatus = 'skipped_no_config';

  // Build the email description listing guests in each file chunk
  let filesBreakdown = '';
  mossosFiles.forEach((file) => {
    filesBreakdown += `\n📁 Archivo: ${file.filename}\n`;
    filesBreakdown += `Huéspedes incluidos en este archivo:\n`;
    file.guests.forEach((g: any, idx: number) => {
      filesBreakdown += `  ${idx + 1}. ${g}\n`;
    });
  });

  // Helper to calculate age at check-in
  const getAgeAtCheckin = (birthDateStr: string, checkInStr: string): number | null => {
    if (!birthDateStr || !checkInStr) return null;
    const birthDate = new Date(birthDateStr);
    const checkInDate = new Date(checkInStr);
    if (isNaN(birthDate.getTime()) || isNaN(checkInDate.getTime())) return null;
    let age = checkInDate.getFullYear() - birthDate.getFullYear();
    const m = checkInDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && checkInDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  let minorsCount = 0;
  let adultsCount = 0;
  let payingGuests = 0;
  let exemptGuests = 0;

  // Build a readable textual summary of all data collected from the travelers
  let travelersDetails = '';
  formattedTravelers.forEach((t, idx) => {
    const age = getAgeAtCheckin(t.fecha_nacimiento, reservation.check_in);
    const isMinor = age !== null && age < 18;
    
    if (isMinor) minorsCount++;
    else adultsCount++;

    if (age !== null && age >= 16) {
      payingGuests++;
    } else {
      exemptGuests++;
    }

    const ocrIcon = parsedTravelers[idx].data_scanned ? '[✔️ Escaneado]' : '[✍️ Manual]';
    const minorTag = isMinor ? ' (MENOR DE EDAD)' : '';
    travelersDetails += `\n---------------- HUÉSPED #${idx + 1} ${ocrIcon}${minorTag} ----------------\n`;
    travelersDetails += `👤 Nombre Completo:  ${t.nombre} ${t.apellidos} ${t.segundo_apellido || ''}\n`;
    travelersDetails += `🎂 F. Nacimiento:   ${t.fecha_nacimiento}\n`;
    travelersDetails += `🧬 Sexo:            ${t.sexo === 'M' ? 'Masculino' : t.sexo === 'F' ? 'Femenino' : t.sexo}\n`;
    travelersDetails += `🌍 Nacionalidad:    ${t.nacionalidad}\n`;
    travelersDetails += `🪪 Doc. Identidad:  ${t.tipo_documento === 'D' ? 'DNI' : t.tipo_documento === 'P' ? 'Pasaporte' : t.tipo_documento === 'N' ? 'NIE' : t.tipo_documento} - N° ${t.numero_documento}\n`;
    if (t.numero_soporte) {
      travelersDetails += `🎫 N° Soporte:      ${t.numero_soporte}\n`;
    }
    travelersDetails += `📅 F. Expedición:   ${t.fecha_expedicion || 'No proporcionada'}\n`;
    travelersDetails += `📞 Teléfono:        ${t.telefono || 'No proporcionado'}\n`;
    travelersDetails += `📧 Email:           ${t.email || 'No proporcionado'}\n`;
    travelersDetails += `🏠 Residencia:      ${t.direccion}, CP ${t.codigo_postal}, ${t.municipio}, ${t.provincia || ''}, ${t.pais_residencia}\n`;
    travelersDetails += `⏱️ Entrada/Llegada: ${t.check_in_date || reservation.check_in} a las ${t.hora_entrada}\n`;
    travelersDetails += `⏱️ Salida:          ${t.check_out_date || reservation.check_out} a las ${t.hora_salida}\n`;
    
    const parentescoLabel = t.parentesco === 'HJ' ? 'Hijo/a' : t.parentesco === 'CY' ? 'Cónyuge' : t.parentesco === 'PM' ? 'Padre/Madre' : t.parentesco === 'HR' ? 'Hermano/a' : t.parentesco === 'OT' ? 'Otros / Acompañante' : t.parentesco;
    if (parentescoLabel) {
      travelersDetails += `👪 Relación/Parentesco: ${parentescoLabel}\n`;
    }
  });

  let minorsWarning = '';
  if (minorsCount > 0) {
    minorsWarning = `\n\n⚠️ ATENCIÓN: Se ha detectado que hay ${adultsCount} adulto(s) y ${minorsCount} menor(es) de 18 años. Por favor, verifique las autorizaciones de los menores.`;
  }

  // Calculate nights for tax
  const checkInDateObj = new Date(reservation.check_in);
  const checkOutDateObj = new Date(reservation.check_out);
  const diffTime = Math.abs(checkOutDateObj.getTime() - checkInDateObj.getTime());
  let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (nights > 7) nights = 7;
  if (nights < 1) nights = 1;
  const rate = 1.75;
  const totalTax = parseFloat((payingGuests * nights * rate).toFixed(2));
  const mainGuest = formattedTravelers[0];

  const emailSubject = `[Vila de Fenals] Registro Completado y Ficheros Mossos - Reserva ${reservation.reservation_code}`;
  const emailBody = `Se ha completado satisfactoriamente la cumplimentación de formularios de viajero para la reserva: ${reservation.reservation_code}.${minorsWarning}

============================================================
📋 RESUMEN DETALLADO DE VIAJEROS REGISTRADOS
============================================================
${travelersDetails}
============================================================

============================================================
💶 CÁLCULO DE LA TASA TURÍSTICA
============================================================
Huésped principal (Titular de factura): ${mainGuest.nombre} ${mainGuest.apellidos} ${mainGuest.segundo_apellido || ''}
Identificación: ${mainGuest.tipo_documento} ${mainGuest.numero_documento}
Dirección: ${mainGuest.direccion}, ${mainGuest.codigo_postal} ${mainGuest.municipio} (${mainGuest.pais_residencia})

Sistema de cálculo:
- Noches computables: ${nights} (Máximo 7 noches facturables)
- Huéspedes sujetos a tasa (≥16 años): ${payingGuests}
- Huéspedes exentos (<16 años): ${exemptGuests}
- Tarifa aplicable: ${rate}€ por huésped/noche

Importe total de Tasa Turística: ${totalTax}€
============================================================

A continuación se detalla la partición y el desglose de los huéspedes registrados en cada uno de los archivos reglamentarios adjuntos (máximo 5 por archivo según normativa):
${filesBreakdown}

Por favor, conserve estos archivos adjuntos para su envío/inspección oficial de los Mossos d'Esquadra.

Atentamente,
Portal de Check-in Automático de Vila de Fenals`;

  if (smtpHost && smtpPort && smtpUser && smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      // Map files to Nodemailer attachment structures
      const attachments = mossosFiles.map(f => ({
        filename: f.filename,
        content: f.content
      }));

      await transporter.sendMail({
        from: smtpFrom,
        to: smtpTo,
        subject: emailSubject,
        text: emailBody,
        attachments: attachments
      });

      emailSent = true;
      emailStatus = 'sent_successfully';
      console.log(`[Mossos] Email successfully sent to ${smtpTo} with ${attachments.length} attachments.`);
    } catch (emailErr: any) {
      console.error("[Mossos] Error sending check-in email:", emailErr);
      emailStatus = `error: ${emailErr.message}`;
    }
  } else {
    console.warn("[Mossos] SMTP credentials not fully configured in environment variables. Logging files content to server logs instead:");
    mossosFiles.forEach((f) => {
      console.log(`\n=================== FILE: ${f.filename} ===================`);
      console.log(f.content);
      console.log("=============================================================\n");
    });
    emailSent = true;
    emailStatus = 'logged_locally';
  }

  return {
    success: emailSent,
    email_status: emailStatus
  };
}
