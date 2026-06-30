const fs = require('fs');
let content = fs.readFileSync('app/viladefenals/acceso/[reservation_code]/registro/page.tsx', 'utf-8');

const fields = ['nombre', 'apellidos', 'segundo_apellido', 'tipo_documento', 'numero_documento', 'numero_soporte', 'fecha_expedicion', 'fecha_caducidad', 'fecha_nacimiento', 'nacionalidad', 'sexo', 'parentesco', 'adulto_responsable_id', 'direccion', 'codigo_postal', 'municipio', 'provincia', 'pais_residencia', 'telefono', 'email'];

for (let field of fields) {
  const isSelect = ['tipo_documento', 'nacionalidad', 'sexo', 'parentesco', 'adulto_responsable_id', 'pais_residencia'].includes(field);
  let validationField = field;
  if (field === 'apellidos') validationField = 'primer_apellido';

  const nameRegex = new RegExp(`(name="${field}"[^>]*?)className="[^"]+"`, 's');
  content = content.replace(nameRegex, `$1className={getFieldClass('${validationField}', ${isSelect})}`);
}

content = content.replace(/<(input|select)([^>]*?)\srequired([^>]*?)>/g, '<$1$2$3>');
content = content.replace(/<(input|select)([^>]*?)\srequired=\{[^}]+\}([^>]*?)>/g, '<$1$2$3>');

const fExpRegex = /name="fecha_expedicion"[^>]*?className=\{`[^`]+`\}/;
content = content.replace(fExpRegex, `name="fecha_expedicion" value={formData.fecha_expedicion} onChange={handleChange} className={getFieldClass('fecha_expedicion')}`);

fs.writeFileSync('app/viladefenals/acceso/[reservation_code]/registro/page.tsx', content);
