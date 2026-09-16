import psycopg2

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

# Check all standards
cur.execute("SELECT id, standard_number, title FROM standards ORDER BY standard_number;")
standards = cur.fetchall()
print(f"Total in 'standards' table: {len(standards)}")
for s in standards:
    print(f"  {s[0]} | {s[1]} | {s[2]}")

# Check bis_standards
cur.execute("SELECT id, title FROM bis_standards ORDER BY id;")
bis_stds = cur.fetchall()
print(f"\nTotal in 'bis_standards' table: {len(bis_stds)}")

# Check bis_fees applicable_to
cur.execute("SELECT DISTINCT applicable_to FROM bis_fees;")
fees_app = cur.fetchall()
print(f"\nDistinct applicable_to in bis_fees:")
for fa in fees_app:
    print(f"  {fa[0]}")

cur.close()
conn.close()
