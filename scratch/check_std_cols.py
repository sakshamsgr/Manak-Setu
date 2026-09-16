import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()
cur.execute("""
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%standard%'
ORDER BY table_name, column_name;
""")
for r in cur.fetchall():
    print(r)
cur.close()
conn.close()
