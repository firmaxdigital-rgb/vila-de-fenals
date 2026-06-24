const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwvwniktgmxuooqkpdc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is not defined in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const code = 'HM582Y32HZ';
  console.log(`🚀 Starting database seeding for reservation ${code}...`);

  // Define Gijs, Wolter, and Dylan (Adults)
  const adults = [
    {
      nombre: 'Dylan',
      apellidos: 'Hopman',
      tipo_documento: 'PASAPORTE',
      numero_documento: 'NND1CJD64',
      fecha_nacimiento: '2008-03-28',
      fecha_expedicion: '2020-01-01', // Placeholder
      fecha_caducidad: '2030-01-01',  // Placeholder
      sexo: 'M',
      nacionalidad: 'NL',
      has_accepted_terms: false,
      opt_out: false,
      extra: {
        direccion: 'P.j.c gabrielgaarde 16',
        codigo_postal: '',
        municipio: 'Noord Holland',
        pais_residencia: 'NL',
        telefono: '0653241780',
        email: 'dylanhopman@gmail.com',
        segundo_apellido: '',
        numero_soporte: null,
        provincia: 'Noord Holland',
        relacion_viajeros: 'Friends',
        firma_menor_16: false,
        has_accepted_terms: false,
        opt_out: false,
        hora_entrada: '16:00',
        hora_salida: '10:00',
        fecha_expedicion: '2020-01-01',
        fecha_caducidad: '2030-01-01'
      }
    },
    {
      nombre: 'Gijs',
      apellidos: 'Eeken',
      tipo_documento: 'OTRO',
      numero_documento: 'IG5J554H1',
      fecha_nacimiento: '2007-07-07',
      fecha_expedicion: '2020-01-01', // Placeholder
      fecha_caducidad: '2030-01-01',  // Placeholder
      sexo: 'M',
      nacionalidad: 'NL',
      has_accepted_terms: false,
      opt_out: false,
      extra: {
        direccion: 'Egelstraat 31 Hilversum',
        codigo_postal: '',
        municipio: 'Hilversum',
        pais_residencia: 'NL',
        telefono: '+31 6 51652361',
        email: 'gijsj.eeken@gmail.com',
        segundo_apellido: '',
        numero_soporte: null,
        provincia: '',
        relacion_viajeros: 'Friends',
        firma_menor_16: false,
        has_accepted_terms: false,
        opt_out: false,
        hora_entrada: '16:00',
        hora_salida: '10:00',
        fecha_expedicion: '2020-01-01',
        fecha_caducidad: '2030-01-01'
      }
    },
    {
      nombre: 'Wolter Seb',
      apellidos: 'De jager',
      tipo_documento: 'OTRO',
      numero_documento: '428723561',
      fecha_nacimiento: '2008-04-06',
      fecha_expedicion: '2020-01-01', // Placeholder
      fecha_caducidad: '2030-01-01',  // Placeholder
      sexo: 'M',
      nacionalidad: 'NL',
      has_accepted_terms: false,
      opt_out: false,
      extra: {
        direccion: 'Vossenstraat 28 1216AE Hilversum',
        codigo_postal: '1216AE',
        municipio: 'Hilversum',
        pais_residencia: 'NL',
        telefono: '+31640837269',
        email: 'Sebdejager@hotmail.com',
        segundo_apellido: '',
        numero_soporte: null,
        provincia: 'Noord Holland',
        relacion_viajeros: 'School friends',
        firma_menor_16: false,
        has_accepted_terms: false,
        opt_out: false,
        hora_entrada: '16:00',
        hora_salida: '10:00',
        fecha_expedicion: '2020-01-01',
        fecha_caducidad: '2030-01-01'
      }
    }
  ];

  const insertedAdults = [];

  for (const adult of adults) {
    const payload = {
      reservation_code: code,
      nombre: adult.nombre,
      apellidos: adult.apellidos,
      tipo_documento: adult.tipo_documento,
      numero_documento: adult.numero_documento,
      fecha_nacimiento: adult.fecha_nacimiento,
      fecha_expedicion: adult.fecha_expedicion,
      fecha_caducidad: adult.fecha_caducidad,
      sexo: adult.sexo,
      nacionalidad: adult.nacionalidad,
      has_accepted_terms: adult.has_accepted_terms,
      opt_out: adult.opt_out,
      firma: JSON.stringify({
        firma: null,
        ...adult.extra
      })
    };

    console.log(`Inserting adult: ${adult.nombre} ${adult.apellidos}...`);
    const { data, error } = await supabase
      .from('travelers')
      .insert([payload])
      .select();

    if (error) {
      console.error(`❌ Error inserting ${adult.nombre}:`, error.message);
      process.exit(1);
    }

    console.log(`✅ Inserted ${adult.nombre} with ID ${data[0].id}`);
    insertedAdults.push(data[0]);
  }

  // Choose Dylan Hopman as the responsible adult for Siard Bosma (minor)
  const responsibleAdult = insertedAdults.find(a => a.nombre === 'Dylan') || insertedAdults[0];
  console.log(`\nResponsible adult selected: ${responsibleAdult.nombre} ${responsibleAdult.apellidos} (ID: ${responsibleAdult.id})`);

  // Define Siard Bosma (Minor)
  const minor = {
    nombre: 'Siard',
    apellidos: 'Bosma',
    tipo_documento: 'OTRO',
    numero_documento: 'IXRFK1LB8',
    fecha_nacimiento: '2008-12-20',
    fecha_expedicion: '2020-01-01', // Placeholder
    fecha_caducidad: '2030-01-01',  // Placeholder
    sexo: 'M',
    nacionalidad: 'NL',
    has_accepted_terms: false,
    opt_out: false,
    extra: {
      direccion: 'C.H.Knorrlaan 77',
      codigo_postal: '',
      municipio: 'Loosdrecht',
      pais_residencia: 'NL',
      telefono: '31638062670',
      email: 'Siard.bosma@xs4all.nl',
      segundo_apellido: '',
      numero_soporte: null,
      provincia: '',
      parentesco: 'Friends',
      adulto_responsable_id: responsibleAdult.id,
      relacion_viajeros: 'Friends',
      firma_menor_16: false,
      has_accepted_terms: false,
      opt_out: false,
      hora_entrada: '16:00',
      hora_salida: '10:00',
      fecha_expedicion: '2020-01-01',
      fecha_caducidad: '2030-01-01'
    }
  };

  const minorPayload = {
    reservation_code: code,
    nombre: minor.nombre,
    apellidos: minor.apellidos,
    tipo_documento: minor.tipo_documento,
    numero_documento: minor.numero_documento,
    fecha_nacimiento: minor.fecha_nacimiento,
    fecha_expedicion: minor.fecha_expedicion,
    fecha_caducidad: minor.fecha_caducidad,
    sexo: minor.sexo,
    nacionalidad: minor.nacionalidad,
    has_accepted_terms: minor.has_accepted_terms,
    opt_out: minor.opt_out,
    firma: JSON.stringify({
      firma: null,
      ...minor.extra
    })
  };

  console.log(`Inserting minor: ${minor.nombre} ${minor.apellidos}...`);
  const { data: minorData, error: minorError } = await supabase
    .from('travelers')
    .insert([minorPayload])
    .select();

  if (minorError) {
    console.error(`❌ Error inserting minor ${minor.nombre}:`, minorError.message);
    process.exit(1);
  }

  console.log(`✅ Inserted minor ${minor.nombre} with ID ${minorData[0].id}`);
  console.log(`🎉 Seeding completed successfully!`);
}

run();
