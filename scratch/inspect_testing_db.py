import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)

# 1. Find all tables related to tests/testing
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE '%test%' OR table_name LIKE '%standard%' OR table_name LIKE '%require%')
    ORDER BY table_name;
""")
print("Matching tables:")
for r in cur.fetchall():
    print(" -", r['table_name'])

# 2. Inspect standard_tests or similar table
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'standard_tests'
    ORDER BY ordinal_position;
""")
cols = cur.fetchall()
if cols:
    print("\nColumns in standard_tests:")
    for c in cols:
        print(f"  {c['column_name']}: {c['data_type']} (nullable: {c['is_nullable']})")
else:
    print("\nNo table named standard_tests")

# 3. Sample records in standard_tests
cur.execute("SELECT * FROM standard_tests LIMIT 5;")
print("\nSample records from standard_tests:")
for r in cur.fetchall():
    print(dict(r))

cur.close()
conn.close()
