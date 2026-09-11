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
    WHERE standard_id = '302-2-30_room_heaters_product_manual_PM-IS_302-2-30-4_Dec2023' 
    ORDER BY page_number;
""")
rows = cur.fetchall()
for p, c in rows:
    print(f"--- PAGE {p} ---")
    print(c[:400] + ("..." if len(c) > 400 else ""))
cur.close()
conn.close()
