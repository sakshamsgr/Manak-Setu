import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("""
    SELECT standard_id, page_number, substring(content from 1 for 600) 
    FROM standard_chunks 
    WHERE standard_id IN ('CIRCULAR_EXTENSION_ELECTRIC_IRON', '366_ELECTRIC_IRON_AMENDMENT', 'GrantofLicence_366_ELECTRIC_IRON')
    ORDER BY standard_id, page_number
    LIMIT 6;
""")
for r in cur.fetchall():
    print(f"=== {r[0]} (page {r[1]}) ===")
    print(r[2])
    print()
cur.close()
conn.close()
