import json
import psycopg2
from pgvector.psycopg2 import register_vector
from google import genai
import os
from google.genai import types

# 1. Setup Connections
# REPLACE THIS WITH YOUR DIRECT CONNECTION STRING URI
DB_URI = "postgresql://postgres.ndpfmlkhxjphooyzvdxk:sih_2026_sssddr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

print("Connecting to Supabase...")
conn = psycopg2.connect(DB_URI)
register_vector(conn)
cursor = conn.cursor()

# Initialize Gemini for Embeddings
client = genai.Client()

# 2. Load Local Chunk Data
with open("output/bis_chunks_ocr.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

# 3. Insert the Standard Metadata
# We use ON CONFLICT DO NOTHING so you can safely run this script multiple times
print("Registering IS 8716 Standard...")
cursor.execute("""
    INSERT INTO bis_standards (id, title, year, pdf_url) 
    VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING;
""", ("IS_8716_1978_Packaging_Household_Appliances", "CODE OF PRACTICE FOR PACKAGING OF HOUSEHOLD ELECTRICAL APPLIANCES", 1978, "https://example.com/is8716.pdf"))
conn.commit()

# 4. Upload Chunks & Generate Vectors
print(f"Uploading {len(chunks)} chunks to Supabase. Generating embeddings...")
for i, chunk in enumerate(chunks):
    text = chunk["text"]
    std_id = chunk["standard_id"]
    page = chunk["page_number"]
    
    # Generate the 768-dimensional vector using Gemini
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )

    embedding = response.embeddings[0].values
    
    # Insert the text and vector into PostgreSQL
    cursor.execute("""
        INSERT INTO standard_chunks (standard_id, page_number, content, embedding)
        VALUES (%s, %s, %s, %s);
    """, (std_id, page, text, embedding))
    
    if i % 5 == 0 and i > 0:
        print(f"Uploaded {i} chunks...")
        
conn.commit()
cursor.close()
conn.close()
print("Migration Complete! Your data is now successfully hosted in the cloud.")