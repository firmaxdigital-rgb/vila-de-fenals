import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateMossosTxtFiles, TravelerData } from '../../../lib/traveler-txt';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export async function POST(request: Request) {
  try {
    const { reservation_code } = await request.json();

    if (!reservation_code) {
      return NextResponse.json({ success: false, error: 'Falta el código de reserva' }, { status: 400 });
    }

    // 1. Fetch Reservation details
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_code', reservation_code)
      .single();

    if (resError || !reservation) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    // 2. Fetch Travelers registered
    const { data: travelers, error: travError } = await supabase
      .from('travelers')
      .select('*')
      .eq('reservation_code', reservation_code);

    if (travError || !travelers) {
      return NextResponse.json({ success: false, error: 'Error al obtener viajeros de la reserva' }, { status: 500 });
    }

    // Dynamically deserialize extra columns stored in 'firma' field
    const parsedTravelers = (travelers || []).map((t: any) => {
      if (t.firma && t.firma.trim().startsWith('{')) {
        try {
          const extra = JSON.parse(t.firma);
          return {
            ...t,
            ...extra,
            firma: extra.firma || t.firma
          };
        } catch (e) {
          console.error("Error parsing traveler JSON in mossos-send:", e);
        }
      }
      return t;
    });

    const totalGuests = reservation.total_guests || 2;
    const completedForms = parsedTravelers.length;

    if (completedForms < totalGuests) {
      return NextResponse.json({
        success: false,
        error: `Registro incompleto. Faltan viajeros por registrar (${completedForms}/${totalGuests}).`
      }, { status: 400 });
    }

    // 3. Generate Mossos d'Esquadra TXT Files
    // Format checkInDate YYYYMMDD
    const checkInClean = reservation.check_in.replace(/-/g, '');
    
    // Map database travelers to Mossos TravelerData interface
    const formattedTravelers: TravelerData[] = parsedTravelers.map(t => {
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

    console.log(`Generated ${mossosFiles.length} Mossos d'Esquadra TXT file(s) for ${parsedTravelers.length} guests.`);

    // 4. Send files via Email (Nodemailer)
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
      file.guests.forEach((g, idx) => {
        filesBreakdown += `  ${idx + 1}. ${g}\n`;
      });
    });

    // Build a readable textual summary of all data collected from the travelers
    let travelersDetails = '';
    formattedTravelers.forEach((t, idx) => {
      travelersDetails += `\n---------------- HUÉSPED #${idx + 1} ----------------\n`;
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

    const emailSubject = `[Vila de Fenals] Registro Completado y Ficheros Mossos - Reserva ${reservation_code}`;
    const emailBody = `Se ha completado satisfactoriamente la cumplimentación de formularios de viajero para la reserva: ${reservation_code}.

============================================================
📋 RESUMEN DETALLADO DE VIAJEROS REGISTRADOS
============================================================
${travelersDetails}
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
        console.log(`Email successfully sent to ${smtpTo} with ${attachments.length} attachments.`);
      } catch (emailErr: any) {
        console.error("Error sending check-in email:", emailErr);
        emailStatus = `error: ${emailErr.message}`;
      }
    } else {
      console.warn("SMTP credentials not fully configured in environment variables. Logging files content to server logs instead:");
      mossosFiles.forEach((f) => {
        console.log(`\n=================== FILE: ${f.filename} ===================`);
        console.log(f.content);
        console.log("=============================================================\n");
      });
    }

    return NextResponse.json({
      success: true,
      email_status: emailStatus,
      files: mossosFiles.map(f => ({ filename: f.filename, guests: f.guests }))
    });

  } catch (error: any) {
    console.error('Error in mossos-send route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al generar o enviar los archivos de Mossos.'
    }, { status: 500 });
  }
}
