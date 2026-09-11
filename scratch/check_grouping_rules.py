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
    SELECT standard_id, group_code, group_name, condition, sample_requirement, preferred_sample, source_page 
    FROM grouping_rules 
    ORDER BY standard_id, id;
""")
rows = cur.fetchall()
print(f"Total grouping rules: {len(rows)}")
for r in rows:
    print(r[0], "|", r[1], "|", r[2], "|", r[3], "|", r[4], "| Page:", r[6])
cur.close()
conn.close()
