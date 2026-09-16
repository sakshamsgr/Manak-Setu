import sys
sys.path.append('.')
import psycopg2
from api_server import resolve_matching_standard_id

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

cur.execute("SELECT id, standard_number, title FROM standards;")
standards = cur.fetchall()

print("Testing resolve_matching_standard_id for each standard in 'standards':")
for sid, snum, stitle in standards:
    matched_lab = resolve_matching_standard_id(cur, "lab_test_charges", str(sid))
    cur.execute("SELECT AVG(testing_charge) FROM lab_test_charges WHERE standard_id = %s;", (matched_lab or str(sid),))
    avg_lab = cur.fetchone()[0]
    print(f"{snum[:25]:<25} | UUID: {str(sid)[:8]}... | Matched Lab: {str(matched_lab):<40} | Avg Fee: {avg_lab}")

cur.close()
conn.close()
