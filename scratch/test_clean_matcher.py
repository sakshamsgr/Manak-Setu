import sys
sys.path.append('.')
import psycopg2
import re

def parse_std(s):
    if not s:
        return {"base": "", "part": None, "sec": None, "canonical": ""}
    s = s.strip()
    
    # 1. Look for part and sec written as Part X Sec Y or part X
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

    # 2. Check hyphenated pattern like 302-2-11 or 302-2-202 or 302-1
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

    # 3. Find base number if not yet found
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

cur.execute("SELECT id, standard_number, title FROM standards ORDER BY standard_number;")
standards = cur.fetchall()

cur.execute("SELECT id, fee_type, scheme, amount, unit, applicable_to FROM bis_fees WHERE applicable_to NOT ILIKE '%BIS product certification%';")
fee_rows = cur.fetchall()

print("Parsed standards and matches in bis_fees:")
for sid, snum, stitle in standards:
    p = parse_std(snum)
    matches = []
    for fr in fee_rows:
        fp = parse_std(fr[5])
        if fp['base'] == p['base']:
            if p['canonical'] == fp['canonical']:
                matches.append(fr)
            elif not p['part'] and not p['sec'] and not fp['part'] and not fp['sec']:
                matches.append(fr)
    print(f"{snum:<30} -> canonical: {p['canonical']:<20} -> {len(matches)} matching fee row(s)")

cur.close()
conn.close()
