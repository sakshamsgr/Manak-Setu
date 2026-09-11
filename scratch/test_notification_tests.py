import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)

std = '1391-part-2-2023-room-air-conditioners-split-air-conditioners'
cur.execute("""
    SELECT t.id as test_id, 
           t.clause, 
           t.requirement, 
           t.test_method,
           t.testing_type,
           n.id as notif_id,
           n.title as notif_title, 
           n.message as notif_message, 
           n.created_at as notif_created_at
    FROM standard_tests t
    JOIN bis_notifications n ON (n.related_entity_id = t.id::text AND n.notification_type = 'test_change')
    WHERE t.standard_id = %s
    ORDER BY n.created_at DESC;
""", (std,))
rows = cur.fetchall()
print(f"Total mapped tests for {std}: {len(rows)}")
for r in rows[:4]:
    print(dict(r))

cur.close()
conn.close()
