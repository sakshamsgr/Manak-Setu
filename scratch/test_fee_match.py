import sys
sys.path.append('.')
import psycopg2
import re
from api_server import parse_standard_components

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

cur.execute("SELECT id, standard_number, title FROM standards;")
standards = cur.fetchall()

cur.execute("SELECT id, fee_type, amount, applicable_to FROM bis_fees;")
fees = cur.fetchall()

print("Testing matching standards to bis_fees applicable_to:")
for sid, snum, stitle in standards:
    # Resolve standard components
    parsed = parse_standard_components(snum)
    base = parsed.get("base")
    part = parsed.get("part")
    sec = parsed.get("sec")
    canon = parsed.get("canonical")
    
    # Find matching fees
    matched_fees = []
    for fid, ftype, famt, fapp in fees:
        if not fapp:
            continue
        # Check if fapp mentions standard
        app_parsed = parse_standard_components(fapp)
        if app_parsed.get("base") == base:
            # Check part/sec
            if canon and app_parsed.get("canonical") == canon:
                matched_fees.append((ftype, famt, fapp))
            elif not canon and not app_parsed.get("canonical"):
                matched_fees.append((ftype, famt, fapp))
            elif canon and not app_parsed.get("canonical"):
                # general match
                matched_fees.append((ftype, famt, fapp))
    
    if matched_fees:
        print(f"\nStandard: {snum} ({stitle[:30]}) -> Matches {len(matched_fees)} fee rows:")
        for mf in matched_fees:
            print(f"   {mf[0]}: {mf[1]} (applicable_to: {mf[2]})")

cur.close()
conn.close()
