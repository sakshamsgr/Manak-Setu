import sys, os, re
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db, parse_standard_components, supabase_vector_search

conn = get_db()
cur = conn.cursor()

def enhanced_resolve_matching_standard_id(cur, table_name: str, requested_id: str, col_name: str = "standard_id") -> str | None:
    if not requested_id:
        return None

    # 1. Exact match in table
    cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} = %s LIMIT 1;", (requested_id,))
    row = cur.fetchone()
    if row:
        return row[0]

    # Resolve canonical standards.id (UUID) and standard_number if possible
    std_uuid = None
    std_num = None
    std_title = None
    if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', requested_id, re.IGNORECASE):
        std_uuid = requested_id
        cur.execute("SELECT standard_number, title FROM standards WHERE id = %s;", (requested_id,))
        s_row = cur.fetchone()
        if s_row:
            std_num = s_row[0]
            std_title = s_row[1]
    else:
        cur.execute("""
            SELECT id, standard_number, title FROM standards 
            WHERE standard_number ILIKE %s 
               OR id::text = %s 
               OR %s ILIKE ('%%' || standard_number || '%%')
            LIMIT 1;
        """, (f"%{requested_id}%", requested_id, requested_id))
        s_row = cur.fetchone()
        if s_row:
            std_uuid, std_num, std_title = s_row
        else:
            cur.execute("SELECT id, title FROM bis_standards WHERE id = %s LIMIT 1;", (requested_id,))
            b_row = cur.fetchone()
            if b_row:
                cur.execute("SELECT id, standard_number, title FROM standards WHERE title ILIKE %s LIMIT 1;", (f"%{b_row[1]}%",))
                s_row2 = cur.fetchone()
                if s_row2:
                    std_uuid, std_num, std_title = s_row2

    # 2. Relational document join (e.g. for standard_tests via source_document_id -> documents / standard_documents -> standards)
    if std_uuid and table_name == "standard_tests":
        cur.execute("""
            SELECT DISTINCT st.standard_id 
            FROM standard_tests st
            LEFT JOIN documents d ON st.source_document_id = d.id
            LEFT JOIN standard_documents sd ON st.source_document_id = sd.id
            WHERE d.standard_id = %s OR sd.standard_id = %s
            LIMIT 1;
        """, (std_uuid, std_uuid))
        d_row = cur.fetchone()
        if d_row and d_row[0]:
            return d_row[0]

    # 3. Robust Digit Sequence Matching
    req_digits = re.findall(r'\d+', requested_id)
    if req_digits:
        base_num = req_digits[0]
        cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} ILIKE %s;", (f"%{base_num}%",))
        candidates = [r[0] for r in cur.fetchall() if r[0]]
        req_struct = req_digits[:-1] if len(req_digits) > 1 and len(req_digits[-1]) == 4 and int(req_digits[-1]) > 1900 else list(req_digits)
        for cand in candidates:
            cand_digits = re.findall(r'\d+', cand)
            cand_struct = cand_digits[:-1] if len(cand_digits) > 1 and len(cand_digits[-1]) == 4 and int(cand_digits[-1]) > 1900 else list(cand_digits)
            if req_struct == cand_struct:
                return cand

    # 4. Fallback to Parse Standard Components
    parsed = parse_standard_components(requested_id)
    base = parsed["base"]
    if base:
        cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} ILIKE %s OR {col_name} ILIKE %s;", (f"%{base}%", f"{base}%"))
        candidates = [r[0] for r in cur.fetchall() if r[0]]
        best_cand = None
        best_score = -1
        req_part = parsed["part"]
        req_sec = parsed["sec"]
        req_canon = parsed["canonical"]
        
        for cand in candidates:
            cand_parsed = parse_standard_components(cand)
            if cand_parsed["base"] != base: continue
                
            score = 0
            if cand_parsed["canonical"] == req_canon:
                score = 100
            elif req_part and req_sec:
                if cand_parsed["part"] == req_part and cand_parsed["sec"] == req_sec: score = 90
                else: continue
            elif req_part and not req_sec:
                if cand_parsed["part"] == req_part and not cand_parsed["sec"]: score = 90
                else: continue
            else:
                if not cand_parsed["part"] and not cand_parsed["sec"]: score = 80
                else: continue
                    
            if score > best_score:
                best_score = score
                best_cand = cand
        if best_cand:
            return best_cand

    # 5. QCO co-standard relational matching
    # If standard A (e.g. IS 366:1991) belongs to a QCO that also governs standard B (e.g. IS 302-2-3),
    # check if table_name has records under standard B!
    cur.execute("""
        SELECT DISTINCT qs2.standard_id
        FROM qco_standards qs1
        JOIN qco_standards qs2 ON qs1.qco_id = qs2.qco_id AND qs1.id != qs2.id
        WHERE (qs1.standard_id = %s OR qs1.standard_id ILIKE %s)
          AND qs2.standard_id != qs1.standard_id;
    """, (requested_id, f"%{requested_id}%"))
    co_stds = [r[0] for r in cur.fetchall() if r[0]]
    for co_std in co_stds:
        # Check if co_std directly exists in target table
        cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} = %s LIMIT 1;", (co_std,))
        c_row = cur.fetchone()
        if c_row:
            return c_row[0]
        # Or check robust matching for co_std
        co_parsed = parse_standard_components(co_std)
        if co_parsed["canonical"]:
            cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} ILIKE %s LIMIT 1;", (f"%{co_parsed['canonical']}%",))
            c_row2 = cur.fetchone()
            if c_row2:
                return c_row2[0]

    # 6. DYNAMIC AI VECTOR SEARCH FALLBACK (Zero Hardcoding)
    try:
        semantic_query = std_title or requested_id
        vector_docs = supabase_vector_search(semantic_query, top_k=5, threshold=0.60)
        for d in vector_docs:
            semantic_sid = d['meta'].get('standard_id', '')
            if not semantic_sid: continue
            
            cand_p = parse_standard_components(semantic_sid)
            if cand_p["canonical"]:
                cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} ILIKE %s LIMIT 1;", (f"%{cand_p['canonical']}%",))
                final_row = cur.fetchone()
                if final_row:
                    return final_row[0]
    except Exception as e:
        print(f"AI search error: {e}")
        try: cur.connection.rollback()
        except Exception: pass

    return None

test_cases = [
    'IS 366:1991',
    '366_ELECTRIC_IRON_AMENDMENT',
    '11bd85dc-d3a8-4636-904d-f1a77546dc37',
    'IS 302 (Part 2/Sec 3):2024',
    '302-part-2-sec-3-2024-electric-irons',
    'IS 302 (Part 2/Sec 7):2024',
    '302-part-2-sec-7-2024-domestic-electric-clothes-washing-machines',
    'IS 302 (Part 2/Sec 80):2017',
    '302-part-2-sec-80-2017-fans',
    'IS 1391 (Part 1):2023',
    '1391-part-1-2023-room-air-conditioners-unitary-air-conditioners',
    'IS 1391 (Part 2):2023',
    '1391-part-2-2023-room-air-conditioners-split-air-conditioners',
    'IS 368:2014',
    '368-2014-electric-immersion-water-heaters',
    'IS 302-2-2: 2022',
    'IS 302 (Part 2/Sec 75):2018',
    'IS 3024:2015',  # GENUINELY NO TEST DATA
]

print(f"{'STANDARD':<42} | {'standard_tests':<32} | {'lab_test_charges':<20}")
print("-" * 100)
for tc in test_cases:
    t_res = enhanced_resolve_matching_standard_id(cur, 'standard_tests', tc)
    l_res = enhanced_resolve_matching_standard_id(cur, 'lab_test_charges', tc)
    print(f"{tc:<42} | {str(t_res):<32} | {str(l_res):<20}")

cur.close()
conn.close()
