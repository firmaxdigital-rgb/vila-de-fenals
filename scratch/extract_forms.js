global.DOMMatrix = class DOMMatrix {};
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const targetFolder = "c:/Users/elmig/Documents/MCC IA/Vila de Fenals/materia_huespedes/HM582Y32HZ";
const files = [
  "Dylan - Registration Form - firmado.pdf",
  "Gijs - Registration Form - firmado.pdf",
  "Siard - Registration Form - firmado.pdf",
  "Wolter - Registration Form - firmado.pdf"
];

async function extract() {
  for (const file of files) {
    const filePath = path.join(targetFolder, file);
    console.log(`=== FILE: ${file} ===`);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const uint8Array = new Uint8Array(dataBuffer);
      const pdfInstance = new PDFParse(uint8Array);
      const data = await pdfInstance.getText();
      console.log(data.text || data);
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
    console.log("-".repeat(50));
  }
}

extract();
