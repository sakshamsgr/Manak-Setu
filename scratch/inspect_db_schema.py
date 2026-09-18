import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import psycopg2, json
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

conn = get_db()
cur = conn.cursor()

# 1. List all tables
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print('=== TABLES IN DB ===')
for t in tables:
    print(' -', t)

# 2. Check for any table with 'test' or 'standard' in name
print('\n=== COLUMNS IN TEST-RELATED TABLES ===')
for t in tables:
    if any(k in t.lower() for k in ['test', 'standard', 'clause', 'param', 'requir', 'bis']):
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
        """, (t,))
        cols = cur.fetchall()
        print(f"\nTable: {t}")
        for c, dt in cols:
            print(f"   {c}: {dt}")

cur.close()
conn.close()
