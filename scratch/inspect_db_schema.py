import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

# Check tables
cur.execute("""
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", [t for t in tables if "fee" in t or "standard" in t])

# Check columns
for t in ["bis_fees", "standards", "bis_standards"]:
    if t in tables:
        cur.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '{t}';
        """)
        print(f"\n--- {t} columns ---")
        for col, dtype in cur.fetchall():
            print(f"  {col}: {dtype}")

# Sample bis_fees records
if "bis_fees" in tables:
    cur.execute("SELECT * FROM bis_fees LIMIT 5;")
    cols = [desc[0] for desc in cur.description]
    print(f"\n--- bis_fees sample (cols: {cols}) ---")
    for row in cur.fetchall():
        print(dict(zip(cols, row)))

cur.close()
conn.close()
