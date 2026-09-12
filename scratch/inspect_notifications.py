import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)

cur.execute("SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'bis_notifications';")
print("Row security:", cur.fetchall())

cur.execute("SELECT * FROM pg_policies WHERE tablename = 'bis_notifications';")
print("Policies:", cur.fetchall())

cur.execute("""
    SELECT distinct notification_type, related_entity_type
    FROM bis_notifications;
""")
print("Distinct types:", cur.fetchall())

cur.execute("""
    SELECT count(*) as total,
           min(created_at) as earliest,
           max(created_at) as latest
    FROM bis_notifications;
""")
print("Stats:", cur.fetchall())

cur.close()
conn.close()
