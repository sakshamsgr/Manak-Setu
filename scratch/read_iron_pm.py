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
    WHERE standard_id = '302-part-2-sec-3-2024-electric_irons'
    ORDER BY page_number;
""")
for p, c in cur.fetchall():
    print(f"=== PAGE {p} ===")
    print(c)
cur.close()
conn.close()
