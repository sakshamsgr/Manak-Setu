import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()

cur.execute("SELECT DISTINCT standard_id, COUNT(*) FROM standard_tests GROUP BY standard_id ORDER BY COUNT(*) DESC;")
test_stds = cur.fetchall()

print(f"=== {len(test_stds)} DISTINCT standard_id in standard_tests ===")
for sid, cnt in test_stds:
    # Check in standards table
    cur.execute("SELECT id, standard_number, title FROM standards WHERE id::text = %s OR standard_number ILIKE %s OR title ILIKE %s;", (sid, f"%{sid}%", f"%{sid}%"))
    st_matches = cur.fetchall()
    
    # Check in bis_standards table
    cur.execute("SELECT id, title, year FROM bis_standards WHERE id ILIKE %s OR title ILIKE %s;", (f"%{sid}%", f"%{sid}%"))
    bis_matches = cur.fetchall()
    
    print(f"\nStandard ID in standard_tests: '{sid}' ({cnt} tests)")
    print(f"  matches in standards ({len(st_matches)}): {st_matches[:2]}")
    print(f"  matches in bis_standards ({len(bis_matches)}): {bis_matches[:2]}")

cur.close()
conn.close()
