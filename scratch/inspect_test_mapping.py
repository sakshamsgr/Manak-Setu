import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)

cur.execute("""
    SELECT 
        n.id as notification_id,
        n.notification_type,
        n.title,
        n.related_entity_type,
        n.related_entity_id,
        n.new_value,
        n.created_at as notif_created_at,
        t.id as test_id,
        t.standard_id as test_standard_id,
        t.clause as test_clause,
        t.requirement as test_requirement,
        t.test_method as test_method,
        t.testing_type as test_type,
        t.source_page
    FROM bis_notifications n
    LEFT JOIN standard_tests t ON t.id::text = n.related_entity_id
    WHERE n.notification_type = 'test_change'
    ORDER BY n.created_at DESC
    LIMIT 10;
""")
rows = cur.fetchall()
print(f"Sample joined records ({len(rows)}):")
for r in rows:
    print(f"Notif #{r['notification_id']} (rel_id={r['related_entity_id']}):")
    print(f"  Mapped to standard_tests.id={r['test_id']} in standard={r['test_standard_id']}")
    print(f"  Clause: {r['test_clause']} | Requirement: {r['test_requirement']}")
    print(f"  Method: {r['test_method']} | Type: {r['test_type']} | Source Page: {r['source_page']}")
    print("---")

cur.close()
conn.close()
