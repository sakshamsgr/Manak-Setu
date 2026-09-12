import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)

cur.execute("""
    SELECT id, notification_type, title, message, related_entity_type, 
           related_entity_id, previous_value, new_value, created_at, dedupe_key
    FROM bis_notifications
    ORDER BY created_at DESC
    LIMIT 10;
""")
rows = cur.fetchall()
print(f"Retrieved {len(rows)} notifications")
for r in rows[:3]:
    r_dict = dict(r)
    r_dict['id'] = str(r_dict['id'])
    if hasattr(r_dict['created_at'], 'isoformat'):
        r_dict['created_at'] = r_dict['created_at'].isoformat()
    print(r_dict)

cur.close()
conn.close()
