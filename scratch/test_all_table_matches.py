import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db, resolve_matching_standard_id

conn = get_db()
cur = conn.cursor()

for sid in ['IS 366:1991', '366_ELECTRIC_IRON_AMENDMENT', '302-part-2-sec-3-2024-electric-irons']:
    print(f"\n==================== REQUESTED ID: {sid} ====================")
    for tbl in ['standard_tests', 'lab_test_charges', 'application_documents', 'grouping_rules']:
        res = resolve_matching_standard_id(cur, tbl, sid)
        print(f"  {tbl:<22}: {res}")

cur.close()
conn.close()
