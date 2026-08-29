import os
import json
import re
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import pandas as pd
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- IMPORTANT: Point this to where you installed Tesseract! ---
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 1. Configuration
PDF_FOLDER = "pdfs"
OUTPUT_FILE = "output/bis_chunks_ocr.json"

os.makedirs("output", exist_ok=True)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=120,
    separators=["\n\n", "\n", " ", ""]
)

all_chunks = []

print("Starting OCR Extraction. This will take a few minutes as the AI reads the images...")

for file_name in os.listdir(PDF_FOLDER):
    if not file_name.endswith(".pdf"):
        continue

    file_path = os.path.join(PDF_FOLDER, file_name)
    doc = fitz.open(file_path)
    doc_id = file_name.replace(".pdf", "")

    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # 2. Turn the PDF page into a high-resolution image
        pix = page.get_pixmap(dpi=300) 
        
        # 3. Convert the PyMuPDF image into a Pillow image that Tesseract understands
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # 4. Use Tesseract OCR to read the text from the image!
        raw_text = pytesseract.image_to_string(img)

        # Clean up weird line breaks and OCR artifacts
        cleaned_text = " ".join(raw_text.split())

        # Skip empty pages
        if len(cleaned_text) < 40:
            continue

        # 5. Split the newly read text into chunks
        page_chunks = text_splitter.split_text(cleaned_text)

        for chunk_idx, chunk in enumerate(page_chunks):
            if len(chunk.strip()) > 50:
                all_chunks.append({
                    "standard_id": doc_id,
                    "page_number": page_num + 1,
                    "chunk_id": f"{doc_id}_p{page_num + 1}_c{chunk_idx + 1}",
                    "text": chunk
                })
                
        print(f"Processed Page {page_num + 1}...")

    doc.close()

# 6. Save the OCR chunks
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(all_chunks, f, indent=2, ensure_ascii=False)

print(f"\nOCR Extraction Complete! Found {len(all_chunks)} text chunks.")