const fs = require('fs');
let content = fs.readFileSync('lib/countries.ts', 'utf8');
content = content.replace(/nameEs:\s*'([^']+)'\s*\}/g, "nameEs: '$1', nameEn: '$1' }");
content = content.replace('nameEs: string;', 'nameEs: string;\n  nameEn: string;');
fs.writeFileSync('lib/countries.ts', content);
