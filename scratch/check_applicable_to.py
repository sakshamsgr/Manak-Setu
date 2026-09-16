import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

cur.execute("""
SELECT DISTINCT applicable_to, count(*) 
FROM bis_fees 
GROUP BY applicable_to 
ORDER BY applicable_to;
""")
print("--- Distinct applicable_to in bis_fees ---")
for row in cur.fetchall():
    print(row)

cur.execute("""
SELECT DISTINCT s.id, s.standard_number, s.title
FROM standards s
LIMIT 20;
""")
print("\n--- Sample standards ---")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
