import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

# Check foreign keys
cur.execute("""
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('bis_fees', 'standards', 'bis_standards');
""")
print("Foreign keys:")
for row in cur.fetchall():
    print(row)

# Inspect bis_fees records in detail
cur.execute("SELECT id, fee_type, scheme, amount, applicable_to, source_document_id FROM bis_fees;")
print("\nAll bis_fees rows:")
fees = cur.fetchall()
for f in fees:
    print(f)

# Inspect bis_standards records
cur.execute("SELECT id, title, year FROM bis_standards LIMIT 10;")
print("\nSample bis_standards rows:")
for b in cur.fetchall():
    print(b)

cur.close()
conn.close()
