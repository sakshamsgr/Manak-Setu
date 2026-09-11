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
    SELECT clause, requirement, test_method, equipment_requirement, sample_quantity, frequency, testing_type, remarks, source_page
    FROM standard_tests
    WHERE standard_id = '302-part-2-sec-3-2024-electric-irons'
    ORDER BY id;
""")
rows = cur.fetchall()
print(f"Total rows: {len(rows)}")
for r in rows:
    print(r)
cur.close()
conn.close()
