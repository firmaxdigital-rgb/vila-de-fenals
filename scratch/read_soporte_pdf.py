import sys
import os

pdf_path = r"c:\Users\elmig\Documents\MCC IA\Vila de Fenals\materia_huespedes\Informacion_Numero_Soporte.pdf"
output_path = r"c:\Users\elmig\Documents\MCC IA\Vila de Fenals\scratch\soporte_pdf_text.txt"

try:
    import pypdf
    reader = pypdf.PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS: Extraction successful using pypdf!")
except Exception as e:
    print("ERROR: Failed to extract PDF: " + str(e))
