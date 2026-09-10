import sys, os
sys.path.insert(0, os.path.abspath('.'))
sys.stdout.reconfigure(encoding='utf-8')
import psycopg2
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("""
    SELECT page_number, content 
    FROM standard_chunks 
    WHERE standard_id = '302-2-3_electric_irons_product_manual_PM-IS_302-Part2-Sec3-IEC60335-2-3-2_Oct2024'
    ORDER BY page_number;
""")
rows = cur.fetchall()
print(f"Total chunks for electric iron PM: {len(rows)}")
for p, c in rows:
    print(f"--- PAGE {p} ---")
    print(c[:350].replace('\n', ' '))
cur.close()
conn.close()
