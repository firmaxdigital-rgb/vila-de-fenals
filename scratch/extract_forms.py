import os
import sys

# Ensure pypdf is installed
try:
    import pypdf
except ImportError:
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

folder = r"c:\Users\elmig\Documents\MCC IA\Vila de Fenals\materia_huespedes\HM582Y32HZ"
files = [
    "Dylan - Registration Form - firmado.pdf",
    "Gijs - Registration Form - firmado.pdf",
    "Siard - Registration Form - firmado.pdf",
    "Wolter - Registration Form - firmado.pdf"
]

for name in files:
    path = os.path.join(folder, name)
    print(f"=== FILE: {name} ===")
    try:
        reader = pypdf.PdfReader(path)
        text = ""
        for i, page in enumerate(reader.pages):
            text += page.extract_text() + "\n"
        print(text)
    except Exception as e:
        print(f"Error reading {name}: {e}")
    print("-" * 50)
