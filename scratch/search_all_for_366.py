import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
""")
tables = [r[0] for r in cur.fetchall()]

print("Searching ALL tables for '366'...")
for table in tables:
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = %s;
    """, (table,))
    cols = cur.fetchall()
    text_cols = [c[0] for c in cols if c[1] in ('text', 'character varying', 'jsonb', 'json')]
    if not text_cols:
        continue
    
    where_clauses = [f"CAST({c} AS text) ILIKE '%366%'" for c in text_cols]
    query = f"SELECT COUNT(*) FROM {table} WHERE " + " OR ".join(where_clauses)
    try:
        cur.execute(query)
        cnt = cur.fetchone()[0]
        if cnt > 0:
            print(f"Table '{table}': {cnt} rows matching '366'")
    except Exception as e:
        conn.rollback()
        print(f"  Error querying {table}: {e}")

cur.close()
conn.close()
