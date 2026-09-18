import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db, _get_testing_and_labs_core
from scratch.test_full_resolver import resolve_matching_standard_id

# Temporarily patch api_server.resolve_matching_standard_id to test
import api_server
api_server.resolve_matching_standard_id = resolve_matching_standard_id

conn = get_db()
cur = conn.cursor()

for sid in ['IS 366:1991', '366_ELECTRIC_IRON_AMENDMENT']:
    res = _get_testing_and_labs_core(conn, cur, sid)
    print(f"\n==================== {sid} ====================")
    print("standard_id:", res.get("standard_id"))
    print("matched_standard_id:", res.get("matched_standard_id"))
    print("routine_tests count:", len(res.get("routine_tests", [])))
    print("type_tests count:", len(res.get("type_tests", [])))
    print("total tests:", len(res.get("routine_tests", [])) + len(res.get("type_tests", [])))
    print("laboratories count:", len(res.get("laboratories", [])))
    print("grouping_rules count:", len(res.get("grouping_rules", [])))
    print("message:", res.get("message"))
    print("sample test:", res.get("routine_tests", [])[0] if res.get("routine_tests") else None)

cur.close()
conn.close()
