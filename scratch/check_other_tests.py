import sys, os
sys.path.insert(0, os.path.abspath('.'))
sys.stdout.reconfigure(encoding='utf-8')
import psycopg2
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()
for sid in ['368-2014-electric-immersion-water-heaters', '302-part-2-sec-80-2017-fans', '302-part-2-sec-7-2024-domestic-electric-clothes-washing-machines']:
    cur.execute("""
        SELECT clause, requirement, test_method, frequency, testing_type, source_page 
        FROM standard_tests 
        WHERE standard_id = %s 
        ORDER BY id;
    """, (sid,))
    rows = cur.fetchall()
    print(f"\n=== STANDARD: {sid} ({len(rows)} tests) ===")
    for r in rows[:5]:
        print(r)
cur.close()
conn.close()
