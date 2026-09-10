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
    SELECT standard_id, page_number, substring(content, 1, 200) 
    FROM standard_chunks 
    WHERE standard_id ILIKE '%iron%'
    ORDER BY standard_id, page_number;
""")
rows = cur.fetchall()
print(f"Total chunks matching iron: {len(rows)}")
by_id = {}
for sid, p, c in rows:
    by_id[sid] = by_id.get(sid, 0) + 1
for sid, cnt in by_id.items():
    print(f"  {sid}: {cnt} chunks")

# Check 302-part-2-sec-3-2024-electric_irons
print("\n--- 302-part-2-sec-3-2024-electric_irons sample ---")
cur.execute("SELECT page_number, content FROM standard_chunks WHERE standard_id = '302-part-2-sec-3-2024-electric_irons' LIMIT 5;")
for p, c in cur.fetchall():
    print(f"P{p}:", c[:150].replace('\n', ' '))

# Check IS_302_2_3_2024_Electric_Irons
print("\n--- IS_302_2_3_2024_Electric_Irons sample ---")
cur.execute("SELECT page_number, content FROM standard_chunks WHERE standard_id = 'IS_302_2_3_2024_Electric_Irons' LIMIT 5;")
for p, c in cur.fetchall():
    print(f"P{p}:", c[:150].replace('\n', ' '))

cur.close()
conn.close()
