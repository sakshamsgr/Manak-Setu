import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

# 1. Add standard_id column to bis_fees if not exists
cur.execute("""
ALTER TABLE bis_fees 
ADD COLUMN IF NOT EXISTS standard_id UUID REFERENCES standards(id);
""")
conn.commit()
print("Column standard_id added or already exists.")

# 2. Match and update standard_id in bis_fees
cur.execute("SELECT id, standard_number, title FROM standards;")
standards = cur.fetchall()

cur.execute("SELECT id, applicable_to FROM bis_fees;")
fees = cur.fetchall()

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

updated_count = 0
for fid, app in fees:
    if not app or "product certification" in app.lower():
        continue
    app_parsed = parse_standard_components(app)
    matched_id = None
    for sid, snum, stitle in standards:
        sp = parse_standard_components(snum)
        if sp["base"] == app_parsed["base"]:
            if sp["canonical"] == app_parsed["canonical"]:
                matched_id = sid
                break
            elif not sp["part"] and not sp["sec"] and not app_parsed["part"] and not app_parsed["sec"]:
                matched_id = sid
                break
    if matched_id:
        cur.execute("UPDATE bis_fees SET standard_id = %s WHERE id = %s;", (matched_id, fid))
        updated_count += 1

conn.commit()
print(f"Updated {updated_count} rows with standard_id in bis_fees.")

# 3. Test query equivalent to user's requested query
cur.execute("""
SELECT DISTINCT s.id::text, s.standard_number, s.title
FROM public.standards s
INNER JOIN public.bis_fees f ON f.standard_id = s.id
ORDER BY s.standard_number;
""")
results = cur.fetchall()
print(f"\n--- User query result ({len(results)} standards) ---")
for r in results:
    print(r)

cur.close()
conn.close()
