import sys, os
sys.path.insert(0, os.path.abspath('.'))
sys.stdout.reconfigure(encoding='utf-8')
import psycopg2
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT * FROM laboratories;")
print("Laboratories count:", cur.rowcount)
for r in cur.fetchall():
    print(r[0], r[1], r[4], r[5])

cur.execute("SELECT DISTINCT standard_id, product_name, count(*) FROM lab_test_charges GROUP BY standard_id, product_name;")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
