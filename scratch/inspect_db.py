"""
Verify the standards table is suitable as source for the dropdown.
Check if estimator/calculate works with standards table UUIDs.
"""
import psycopg2

DB_URI = "postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

# Check standards table schema
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'standards'
    ORDER BY ordinal_position;
""")
cols = cur.fetchall()
print("=== standards table columns ===")
for c in cols:
    print(f"  {c[0]}  ({c[1]})")

# All standards rows
cur.execute("SELECT id, standard_number, title FROM standards ORDER BY standard_number;")
rows = cur.fetchall()
print(f"\n=== standards table ({len(rows)} rows) ===")
for r in rows:
    print(f"  id={r[0]}  std={r[1]!r}  title={r[2]!r}")

# Check what lab_test_charges looks like
print("\n=== lab_test_charges table ===")
try:
    cur.execute("SELECT COUNT(*) FROM lab_test_charges;")
    c = cur.fetchone()[0]
    print(f"  Total rows: {c}")
    cur.execute("SELECT DISTINCT standard_id FROM lab_test_charges LIMIT 20;")
    stds = cur.fetchall()
    print(f"  Distinct standard_ids in lab_test_charges:")
    for s in stds:
        print(f"    {s[0]!r}")
except Exception as e:
    print(f"  Error: {e}")

# Check what bis_fees looks like
print("\n=== bis_fees table ===")
try:
    cur.execute("SELECT COUNT(*) FROM bis_fees;")
    c = cur.fetchone()[0]
    print(f"  Total rows: {c}")
    cur.execute("SELECT DISTINCT scheme FROM bis_fees;")
    schemes = cur.fetchall()
    print(f"  Distinct schemes: {[s[0] for s in schemes]}")
except Exception as e:
    print(f"  Error: {e}")

# Check product_classifications table
print("\n=== product_classifications table ===")
try:
    cur.execute("SELECT COUNT(*) FROM product_classifications;")
    c = cur.fetchone()[0]
    print(f"  Total rows: {c}")
    cur.execute("""
        SELECT pc.id, pc.product_name, s.standard_number, s.title
        FROM product_classifications pc
        JOIN standards s ON pc.standard_id = s.id
        LIMIT 10;
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"  {r[0]}  product={r[1]!r}  std={r[2]!r}  title={r[3]!r}")
except Exception as e:
    print(f"  Error: {e}")

cur.close()
conn.close()
