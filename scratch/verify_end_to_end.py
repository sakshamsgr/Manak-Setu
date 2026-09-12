import os
import urllib.request
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# 1. Query Supabase PostgreSQL directly
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute("""
    SELECT id, notification_type, title, message, related_entity_type,
           related_entity_id, previous_value, new_value, created_at, dedupe_key
    FROM bis_notifications
    ORDER BY created_at DESC
    LIMIT 3;
""")
db_rows = cur.fetchall()
cur.close()
conn.close()

print(f"=== 1. Direct Supabase Database Query (bis_notifications) ===")
print(f"Retrieved {len(db_rows)} records directly from PostgreSQL.")
db_record_0 = dict(db_rows[0])
print(f"DB Record #1 ID: {db_record_0['id']}")
print(f"Type: {db_record_0['notification_type']}")
print(f"Title: {db_record_0['title']}")
print(f"Message: {db_record_0['message']}")
print(f"Created At: {db_record_0['created_at']}")
print(f"New Value: {json.dumps(db_record_0['new_value'])}")

# 2. Query FastAPI Backend API
api_url = "http://127.0.0.1:8000/api/notifications?limit=3"
print(f"\n=== 2. HTTP GET to Backend API ({api_url}) ===")
req = urllib.request.Request(api_url)
with urllib.request.urlopen(req, timeout=5) as resp:
    api_data = json.loads(resp.read().decode('utf-8'))

print(f"API HTTP Status: 200 OK")
print(f"API Success Field: {api_data.get('success')}")
print(f"API Total: {api_data.get('total')}")
api_record_0 = api_data['notifications'][0]
print(f"API Record #1 ID: {api_record_0['id']}")
print(f"Type: {api_record_0['notification_type']}")
print(f"Title: {api_record_0['title']}")
print(f"Message: {api_record_0['message']}")
print(f"Created At: {api_record_0['created_at']}")
print(f"New Value: {json.dumps(api_record_0['new_value'])}")

# 3. Prove exact field matching between DB and API
print(f"\n=== 3. Exact Match Comparison between Database and API Response ===")
match_id = str(db_record_0['id']) == str(api_record_0['id'])
match_type = db_record_0['notification_type'] == api_record_0['notification_type']
match_title = db_record_0['title'] == api_record_0['title']
match_message = db_record_0['message'] == api_record_0['message']
match_new_value = db_record_0['new_value'] == api_record_0['new_value']

print(f"ID Matches: {match_id}")
print(f"Notification Type Matches: {match_type}")
print(f"Title Matches: {match_title}")
print(f"Message Matches: {match_message}")
print(f"New Value JSON Matches: {match_new_value}")

# 4. Check certificate_expiring_soon record specifically
print(f"\n=== 4. Specific Check for certificate_expiring_soon ===")
api_cert_url = "http://127.0.0.1:8000/api/notifications?notification_type=certificate_expiring_soon"
with urllib.request.urlopen(api_cert_url, timeout=5) as resp:
    cert_data = json.loads(resp.read().decode('utf-8'))
print(f"Total certificate_expiring_soon found: {cert_data['total']}")
if cert_data['notifications']:
    cert_rec = cert_data['notifications'][0]
    print(f"Cert Record ID: {cert_rec['id']}")
    print(f"Cert Title: {cert_rec['title']}")
    print(f"Cert Message: {cert_rec['message']}")
    print(f"Cert New Value: {cert_rec['new_value']}")
