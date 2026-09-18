import sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from api_server import get_db

conn = get_db()
cur = conn.cursor()

# Test 1: From standards UUID
uuid_366 = '11bd85dc-d3a8-4636-904d-f1a77546dc37'
cur.execute('''
    SELECT DISTINCT st.standard_id, COUNT(*)
    FROM standard_tests st
    JOIN documents d ON st.source_document_id = d.id
    WHERE d.standard_id = %s
    GROUP BY st.standard_id;
''', (uuid_366,))
print('Match via documents.standard_id (UUID):', cur.fetchall())

# Test 2: From standard_number 'IS 366:1991' or '366_ELECTRIC_IRON_AMENDMENT'
for q in ['IS 366:1991', '366_ELECTRIC_IRON_AMENDMENT', 'IS 366']:
    digits = ''.join(c for c in q if c.isdigit())
    cur.execute('''
        SELECT DISTINCT st.standard_id, COUNT(*)
        FROM standard_tests st
        JOIN documents d ON st.source_document_id = d.id
        JOIN standards s ON d.standard_id = s.id
        WHERE s.standard_number ILIKE %s OR s.id::text = %s OR s.standard_number ILIKE %s
        GROUP BY st.standard_id;
    ''', (f'%{q}%', q, f'%{digits}%'))
    print(f'Match via standards table for "{q}":', cur.fetchall())

cur.close()
conn.close()
