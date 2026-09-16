import sys
sys.path.append('.')
import psycopg2
import re

def parse_std(s):
    if not s:
        return {"base": "", "part": None, "sec": None, "canonical": ""}
    s = s.strip()
    
    m_ps = re.search(r'part\s*[-_]?\s*(\d+)[^\d]*?sec(?:tion)?\s*[-_]?\s*(\d+)', s, re.IGNORECASE)
    base, part, sec = None, None, None
    if m_ps:
        part = m_ps.group(1)
        sec = m_ps.group(2)
    else:
        m_sec = re.search(r'sec(?:tion)?\s*[-_]?\s*(\d+)', s, re.IGNORECASE)
        if m_sec:
            sec = m_sec.group(1)
        m_part = re.search(r'part\s*[-_]?\s*(\d+)', s, re.IGNORECASE)
        if m_part:
            part = m_part.group(1)

    if not (part and sec):
        m_hyphen = re.search(r'(?:IS\s*)?(\d{2,5})-(\d{1,2})(?:-(\d{1,3}))?', s, re.IGNORECASE)
        if m_hyphen:
            base = m_hyphen.group(1)
            p = m_hyphen.group(2)
            sc = m_hyphen.group(3)
            if not part:
                part = p
            if sc and not sec:
                sec = sc

    if not base:
        m_b = re.search(r'(?:(?:^|[^0-9])is\s*|^)(\d{2,5})', s, re.IGNORECASE)
        if m_b:
            base = m_b.group(1)
            
    if base and part and sec:
        canonical = f"{base}-part-{part}-sec-{sec}"
    elif base and part:
        canonical = f"{base}-part-{part}"
    elif base:
        canonical = base
    else:
        canonical = s.lower()
        
    return {"base": base or "", "part": part, "sec": sec, "canonical": canonical}

conn = psycopg2.connect('postgresql://postgres.ndpfmlkhxjphooyzvdxk:pJWkT2CJXB8XLb4U@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

def simulate_calculate(std_id, scale="micro", is_foreign=False):
    # 1. Resolve standard
    cur.execute("SELECT id::text, standard_number, title FROM standards WHERE id::text = %s OR standard_number = %s LIMIT 1;", (std_id, std_id))
    s_row = cur.fetchone()
    if not s_row:
        cur.execute("SELECT id, id, title FROM bis_standards WHERE id = %s LIMIT 1;", (std_id,))
        s_row = cur.fetchone()
    if not s_row:
        return {"success": False, "code": "STANDARD_NOT_FOUND", "message": "Selected standard was not found in the database."}
        
    std_uuid, std_num, std_title = s_row
    
    if is_foreign:
        return {
            "success": False,
            "code": "FEE_DATA_UNAVAILABLE",
            "message": f"No verified fee data is available for foreign manufacturers (FMCS) under {std_num} in the current database."
        }

    # 2. Query bis_fees
    cur.execute("SELECT fee_type, amount, unit, applicable_to, notes FROM bis_fees WHERE scheme = 'Scheme-I';")
    all_fee_rows = cur.fetchall()
    
    req_parsed = parse_std(std_num)
    req_base = req_parsed.get("base")
    req_canon = req_parsed.get("canonical")
    req_part = req_parsed.get("part")
    req_sec = req_parsed.get("sec")

    standard_fee_rows = []
    general_fee_rows = []

    for fr in all_fee_rows:
        f_type = fr[0] or ""
        amt = float(fr[1]) if fr[1] is not None else 0.0
        unit = fr[2] or ""
        app = fr[3] or ""
        notes = fr[4] or ""
        
        if not app or "bis product certification" in app.lower():
            general_fee_rows.append((f_type, amt, unit, app, notes))
        else:
            app_parsed = parse_std(app)
            if app_parsed.get("base") == req_base:
                if req_canon and app_parsed.get("canonical") == req_canon:
                    standard_fee_rows.append((f_type, amt, unit, app, notes))
                elif not req_part and not req_sec and not app_parsed.get("part") and not app_parsed.get("sec"):
                    standard_fee_rows.append((f_type, amt, unit, app, notes))
                    
    # Strict DB check: Must have standard-specific fee records in bis_fees
    if not standard_fee_rows:
        return {
            "success": False,
            "code": "FEE_DATA_UNAVAILABLE",
            "message": f"No verified fee data is available for the selected standard ({std_num}) in the current database."
        }
        
    # Scale-specific marking fee
    scale_lower = scale.lower()
    large_amt = None
    selected_marking_fee = None
    marking_notes = ""
    
    for fr in standard_fee_rows:
        ft = fr[0].lower()
        if "marking fee" in ft:
            if "large" in ft:
                large_amt = fr[1]
            if scale_lower in ft:
                selected_marking_fee = fr[1]
                marking_notes = fr[4] or f"Authoritative gazette rate from bis_fees for {scale_lower.title()} Scale"
                
    if selected_marking_fee is None and standard_fee_rows:
        # Fallback to any marking fee in standard_fee_rows
        for fr in standard_fee_rows:
            if "marking fee" in fr[0].lower():
                selected_marking_fee = fr[1]
                marking_notes = fr[4] or "Authoritative gazette rate from bis_fees"
                break
                
    if selected_marking_fee is None:
        return {
            "success": False,
            "code": "FEE_DATA_UNAVAILABLE",
            "message": f"No verified marking fee data is available for {std_num} ({scale_lower.title()} scale) in the current database."
        }
        
    marking_concession = 0.0
    if large_amt and scale_lower in ("micro", "small", "medium"):
        marking_concession = max(0.0, large_amt - selected_marking_fee)
        
    return {
        "success": True,
        "standard_number": std_num,
        "scale": scale_lower,
        "marking_fee": selected_marking_fee,
        "large_amt": large_amt,
        "concession_saved": marking_concession,
        "standard_fee_rows_count": len(standard_fee_rows)
    }

print("Simulating calculation for IS 1391 (Part 1):")
print(simulate_calculate("329021d8-7c3f-4d12-a2dd-ea31e1b70347"))

print("\nSimulating calculation for IS 1391 (Part 2) (micro):")
print(simulate_calculate("97c2ab85-ba20-4c49-934a-ce60dd36e21a", "micro"))

print("\nSimulating calculation for IS 368:2014 (micro):")
print(simulate_calculate("33f89a86-d4de-432d-910c-e75c0efe99ff", "micro"))

print("\nSimulating calculation for IS 2347:2023 (Pressure Cooker):")
print(simulate_calculate("68001e91-c9a3-4906-8026-1037043519d6", "micro"))

cur.close()
conn.close()
