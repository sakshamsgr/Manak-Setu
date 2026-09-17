import os
import io
import time
import json
import re
import hashlib
import logging
import pymupdf
import pytesseract
from PIL import Image
import psycopg2
from pgvector.psycopg2 import register_vector
from supabase import create_client, Client
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# --- Configuration & Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DB_URI = os.getenv("DB_URI")
BUCKET_NAME = "bis_pdfs"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
ai_client = genai.Client()

# --- Universal Regex Patterns ---
STRICT_IS_PATTERN = re.compile(
    r'\b(?:IS|I\.S\.)[\s\-\:]*(\d{2,5}(?:[\s\-\:\/\.\(\)]*(?:PART|SEC|SECTION|PT)[\s\-\:\/\.\(\)]*\d{1,3}|[\-\:\/]+\d{1,3})*)', 
    re.IGNORECASE
)
BLACKLIST_TOKENS = {'110002', '1980', '1990', '1997', '2000', '2005', '2009', '2014', '2016', '2017', '2018', '2020', '2022', '2024', '2026'}
COMPLIANCE_TRIGGERS = {'shall', 'must', 'requirement', 'voltage', 'test', 'marking', 'class', 'scope', 'compliance', 'safety', 'current', 'temperature'}

def get_db_connection():
    conn = psycopg2.connect(DB_URI)
    register_vector(conn)
    return conn

def resolve_standard_id(filename: str) -> str:
    """Strictly uses the exact raw filename as the ID to perfectly match the old database convention."""
    return filename.rsplit('.', 1)[0]

def normalize_is_code(raw_code: str) -> str:
    if not raw_code: return None
    cleaned = raw_code.upper()
    cleaned = re.sub(r'\s*(?:PART|SEC|SECTION|PT)\s*', '-', cleaned)
    cleaned = re.sub(r'[\:\/\.]+', '-', cleaned)
    cleaned = re.sub(r'[^\d-]', '', cleaned)
    cleaned = re.sub(r'-+', '-', cleaned).strip('-')
    cleaned = re.sub(r'-(?:19|20)\d{2}$', '', cleaned)
    return cleaned if cleaned and cleaned not in BLACKLIST_TOKENS else None

# --- PDF Parsing Engine ---
def process_standard_page(page, page_num, pdf_filename, primary_is_code, current_code_memory):
    records, table_bboxes = [], []
    tabs = page.find_tables()
    if tabs and hasattr(tabs, 'tables'):
        for tab in tabs.tables:
            table_bboxes.append(tab.bbox)
            for row in tab.extract():
                clean_row = [str(cell).replace('\n', ' ').strip() for cell in row if cell is not None and str(cell).strip()]
                if not clean_row: continue
                row_text = " | ".join(clean_row)
                if len(row_text) < 15: continue
                match = STRICT_IS_PATTERN.search(row_text)
                block_is_code = normalize_is_code(match.group(1)) if match else None
                assigned_code = current_code_memory or primary_is_code
                records.append({"page": page_num, "doc_type": "Standard Document", "matched_is_code": assigned_code, "chunk_text": f"Table Record: {row_text}"})

    blocks = page.get_text("blocks")
    text_blocks = []
    for b in blocks:
        if b[6] != 0: continue
        rect = pymupdf.Rect(b[:4])
        if not any(rect.intersects(pymupdf.Rect(t)) for t in table_bboxes):
            text_blocks.append(b[4].replace('\n', ' ').strip())

    if not text_blocks and not table_bboxes:
        pix = page.get_pixmap(dpi=150)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert('L')
        ocr_text = pytesseract.image_to_string(img, lang='eng', config='--psm 4')
        text_blocks = [b.replace('\n', ' ').strip() for b in re.split(r'\n\s*\n', ocr_text)]

    for block in text_blocks:
        if len(block) < 40: continue
        match = STRICT_IS_PATTERN.search(block)
        if match: current_code_memory = normalize_is_code(match.group(1))
        assigned_code = current_code_memory or primary_is_code
        if any(kw in block.lower() for kw in COMPLIANCE_TRIGGERS) or match:
            records.append({"page": page_num, "doc_type": "Standard Document", "matched_is_code": assigned_code, "chunk_text": block})
            
    return records, current_code_memory

def extract_structured_tests(pdf_bytes):
    """Parses structured test clauses using gemini-3.6-flash into the schema format required by `standard_tests`."""
    print("-> Extracting structured test parameters for UI table...")
    try:
        with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
            full_text = "".join([page.get_text() + "\n" for page in doc])
        
        prompt = f"""
        Analyze the following Indian Standard document text and extract EVERY SINGLE technical test clause, requirement, test method, equipment requirement, sample quantity, frequency, and testing type into a valid JSON array.
        You must be exhaustive. Do NOT summarize or skip any test clauses.
        
        Each object must match these exact keys:
        - "clause": string (e.g., "Clause 8")
        - "requirement": string
        - "test_method": string
        - "equipment_requirement": string or null
        - "sample_quantity": string or null
        - "frequency": string or null
        - "testing_type": string (must be either "ROUTINE" or "TYPE & ACCEPTANCE")
        - "remarks": string or null
        
        Return ONLY valid JSON format with no markdown wrappers. If none found, return [].

        Document Excerpt:
        {full_text}
        """

        response = ai_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        raw_text = response.text.strip()
        
        # Invincible JSON cleanup logic in case LLM forces markdown wrappers
        if raw_text.startswith("```"):
            raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text, flags=re.IGNORECASE)
            raw_text = re.sub(r'\s*```$', '', raw_text)
            
        tests = json.loads(raw_text)
        return tests if isinstance(tests, list) else []
    except Exception as e:
        print(f"    [!] Warning: Failed to extract structured tests: {e}")
        return []

def parse_pdf_stream(pdf_bytes, filename):
    file_records = []
    primary_is_code = None
    fname_match = STRICT_IS_PATTERN.search(filename.replace('_', ' '))
    if fname_match: primary_is_code = normalize_is_code(fname_match.group(1))
    current_code_memory = primary_is_code

    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page_idx, page in enumerate(doc):
            recs, current_code_memory = process_standard_page(page, page_idx + 1, filename, primary_is_code, current_code_memory)
            file_records.extend(recs)
    return file_records

# --- Main Workflow ---
def run_cloud_sync():
    print("Checking Supabase Storage bucket for PDF files...")
    files = supabase.storage.from_(BUCKET_NAME).list()
    
    if not files:
        print(f"[!] No files found in bucket '{BUCKET_NAME}'.")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    # Using the exact old logic: checking standard_chunks for non-null embeddings
    cursor.execute("SELECT DISTINCT standard_id FROM standard_chunks WHERE embedding IS NOT NULL;")
    indexed_standards = {row[0] for row in cursor.fetchall()}

    for file_obj in files:
        filename = file_obj['name']
        if not filename.lower().endswith('.pdf'):
            continue

        standard_id = resolve_standard_id(filename)

        if standard_id in indexed_standards:
            print(f"[-] Skipping '{filename}' (already indexed with embeddings).")
            continue

        print(f"\n[+] Processing new file: '{filename}' -> Resolved Standard ID: '{standard_id}'. Downloading...")
        try:
            pdf_bytes = supabase.storage.from_(BUCKET_NAME).download(filename)
            public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        except Exception as e:
            print(f"    [!] Failed to download {filename}: {e}")
            continue

        records = parse_pdf_stream(pdf_bytes, filename)

        # 1. Register in `bis_standards`
        cursor.execute("""
            INSERT INTO bis_standards (id, title, year, pdf_url)
            VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET pdf_url = EXCLUDED.pdf_url;
        """, (standard_id, standard_id, 2026, public_url))
        
        # Clear existing records purely for safety during processing of this specific new file
        cursor.execute("DELETE FROM standard_chunks WHERE standard_id = %s;", (standard_id,))
        cursor.execute("DELETE FROM standard_tests WHERE standard_id = %s;", (standard_id,))
        conn.commit()

        # 2. Populate `standard_tests` for UI tables
        structured_tests = extract_structured_tests(pdf_bytes)
        if structured_tests:
            print(f"-> Inserting {len(structured_tests)} test clauses into `standard_tests`...")
            for test in structured_tests:
                cursor.execute("""
                    INSERT INTO standard_tests (
                        standard_id, clause, requirement, test_method, 
                        equipment_requirement, sample_quantity, frequency, testing_type, remarks, source_page
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    standard_id,
                    test.get("clause"),
                    test.get("requirement"),
                    test.get("test_method"),
                    test.get("equipment_requirement"),
                    test.get("sample_quantity"),
                    test.get("frequency"),
                    test.get("testing_type", "ROUTINE"),
                    test.get("remarks"),
                    1
                ))
            conn.commit()

        # 3. FAST BATCH VECTORIZATION
        print(f"-> Generating vectors for {len(records)} chunks using high-speed batching...")
        
        valid_records = []
        for record in records:
            raw_text = record.get("chunk_text", "")
            if not raw_text.strip(): continue
            
            page_num = record.get("page", 1)
            enriched_content = f"[Standard: {standard_id} | Page: {page_num}]\n{raw_text}"
            chunk_hash = hashlib.sha256(enriched_content.encode('utf-8')).hexdigest()
            
            valid_records.append({
                "page_num": page_num,
                "content": enriched_content,
                "hash": chunk_hash
            })

        BATCH_SIZE = 50 
        
        for i in range(0, len(valid_records), BATCH_SIZE):
            batch = valid_records[i : i + BATCH_SIZE]
            batch_contents = [item["content"] for item in batch]
            
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    response = ai_client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=batch_contents,
                        config=types.EmbedContentConfig(output_dimensionality=768)
                    )
                    
                    for j, item in enumerate(batch):
                        embedding = response.embeddings[j].values
                        cursor.execute("""
                            INSERT INTO standard_chunks (standard_id, page_number, content, embedding, chunk_hash)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (chunk_hash) DO NOTHING;
                        """, (standard_id, item["page_num"], item["content"], embedding, item["hash"]))
                    
                    break  
                except Exception as e:
                    if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                        sleep_time = 2 ** (attempt + 1)
                        print(f"    [!] API Rate Limit Hit on batch. Pausing for {sleep_time} seconds (Attempt {attempt+1}/{max_retries})...")
                        time.sleep(sleep_time)
                    else:
                        print(f"    [!] Error embedding batch: {e}")
                        break
            
            time.sleep(1.0)

        conn.commit()
        print(f"Successfully processed and indexed '{filename}'.")

    cursor.close()
    conn.close()
    print("\nCloud sync complete!")

if __name__ == "__main__":
    run_cloud_sync()