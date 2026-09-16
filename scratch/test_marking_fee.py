import sys
sys.path.append('.')
import psycopg2
from api_server import parse_standard_components

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

def test_marking_fee(req_std_id, scale):
    # Resolve standard info
    cur.execute("SELECT standard_number, title FROM standards WHERE id::text = %s OR standard_number = %s;", (req_std_id, req_std_id))
    s_row = cur.fetchone()
    std_num = s_row[0] if s_row else req_std_id
    std_title = s_row[1] if s_row else ""
    
    cur.execute("SELECT fee_type, amount, unit, applicable_to, notes FROM bis_fees WHERE scheme = 'Scheme-I';")
    fee_rows = cur.fetchall()
    
    req_parsed = parse_standard_components(std_num)
    req_base = req_parsed.get("base")
    req_canon = req_parsed.get("canonical")

    base_marking_fee = 17800.0
    matched_marking_fee = None
    
    for fr in fee_rows:
        f_type = fr[0].lower()
        amt = float(fr[1])
        app = fr[3] or ""
        
        if "marking fee" in f_type and scale in f_type:
            app_parsed = parse_standard_components(app)
            # Check if this fee row applies specifically to the selected standard
            if req_base and app_parsed.get("base") == req_base:
                if req_canon and app_parsed.get("canonical") == req_canon:
                    matched_marking_fee = amt
                elif not matched_marking_fee:
                    matched_marking_fee = amt
            elif not app or "bis product certification" in app.lower():
                base_marking_fee = amt

    final_marking_fee = matched_marking_fee if matched_marking_fee is not None else base_marking_fee
    print(f"Standard: {std_num} | Scale: {scale} => Marking Fee: {final_marking_fee}")

# Test various standards
test_marking_fee('33f89a86-d4de-432d-910c-e75c0efe99ff', 'micro') # IS 368 -> expect 17800
test_marking_fee('33f89a86-d4de-432d-910c-e75c0efe99ff', 'large') # IS 368 -> expect 89000
test_marking_fee('97c2ab85-ba20-4c49-934a-ce60dd36e21a', 'micro') # IS 1391 Part 2 -> expect 15800
test_marking_fee('97c2ab85-ba20-4c49-934a-ce60dd36e21a', 'large') # IS 1391 Part 2 -> expect 79000
test_marking_fee('5484d787-d73e-4fee-b0e7-a099f3ad8c44', 'micro') # IS 302 Part 2 Sec 7 Washing Machine -> expect 66200
test_marking_fee('5484d787-d73e-4fee-b0e7-a099f3ad8c44', 'large') # IS 302 Part 2 Sec 7 Washing Machine -> expect 331000

cur.close()
conn.close()
