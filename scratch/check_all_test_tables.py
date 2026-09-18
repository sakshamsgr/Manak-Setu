import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()

print("=== 1. ALL DISTINCT standard_id in standard_tests ===")
cur.execute("SELECT standard_id, COUNT(*) FROM standard_tests GROUP BY standard_id ORDER BY standard_id;")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1]} rows")

print("\n=== 2. ANY TABLE WITH 'test' in its name ===")
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name ILIKE '%test%';
""")
for r in cur.fetchall():
    print("  table:", r[0])

print("\n=== 3. CHECK standard_chunks FOR TEST HEADINGS OR CLAUSES ===")
cur.execute("""
    SELECT standard_id, page_number, substring(content from 1 for 150)
    FROM standard_chunks
    WHERE content ILIKE '%routine test%' OR content ILIKE '%type test%' OR content ILIKE '%acceptance test%'
    LIMIT 10;
""")
for r in cur.fetchall():
    print(f"  chunk [{r[0]} p.{r[1]}]: {r[2]}")

print("\n=== 4. CHECK standard_documents ===")
cur.execute("SELECT id, standard_id, document_type, title, file_url FROM standard_documents;")
for r in cur.fetchall():
    print("  std_doc:", r)

print("\n=== 5. CHECK bis_ingestion_documents ===")
cur.execute("SELECT id, standard_number, title, document_type, status FROM bis_ingestion_documents;")
for r in cur.fetchall():
    print("  ingestion_doc:", r)

cur.close()
conn.close()
