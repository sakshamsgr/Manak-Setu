import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import psycopg2, json
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

conn = get_db()
cur = conn.cursor()

print("=== 1. CHECK bis_standards FOR 366 OR Iron ===")
cur.execute("""
    SELECT id, title, year 
    FROM bis_standards 
    WHERE id ILIKE '%366%' OR title ILIKE '%366%' OR title ILIKE '%iron%'
""")
for r in cur.fetchall():
    print("  bis_standards:", r)

print("\n=== 2. CHECK standards TABLE FOR 366 OR Iron ===")
cur.execute("""
    SELECT id, standard_number, title 
    FROM standards 
    WHERE standard_number ILIKE '%366%' OR title ILIKE '%366%' OR title ILIKE '%iron%'
""")
for r in cur.fetchall():
    print("  standards:", r)

print("\n=== 3. CHECK standard_tests FOR 366 OR Iron ===")
cur.execute("""
    SELECT DISTINCT standard_id 
    FROM standard_tests
""")
std_ids_in_tests = [r[0] for r in cur.fetchall()]
print(f"Total distinct standard_ids in standard_tests: {len(std_ids_in_tests)}")
for s in std_ids_in_tests:
    print("  standard_id in tests:", s)

print("\n=== 4. ANY standard_tests WITH 366 OR iron IN REQUIREMENT OR REMARKS ===")
cur.execute("""
    SELECT id, standard_id, clause, requirement, testing_type 
    FROM standard_tests 
    WHERE standard_id ILIKE '%366%' OR requirement ILIKE '%iron%' OR remarks ILIKE '%iron%'
    LIMIT 20
""")
for r in cur.fetchall():
    print("  standard_test row:", r)

print("\n=== 5. CHECK ALL OTHER TABLES FOR 366 ===")
for tbl in ['application_documents', 'grouping_rules', 'lab_test_charges', 'qco_standards', 'bis_ingestion_documents', 'bis_licences']:
    try:
        cur.execute(f"""
            SELECT COUNT(*) FROM {tbl} 
            WHERE CAST({tbl}.* AS text) ILIKE '%366%'
        """)
        cnt = cur.fetchone()[0]
        print(f"  {tbl} count with '366': {cnt}")
    except Exception as e:
        conn.rollback()
        print(f"  {tbl} error: {e}")

print("\n=== 6. CHECK ALL DISTINCT standard_id VALUES ACROSS ALL RELEVANT TABLES ===")
for tbl, col in [('standard_tests', 'standard_id'), ('application_documents', 'standard_id'), ('grouping_rules', 'standard_id'), ('lab_test_charges', 'standard_id')]:
    cur.execute(f"SELECT DISTINCT {col} FROM {tbl}")
    vals = [r[0] for r in cur.fetchall()]
    print(f"  {tbl}.{col}: {vals}")

cur.close()
conn.close()
