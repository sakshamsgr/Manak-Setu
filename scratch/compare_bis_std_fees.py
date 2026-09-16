import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

cur.execute("SELECT id, title FROM bis_standards;")
bs_rows = cur.fetchall()
print(f"Total bis_standards: {len(bs_rows)}")
for r in bs_rows[:15]:
    print(r)

cur.execute("SELECT DISTINCT applicable_to FROM bis_fees;")
fees_apps = cur.fetchall()
print("\nbis_fees applicable_to:")
for f in fees_apps:
    print(f)

cur.close()
conn.close()
