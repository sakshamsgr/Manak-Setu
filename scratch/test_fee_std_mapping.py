import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

# Check all rows in bis_fees
cur.execute("SELECT id, fee_type, scheme, amount, applicable_to FROM bis_fees ORDER BY id;")
fee_rows = cur.fetchall()

# Check all standards
cur.execute("SELECT id, standard_number, title FROM standards;")
standards = cur.fetchall()

print(f"Total bis_fees rows: {len(fee_rows)}")
print(f"Total standards: {len(standards)}")

# Let's see how each fee row matches standards
import re
def parse_standard_components(std_str: str) -> dict:
    if not std_str:
        return {"base": "", "part": None, "sec": None, "canonical": ""}
    s = std_str.strip()
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

    return {"base": base, "part": part, "sec": sec, "canonical": canonical}

mapping = {}
for fid, ftype, scheme, amount, app in fee_rows:
    if not app or "product certification" in app.lower():
        print(f"Fee ID {fid}: General statutory fee ('{app}') -> No standard_id")
        continue
    app_parsed = parse_standard_components(app)
    matched_std = None
    for sid, snum, stitle in standards:
        sp = parse_standard_components(snum)
        if sp["base"] == app_parsed["base"]:
            if sp["canonical"] == app_parsed["canonical"]:
                matched_std = (sid, snum, stitle)
                break
            elif not sp["part"] and not sp["sec"] and not app_parsed["part"] and not app_parsed["sec"]:
                matched_std = (sid, snum, stitle)
                break
    if matched_std:
        print(f"Fee ID {fid}: '{app}' -> Matched Standard: {matched_std[1]} (id: {matched_std[0]})")
        mapping[fid] = matched_std[0]
    else:
        print(f"Fee ID {fid}: '{app}' -> UNMATCHED")

cur.close()
conn.close()
