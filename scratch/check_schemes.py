import psycopg2

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

cur.execute("SELECT DISTINCT scheme FROM bis_fees;")
print("Schemes in bis_fees:", cur.fetchall())

cur.execute("SELECT * FROM bis_fees WHERE scheme ILIKE '%fmcs%' OR applicable_to ILIKE '%foreign%' OR fee_type ILIKE '%foreign%';")
print("Foreign rows:", cur.fetchall())

cur.close()
conn.close()
