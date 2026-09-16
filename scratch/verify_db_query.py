import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

# 4. Run database query equivalent to:
# SELECT DISTINCT s.id, s.standard_number, s.title
# FROM public.bis_standards s
# INNER JOIN public.bis_fees f ON f.standard_id = s.id
# ORDER BY s.standard_number;
# (or whichever tables are actually used in the schema)

print("=== Running Database Query: public.standards JOIN public.bis_fees ===")
cur.execute("""
SELECT DISTINCT s.id::text, s.standard_number, s.title
FROM public.standards s
INNER JOIN public.bis_fees f ON f.standard_id = s.id
ORDER BY s.standard_number;
""")
rows = cur.fetchall()
print(f"Count: {len(rows)}")
for idx, (sid, snum, stitle) in enumerate(rows, 1):
    print(f"{idx}. [{snum}] {stitle} (ID: {sid})")

cur.close()
conn.close()
