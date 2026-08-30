import os
import io
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import psycopg2
from pgvector.psycopg2 import register_vector
from supabase import create_client, Client
from google import genai
from google.genai import types

# --- Configuration ---
SUPABASE_URL = "https://ndpfmlkhxjphooyzvdxk.supabase.co"
# Find your 'service_role' or 'anon' key under Project Settings -> API Keys
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcGZtbGtoeGpwaG9veXp2ZHhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA2NzA4NiwiZXhwIjoyMTAzNjQzMDg2fQ.XplZIcOAmHS5O5J80bEvyMtb1UF79XyUfpLZ3TEOgDQ"
BUCKET_NAME = "bis_pdfs"

DB_URI = "postgresql://postgres.ndpfmlkhxjphooyzvdxk:sih_2026_sssddr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Tesseract binary path (adjust if needed on Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
ai_client = genai.Client()

def get_db_connection():
    conn = psycopg2.connect(DB_URI)
    register_vector(conn)
    return conn

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def process_and_index():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Fetch list of files in the bucket
    print("Checking Supabase Storage bucket for PDF files...")
    files = supabase.storage.from_(BUCKET_NAME).list()
    
    # 2. Check which files are already indexed in PostgreSQL
    cursor.execute("SELECT id FROM bis_standards;")
    indexed_standards = {row[0] for row in cursor.fetchall()}

    for file_obj in files:
        filename = file_obj['name']
        if not filename.lower().endswith('.pdf'):
            continue

        standard_id = filename.rsplit('.', 1)[0]

        if standard_id in indexed_standards:
            print(f"Skipping '{filename}' (already indexed).")
            continue

        print(f"\nNew file detected: '{filename}'. Downloading from cloud...")
        pdf_bytes = supabase.storage.from_(BUCKET_NAME).download(filename)
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)

        # 3. Read PDF with PyMuPDF & OCR
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        print(f"Processing {len(pdf_doc)} pages with OCR...")

        # Register standard in metadata table
        cursor.execute("""
            INSERT INTO bis_standards (id, title, year, pdf_url)
            VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING;
        """, (standard_id, standard_id.replace("_", " "), 2026, public_url))
        conn.commit()

        # 4. Extract text page-by-page
        for page_idx in range(len(pdf_doc)):
            page = pdf_doc[page_idx]
            text = page.get_text()

            # If page is scanned/image-only, run OCR
            if len(text.strip()) < 30:
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                text = pytesseract.image_to_string(img)

            if not text.strip():
                continue

            # 5. Split into chunks and generate vector embeddings
            chunks = chunk_text(text, chunk_size=300, overlap=50)
            for chunk in chunks:
                response = ai_client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=chunk,
                    config=types.EmbedContentConfig(output_dimensionality=768)
                )
                embedding = response.embeddings[0].values

                cursor.execute("""
                    INSERT INTO standard_chunks (standard_id, page_number, content, embedding)
                    VALUES (%s, %s, %s, %s);
                """, (standard_id, page_idx + 1, chunk, embedding))

        conn.commit()
        print(f"Successfully processed and indexed '{filename}'.")

    cursor.close()
    conn.close()
    print("\nCloud sync complete!")

if __name__ == "__main__":
    process_and_index()