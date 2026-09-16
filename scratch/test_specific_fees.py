import sys
sys.path.append('.')
import psycopg2
from api_server import parse_standard_components

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

def get_standard_fee_records(std_id_or_number):
    # 1. Resolve standard
    cur.execute("SELECT id, standard_number, title FROM standards WHERE id::text = %s OR standard_number = %s LIMIT 1;", (std_id_or_number, std_id_or_number))
    row = cur.fetchone()
    if not row:
        cur.execute("SELECT id, id, title FROM bis_standards WHERE id = %s LIMIT 1;", (std_id_or_number,))
        row = cur.fetchone()
    if not row:
        return None, "Standard not found"
    
    std_id, std_num, std_title = row
    parsed = parse_standard_components(std_num)
    base = parsed.get("base")
    part = parsed.get("part")
    sec = parsed.get("sec")
    canon = parsed.get("canonical")
    
    # 2. Query bis_fees for records matching this specific standard
    cur.execute("SELECT id, fee_type, scheme, amount, unit, applicable_to, notes FROM bis_fees WHERE applicable_to IS NOT NULL;")
    rows = cur.fetchall()
    
    specific_fee_records = []
    for r in rows:
        app = r[5] or ""
        # Ignore purely generic BIS product certification rows
        if "bis product certification" in app.lower():
            continue
        app_p = parse_standard_components(app)
        # Must match base
        if app_p.get("base") != base:
            continue
        # If standard has part/sec, the fee row MUST match that part/sec
        if canon:
            if app_p.get("canonical") == canon:
                specific_fee_records.append(r)
        else:
            # Standard has only base (e.g. 368). Fee row must not be for a different part.
            if not app_p.get("part") and not app_p.get("sec"):
                specific_fee_records.append(r)
                
    return (std_num, specific_fee_records)

# Test for all 23 standards
cur.execute("SELECT id, standard_number FROM standards ORDER BY standard_number;")
all_stds = cur.fetchall()

print("Testing which standards have verified fee records in bis_fees:")
for sid, snum in all_stds:
    std_num, fee_recs = get_standard_fee_records(sid)
    print(f"{snum:<30} -> {len(fee_recs)} specific fee record(s)")
    for fr in fee_recs:
        print(f"      [{fr[1]}] = {fr[3]} {fr[4]} (applicable_to: {fr[5]})")

cur.close()
conn.close()
