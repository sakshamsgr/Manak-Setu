import os
import re
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()

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

cur.execute("SELECT DISTINCT applicable_to FROM bis_fees WHERE applicable_to NOT ILIKE '%product certification%';")
fee_apps = [r[0] for r in cur.fetchall()]
print("Fee applicable_to parsed:")
for app in fee_apps:
    print(app, "->", parse_standard_components(app))

cur.execute("SELECT id, standard_number, title FROM standards ORDER BY standard_number;")
standards = cur.fetchall()
print(f"\nTotal standards in standards table: {len(standards)}")

matching_standards = []
for sid, snum, stitle in standards:
    sp = parse_standard_components(snum)
    matches = []
    for app in fee_apps:
        ap = parse_standard_components(app)
        if sp["base"] == ap["base"]:
            if sp["canonical"] == ap["canonical"]:
                matches.append(app)
            elif not sp["part"] and not sp["sec"] and not ap["part"] and not ap["sec"]:
                matches.append(app)
    if matches:
        matching_standards.append((sid, snum, stitle, matches))

print(f"\nMatching standards ({len(matching_standards)}):")
for sid, snum, stitle, matches in matching_standards:
    print(f"[{sid}] {snum} - {stitle}")
    print(f"    Matches in bis_fees: {matches}")

cur.close()
conn.close()
