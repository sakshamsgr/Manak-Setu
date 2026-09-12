import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)

products = [
    "Electric Iron",
    "Electric Washing Machine",
    "Split Air Conditioner",
    "Electric Fan"
]

print("=== 1. Check in product_classifications ===")
cur.execute("""
    SELECT pc.display_name, pc.product_type, pc.keywords, s.standard_number, s.title
    FROM product_classifications pc
    JOIN standards s ON pc.standard_id = s.id;
""")
class_rows = cur.fetchall()
print(f"Total product_classifications: {len(class_rows)}")
for p in products:
    print(f"\nQuerying: '{p}'")
    matched = []
    for r in class_rows:
        d_name = r['display_name']
        kws = r['keywords'] or []
        s_title = r['title']
        combined = (d_name + " " + " ".join(kws) + " " + s_title).lower()
        if p.lower() in combined or any(w in combined for w in p.lower().split() if w not in ('electric', 'and')):
            matched.append(r)
    print(f"Matches found: {len(matched)}")
    for m in matched[:3]:
        print(f"  -> {m['display_name']} -> {m['standard_number']}: {m['title']} (kws: {m['keywords']})")

print("\n=== 2. Check in standards table directly ===")
cur.execute("SELECT id, standard_number, title, group_name FROM standards;")
std_rows = cur.fetchall()
for p in products:
    print(f"\nSearching standards for '{p}':")
    words = [w for w in p.lower().split() if w not in ('electric', 'and', 'the')]
    m_stds = [s for s in std_rows if any(w in s['title'].lower() for w in words)]
    for ms in m_stds[:4]:
        print(f"  -> {ms['standard_number']}: {ms['title']}")

cur.close()
conn.close()
