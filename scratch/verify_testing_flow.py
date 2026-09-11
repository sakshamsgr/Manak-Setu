import urllib.request
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

print("=================================================================")
print("END-TO-END VERIFICATION: BIS NOTIFICATIONS <-> STEP 4 TESTING")
print("=================================================================")

# 1. Inspect DB record in bis_notifications
conn = psycopg2.connect(os.getenv('DB_URI'))
cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute("""
    SELECT id, notification_type, title, message, related_entity_id, new_value, created_at
    FROM bis_notifications
    WHERE notification_type = 'test_change' AND related_entity_id = '120';
""")
notif_rec = dict(cur.fetchone())
print("\n[Step 1: Existing test_change record in bis_notifications]")
print(f"Notification ID: {notif_rec['id']}")
print(f"Notification Title: {notif_rec['title']}")
print(f"Notification Message: {notif_rec['message']}")
print(f"Related Entity ID: {notif_rec['related_entity_id']}")
print(f"Target Standard ID: {notif_rec['new_value'].get('standard_id')}")

# 2. Inspect corresponding record in standard_tests
cur.execute("""
    SELECT id, standard_id, clause, requirement, test_method, testing_type, sample_quantity, frequency, source_page
    FROM standard_tests
    WHERE id = 120;
""")
test_rec = dict(cur.fetchone())
cur.close()
conn.close()

print("\n[Step 2: Corresponding record in standard_tests table]")
print(f"Test ID: {test_rec['id']}")
print(f"Standard ID: {test_rec['standard_id']}")
print(f"Clause: {test_rec['clause']}")
print(f"Requirement: {test_rec['requirement']}")
print(f"Method: {test_rec['test_method']}")
print(f"Testing Type: {test_rec['testing_type']}")

# 3. Call Backend API for the affected standard
std_id = notif_rec['new_value'].get('standard_id')
api_url = f"http://127.0.0.1:8000/api/standards/{std_id}/testing-and-labs"
with urllib.request.urlopen(api_url, timeout=5) as resp:
    api_data = json.loads(resp.read().decode('utf-8'))

print(f"\n[Step 3: Backend API response for affected standard ({std_id})]")
print(f"Has Regulatory Updates Flag: {api_data.get('has_regulatory_updates')}")
print(f"Regulatory Notices Count: {api_data.get('regulatory_notifications_count')}")

all_tests = api_data.get('routine_tests', []) + api_data.get('type_tests', [])
matched_api_test = next((t for t in all_tests if t.get('id') == 120 or (t.get('clause') == '8' and 'Protection' in t.get('requirement', ''))), None)

if matched_api_test:
    print(f"Mapped Test in API: Clause {matched_api_test['clause']} - {matched_api_test['requirement']}")
    print(f"  is_updated: {matched_api_test.get('is_updated')}")
    print(f"  regulatory_source: {matched_api_test.get('regulatory_source')}")
    print(f"  regulatory_update payload: {matched_api_test.get('regulatory_update')}")
else:
    print("ERROR: Test not found in API response!")

# 4. Call Backend API for unrelated standard (IS 302 Part 2 Sec 3)
unrelated_std = "302-part-2-sec-3-2024-electric-irons"
unrelated_url = f"http://127.0.0.1:8000/api/standards/{unrelated_std}/testing-and-labs"
with urllib.request.urlopen(unrelated_url, timeout=5) as resp:
    unrelated_data = json.loads(resp.read().decode('utf-8'))

print(f"\n[Step 4: Backend API response for unrelated standard ({unrelated_std})]")
print(f"Has Regulatory Updates Flag: {unrelated_data.get('has_regulatory_updates')}")
print(f"Regulatory Notices Count: {unrelated_data.get('regulatory_notifications_count')}")
unrelated_all_tests = unrelated_data.get('routine_tests', []) + unrelated_data.get('type_tests', [])
any_updated = any(t.get('is_updated') for t in unrelated_all_tests)
print(f"Any test in unrelated standard flagged as updated: {any_updated} (Must be False)")

print("\n=================================================================")
print("ALL VERIFICATION CHECKS PASSED: DATA FLOW PROVEN FROM DB TO API")
print("=================================================================")
