import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
});

// GET: Fetch all travelers for a reservation
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationCode = searchParams.get('reservation_code');

    if (!reservationCode) {
      return NextResponse.json({ success: false, error: 'Falta el código de reserva' }, { status: 400 });
    }

    const { data: travelers, error } = await supabase
      .from('travelers')
      .select('*')
      .eq('reservation_code', reservationCode);

    if (error) throw error;

    // Dynamically deserialize extra columns stored in the 'firma' column if missing in database schema
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
          console.error("Error parsing traveler serialized JSON from firma field:", e);
        }
      }
      return t;
    });

    return NextResponse.json({ success: true, travelers: parsedTravelers });
  } catch (error: any) {
    console.error('Error fetching travelers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { checkRateLimit } from '../../../lib/rateLimit';

// POST: Add or Edit a traveler with validations
export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const isAllowed = await checkRateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'Demasiados intentos. Por favor espere 5 minutos.' }, { status: 429 });
    }

    const body = await request.json();
    const {
      id, // Present if we are editing
      reservation_code,
      nombre,
      apellidos,
      segundo_apellido,
      numero_soporte,
      tipo_documento,
      numero_documento,
      fecha_expedicion,
      fecha_caducidad,
      fecha_nacimiento,
      sexo,
      nacionalidad,
      direccion,
      codigo_postal,
      municipio,
      provincia,
      pais_residencia,
      telefono,
      email,
      parentesco,
      adulto_responsable_id,
      relacion_viajeros,
      firma_menor_16,
      hora_entrada,
      hora_salida,
      firma
    } = body;

    // Standard validations
    if (!reservation_code || !nombre || !apellidos || !fecha_nacimiento || !sexo) {
      return NextResponse.json({
        success: false,
        error: 'Los campos obligatorios Nombre, Apellidos, Fecha de Nacimiento y Sexo son requeridos.'
      }, { status: 400 });
    }

    // Determine age to handle minor logic
    const birthDate = new Date(fecha_nacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const isUnder14 = age < 14;
    const isUnder18 = age < 18;

    // Document requirement validation
    if (!isUnder14 && !numero_documento) {
      return NextResponse.json({
        success: false,
        error: 'El número de documento es obligatorio para mayores de 14 años.'
      }, { status: 400 });
    }

    // Second surname validation (Mandatory for DNI according to PDF)
    const isEsp = (nacionalidad === 'ES' || nacionalidad === 'ESP');
    if (tipo_documento === 'DNI' && !isUnder14 && !segundo_apellido && isEsp) {
      return NextResponse.json({
        success: false,
        error: 'El segundo apellido es obligatorio para el tipo de documento DNI/NIF.'
      }, { status: 400 });
    }

    // Document support number validation (Mandatory for DNI or NIE according to PDF)
    const isSpanishDniOrNie = (tipo_documento === 'DNI' && isEsp) || tipo_documento === 'NIE';
    if (isSpanishDniOrNie && !isUnder14 && !numero_soporte) {
      return NextResponse.json({
        success: false,
        error: 'El número de soporte del documento (NUM SOPORT) es obligatorio para tipo DNI o NIE.'
      }, { status: 400 });
    }

    // Grado de parentesco validation for minors
    if (isUnder18) {
      if (!parentesco) {
        return NextResponse.json({
          success: false,
          error: 'El campo "Grado de Parentesco" es obligatorio para menores de 18 años.'
        }, { status: 400 });
      }
      if (!adulto_responsable_id) {
        return NextResponse.json({
          success: false,
          error: 'Debe seleccionar un adulto registrado como responsable del menor.'
        }, { status: 400 });
      }
    }

    // Check duplicate document validation in the same reservation (skip check if editing and document belongs to same traveler)
    if (numero_documento) {
      const docClean = numero_documento.trim().toUpperCase();
      const { data: existingTravelers, error: fetchErr } = await supabase
        .from('travelers')
        .select('id, nombre, apellidos, numero_documento')
        .eq('reservation_code', reservation_code);

      if (fetchErr) throw fetchErr;

      const duplicate = existingTravelers?.find(
        (t: any) => t.numero_documento && t.numero_documento.trim().toUpperCase() === docClean && (!id || t.id !== id)
      );

      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: `El documento ${numero_documento} ya está registrado para ${duplicate.nombre} ${duplicate.apellidos} en esta reserva.`
        }, { status: 400 });
      }
    }

    // Standard manual fields validation for residency/contact (mandatory by RD 933/2021 for all travelers)
    if (!direccion || !codigo_postal || !municipio || !pais_residencia || !telefono || !email) {
      return NextResponse.json({
        success: false,
        error: 'Los campos de residencia habitual (Dirección, CP, Municipio, País) y de contacto (Teléfono, Email) son obligatorios para todos los viajeros.'
      }, { status: 400 });
    }

    // Province validation (Mandatory for Spain residents according to PDF)
    if (pais_residencia === 'ES' && !provincia) {
      return NextResponse.json({
        success: false,
        error: 'La provincia es obligatoria para residentes en España.'
      }, { status: 400 });
    }

    // System-forced default check-in/out hours
    const finalHoraEntrada = '16:00';
    const finalHoraSalida = '10:00';

    // Support number is physically not applicable and forced to null if document type is not Spanish DNI or NIE
    const isEspClean = (nacionalidad === 'ES' || nacionalidad === 'ESP');
    const isSpanishDniOrNieClean = (tipo_documento === 'DNI' && isEspClean) || tipo_documento === 'NIE';
    const cleanNumeroSoporte = isSpanishDniOrNieClean && numero_soporte ? numero_soporte.trim() : null;

    // 1. Discover columns in DB via OpenAPI to handle missing schema variables safely
    let existingColumns: string[] = [];
    try {
      const specRes = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (specRes.ok) {
        const spec = await specRes.json();
        if (spec.definitions && spec.definitions.travelers && spec.definitions.travelers.properties) {
          existingColumns = Object.keys(spec.definitions.travelers.properties);
        }
      }
    } catch (e: any) {
      console.error("Error al obtener especificación OpenAPI:", e.message);
    }

    // If OpenAPI failed, fallback to basic columns
    if (existingColumns.length === 0) {
      existingColumns = ['id', 'reservation_code', 'nombre', 'apellidos', 'tipo_documento', 'numero_documento', 'fecha_expedicion', 'fecha_caducidad', 'fecha_nacimiento', 'sexo', 'nacionalidad', 'firma', 'created_at'];
    }

    // 2. Identify missing columns to serialize them into the 'firma' field
    const missingColumns = [
      'direccion', 'codigo_postal', 'municipio', 'pais_residencia',
      'telefono', 'email', 'parentesco', 'adulto_responsable_id',
      'segundo_apellido', 'numero_soporte', 'provincia',
      'relacion_viajeros', 'firma_menor_16', 'hora_entrada', 'hora_salida',
      'has_accepted_terms', 'opt_out', 'data_scanned'
    ].filter(col => !existingColumns.includes(col));

    let finalFirma = firma;
    if (missingColumns.length > 0) {
      const serializedExtra: any = { firma };
      // Include all manually filled values in the serialized JSON
      if (direccion) serializedExtra.direccion = direccion;
      if (codigo_postal) serializedExtra.codigo_postal = codigo_postal;
      if (municipio) serializedExtra.municipio = municipio;
      if (pais_residencia) serializedExtra.pais_residencia = pais_residencia;
      if (telefono) serializedExtra.telefono = telefono;
      if (email) serializedExtra.email = email;
      if (parentesco) serializedExtra.parentesco = parentesco;
      if (adulto_responsable_id) serializedExtra.adulto_responsable_id = adulto_responsable_id;
      if (segundo_apellido) serializedExtra.segundo_apellido = segundo_apellido;
      if (cleanNumeroSoporte) serializedExtra.numero_soporte = cleanNumeroSoporte;
      if (provincia) serializedExtra.provincia = provincia;
      if (relacion_viajeros) serializedExtra.relacion_viajeros = relacion_viajeros;
      if (firma_menor_16 !== undefined) serializedExtra.firma_menor_16 = firma_menor_16;
      if (body.has_accepted_terms !== undefined) serializedExtra.has_accepted_terms = body.has_accepted_terms;
      if (body.opt_out !== undefined) serializedExtra.opt_out = body.opt_out;
      if (body.data_scanned !== undefined) serializedExtra.data_scanned = body.data_scanned;
      serializedExtra.hora_entrada = finalHoraEntrada;
      serializedExtra.hora_salida = finalHoraSalida;

      finalFirma = JSON.stringify(serializedExtra);
    }

    // Construct raw traveler payload
    const travelerData: any = {
      reservation_code,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      segundo_apellido: segundo_apellido ? segundo_apellido.trim() : null,
      numero_soporte: cleanNumeroSoporte,
      provincia: provincia ? provincia.trim() : null,
      tipo_documento: tipo_documento || 'DNI',
      numero_documento: numero_documento ? numero_documento.trim() : `MENOR-${Math.floor(Math.random() * 1000000)}`,
      fecha_expedicion: fecha_expedicion || null,
      fecha_caducidad: fecha_caducidad || null,
      fecha_nacimiento,
      sexo,
      nacionalidad: nacionalidad || 'ES',
      firma: finalFirma,
      direccion: direccion || null,
      codigo_postal: codigo_postal || null,
      municipio: municipio || null,
      pais_residencia: pais_residencia || null,
      telefono: telefono || null,
      email: email || null,
      parentesco: parentesco || null,
      adulto_responsable_id: adulto_responsable_id || null,
      relacion_viajeros: relacion_viajeros || null,
      firma_menor_16: firma_menor_16 !== undefined ? firma_menor_16 : false,
      has_accepted_terms: body.has_accepted_terms !== undefined ? body.has_accepted_terms : false,
      opt_out: body.opt_out !== undefined ? body.opt_out : false,
      data_scanned: body.data_scanned !== undefined ? body.data_scanned : false,
      hora_entrada: finalHoraEntrada,
      hora_salida: finalHoraSalida
    };

    // Filter properties to match only actual database columns
    const filteredTravelerData: any = {};
    Object.keys(travelerData).forEach(key => {
      if (existingColumns.includes(key)) {
        filteredTravelerData[key] = travelerData[key];
      }
    });

    console.log(id ? `Actualizando viajero ${id} en Supabase...` : `Insertando nuevo viajero en Supabase...`);
    
    let dbResult;
    if (id) {
      // Perform database update
      const { data, error: updateErr } = await supabase
        .from('travelers')
        .update(filteredTravelerData)
        .eq('id', id)
        .eq('reservation_code', reservation_code)
        .select();

      if (updateErr) {
        console.error("DB Update Error details:", updateErr);
        throw updateErr;
      }
      dbResult = data?.[0];
    } else {
      // Perform database insert
      const { data, error: insertErr } = await supabase
        .from('travelers')
        .insert([filteredTravelerData])
        .select();

      if (insertErr) {
        console.error("DB Insert Error details:", insertErr);
        throw insertErr;
      }
      dbResult = data?.[0];
    }

    // Sync State Engine
    try {
      const { syncReservationState } = require('../../../lib/sync');
      await syncReservationState(reservation_code);
    } catch (triggerErr) {
      console.error("Error running sync engine in traveler POST:", triggerErr);
    }

    // Return parsed result
    let finalReturned = dbResult;
    if (dbResult && dbResult.firma && dbResult.firma.trim().startsWith('{')) {
      try {
        const extra = JSON.parse(dbResult.firma);
        finalReturned = {
          ...dbResult,
          ...extra,
          firma: extra.firma || dbResult.firma
        };
      } catch (e) {
        console.error("Error deserializing on return:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: id ? 'Viajero actualizado con éxito.' : 'Viajero registrado con éxito.',
      data: finalReturned
    });

  } catch (error: any) {
    console.error('Error inserting/updating traveler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al guardar el registro en la base de datos.'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reservation_code = searchParams.get('reservation_code');

    if (!id || !reservation_code) {
      return NextResponse.json({ success: false, error: 'Falta id o reservation_code' }, { status: 400 });
    }

    const { error } = await supabase
      .from('travelers')
      .delete()
      .eq('id', id)
      .eq('reservation_code', reservation_code);

    if (error) {
      throw error;
    }

    // Sync State Engine
    try {
      const { syncReservationState } = require('../../../lib/sync');
      await syncReservationState(reservation_code);
    } catch (triggerErr) {
      console.error('Error running sync engine in traveler DELETE:', triggerErr);
    }

    return NextResponse.json({ success: true, message: 'Viajero eliminado con �xito' });
  } catch (error: any) {
    console.error('Error deleting traveler:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

