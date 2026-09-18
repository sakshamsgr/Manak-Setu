import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()

print("=== STANDARDS IN standards TABLE FOR 'iron' ===")
cur.execute("SELECT id, standard_number, title FROM standards WHERE title ILIKE '%iron%' OR standard_number ILIKE '%366%' OR standard_number ILIKE '%302%';")
for r in cur.fetchall():
    print(r)

print("\n=== ALL ROWS IN standard_tests FOR ELECTRIC IRONS OR 302/366 ===")
cur.execute("""
    SELECT DISTINCT standard_id, COUNT(*) 
    FROM standard_tests 
    GROUP BY standard_id;
""")
for r in cur.fetchall():
    print(" ", r)

print("\n=== SAMPLE TESTS FOR '302-part-2-sec-3-2024-electric-irons' ===")
cur.execute("""
    SELECT id, clause, requirement, test_method, testing_type 
    FROM standard_tests 
    WHERE standard_id = '302-part-2-sec-3-2024-electric-irons' 
    LIMIT 5;
""")
for r in cur.fetchall():
    print(" ", r)

print("\n=== SAMPLE standard_chunks FOR 366 ===")
cur.execute("""
    SELECT id, standard_id, page_number, substring(content from 1 for 100) 
    FROM standard_chunks 
    WHERE standard_id ILIKE '%366%' OR content ILIKE '%IS 366%' 
    LIMIT 5;
""")
for r in cur.fetchall():
    print(" ", r)

cur.close()
conn.close()
