import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)

def test_std_logic(standard_id):
    # Query tests for standard
    cur.execute("""
        SELECT id, clause, requirement, test_method, equipment_requirement, sample_quantity, frequency, testing_type, remarks, source_page
        FROM standard_tests
        WHERE standard_id = %s
        ORDER BY id ASC;
    """, (standard_id,))
    tests = cur.fetchall()

    # Query notifications for standard
    cur.execute("""
        SELECT id, related_entity_id, title, message, created_at, new_value
        FROM bis_notifications
        WHERE notification_type = 'test_change'
          AND (
            new_value->>'standard_id' = %s
            OR related_entity_id IN (
                SELECT id::text FROM standard_tests WHERE standard_id = %s
            )
          )
        ORDER BY created_at DESC;
    """, (standard_id, standard_id))
    notif_rows = cur.fetchall()

    test_notif_map = {}
    for nr in notif_rows:
        n_id = str(nr['id'])
        rel_id = str(nr['related_entity_id']) if nr['related_entity_id'] else None
        n_title = nr['title']
        n_msg = nr['message']
        n_created = nr['created_at'].isoformat() if hasattr(nr['created_at'], 'isoformat') else str(nr['created_at'])
        n_val = nr['new_value']

        notif_info = {
            "notification_id": n_id,
            "title": n_title,
            "message": n_msg,
            "created_at": n_created,
            "badge": "New BIS Requirement",
            "source": "Official BIS Regulatory Evidence"
        }
        if rel_id and rel_id not in test_notif_map:
            test_notif_map[rel_id] = notif_info
        if isinstance(n_val, dict):
            c_key = f"{(n_val.get('clause') or '').strip().lower()}:{(n_val.get('requirement') or '').strip().lower()}"
            if c_key != ":" and c_key not in test_notif_map:
                test_notif_map[c_key] = notif_info

    updated_count = 0
    for t in tests:
        t_id_str = str(t['id'])
        c_key = f"{(t['clause'] or '').strip().lower()}:{(t['requirement'] or '').strip().lower()}"
        matched_notif = test_notif_map.get(t_id_str) or test_notif_map.get(c_key)
        if matched_notif:
            updated_count += 1
            t['is_updated'] = True
            t['regulatory_update'] = matched_notif
        else:
            t['is_updated'] = False
            t['regulatory_update'] = None

    print(f"Standard: {standard_id}")
    print(f"  Total tests: {len(tests)}")
    print(f"  Total notifications found: {len(notif_rows)}")
    print(f"  Tests flagged as updated: {updated_count}")
    sample_updated = [t for t in tests if t.get('is_updated')]
    if sample_updated:
        print(f"  Sample updated test: ID={sample_updated[0]['id']} | Cl. {sample_updated[0]['clause']} - {sample_updated[0]['requirement']}")
        print(f"    Regulatory info: {sample_updated[0]['regulatory_update']}")

test_std_logic('1391-part-2-2023-room-air-conditioners-split-air-conditioners')
test_std_logic('302-part-2-sec-3-2024-electric-irons')

cur.close()
conn.close()
