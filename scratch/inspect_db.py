import psycopg2, os, sys
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()
db_uri = os.getenv('DATABASE_URL') or 'postgresql://postgres.ndpfmlkhxjphooyzvdxk:sih_2026_sssddr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
conn = psycopg2.connect(db_uri)
cur = conn.cursor()

cur.execute("SELECT standard_id, page_number, substring(content, 1, 200) FROM standard_chunks WHERE standard_id ILIKE '%302-2-30%' OR standard_id ILIKE '%369%' ORDER BY page_number LIMIT 20;")
for r in cur.fetchall():
    print(r[0], f"Page {r[1]}:", r[2].replace("\n", " "))

cur.close()
conn.close()
