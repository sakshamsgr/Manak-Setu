import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()

print("=== CHECK ALL documents WITH standards ===")
cur.execute("""
    SELECT d.id, d.standard_id, s.standard_number, s.title, d.title
    FROM documents d
    LEFT JOIN standards s ON d.standard_id = s.id
    ORDER BY s.standard_number;
""")
for r in cur.fetchall():
    print(f"  doc: {r[0]} | std_id: {r[1]} | {r[2]}: {r[3]} | doc_title: {r[4]}")

print("\n=== CHECK WHICH standard_tests USE source_document_id ===")
cur.execute("""
    SELECT st.standard_id, st.source_document_id, COUNT(*)
    FROM standard_tests st
    GROUP BY st.standard_id, st.source_document_id;
""")
for r in cur.fetchall():
    print(f"  test standard_id: {r[0]} | doc_id: {r[1]} | count: {r[2]}")

cur.close()
conn.close()
