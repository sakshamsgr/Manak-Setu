import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()

for q in ['IS 366:1991', '366_ELECTRIC_IRON_AMENDMENT', '11bd85dc-d3a8-4636-904d-f1a77546dc37', 'IS 366', '366']:
    # 1. First resolve canonical standards.id or bis_standards entry
    cur.execute("""
        SELECT id FROM standards 
        WHERE id::text = %s OR standard_number ILIKE %s OR %s ILIKE ('%%' || standard_number || '%%')
        LIMIT 1;
    """, (q, f"%{q}%", q))
    s_row = cur.fetchone()
    std_uuid = s_row[0] if s_row else None
    
    if not std_uuid:
        # Check bis_standards
        cur.execute("SELECT id, title FROM bis_standards WHERE id = %s LIMIT 1;", (q,))
        b_row = cur.fetchone()
        if b_row:
            cur.execute("SELECT id FROM standards WHERE title ILIKE %s LIMIT 1;", (f"%{b_row[1]}%",))
            s_row2 = cur.fetchone()
            if s_row2:
                std_uuid = s_row2[0]

    # 2. If std_uuid found, query documents / standard_documents linked to standard_tests
    matched_test_std = None
    if std_uuid:
        cur.execute("""
            SELECT DISTINCT st.standard_id 
            FROM standard_tests st
            JOIN documents d ON st.source_document_id = d.id
            WHERE d.standard_id = %s
            LIMIT 1;
        """, (std_uuid,))
        st_row = cur.fetchone()
        if st_row:
            matched_test_std = st_row[0]
        else:
            cur.execute("""
                SELECT DISTINCT st.standard_id 
                FROM standard_tests st
                JOIN standard_documents sd ON st.source_document_id = sd.id
                WHERE sd.standard_id = %s
                LIMIT 1;
            """, (std_uuid,))
            st_row2 = cur.fetchone()
            if st_row2:
                matched_test_std = st_row2[0]

    print(f"Query for '{q}' -> std_uuid: {std_uuid} -> matched_test_std: {matched_test_std}")

cur.close()
conn.close()
