import psycopg2

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

# 1. Tables in public schema
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
tables = [r[0] for r in cur.fetchall()]
print("Tables in public schema:", tables)

# 2. Check bis_fees columns and sample data
if 'bis_fees' in tables:
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bis_fees';")
    print("\nbis_fees columns:", cur.fetchall())
    cur.execute("SELECT * FROM bis_fees LIMIT 10;")
    print("bis_fees sample rows:", cur.fetchall())

# 3. Check lab_test_charges columns and sample data
if 'lab_test_charges' in tables:
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lab_test_charges';")
    print("\nlab_test_charges columns:", cur.fetchall())
    cur.execute("SELECT DISTINCT standard_id FROM lab_test_charges LIMIT 15;")
    print("lab_test_charges distinct standard_id:", cur.fetchall())

# 4. Check if there are any other fee tables
fee_tables = [t for t in tables if 'fee' in t]
print("\nFee tables:", fee_tables)

cur.close()
conn.close()
