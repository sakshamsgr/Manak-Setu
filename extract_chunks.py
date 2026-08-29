import os
import json
import re
import fitz  # PyMuPDF
import pandas as pd
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 1. Configuration
PDF_FOLDER = "pdfs"
OUTPUT_FILE = "output/bis_chunks.json"
OUTPUT_CSV = "output/bis_chunks.csv"

os.makedirs("output", exist_ok=True)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=120,
    separators=["\n\n", "\n", " ", ""]
)

all_chunks = []

for file_name in os.listdir(PDF_FOLDER):
    if not file_name.endswith(".pdf"):
        continue

    file_path = os.path.join(PDF_FOLDER, file_name)
    doc = fitz.open(file_path)
    doc_id = file_name.replace(".pdf", "")

    for page_num in range(len(doc)):
        page = doc[page_num]
        raw_text = page.get_text("text")

        # Strip BIS watermarks and recurring header lines
        cleaned_text = re.sub(r"Free Standard provided by BIS.*?\n", "", raw_text, flags=re.IGNORECASE)
        cleaned_text = re.sub(r"IS:\s*8716-1978", "", cleaned_text)
        cleaned_text = " ".join(cleaned_text.split())

        # Skip empty pages or short header fragments
        if len(cleaned_text) < 40:
            continue

        page_chunks = text_splitter.split_text(cleaned_text)

        for chunk_idx, chunk in enumerate(page_chunks):
            # Only keep chunks with meaningful text length
            if len(chunk.strip()) > 50:
                all_chunks.append({
                    "standard_id": doc_id,
                    "page_number": page_num + 1,
                    "chunk_id": f"{doc_id}_p{page_num + 1}_c{chunk_idx + 1}",
                    "text": chunk
                })

    doc.close()

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(all_chunks, f, indent=2, ensure_ascii=False)

df = pd.DataFrame(all_chunks)
df.to_csv(OUTPUT_CSV, index=False)

print(f"Clean extraction complete! Extracted {len(all_chunks)} quality chunks.")