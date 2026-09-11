import requests
import json

res = requests.get('http://127.0.0.1:8000/api/standards/302-part-2-sec-3-2024-electric_irons/testing-and-labs')
assert res.status_code == 200, f'Status {res.status_code}'
data = res.json()
labs = data.get('laboratories', [])
print(f'Retrieved {len(labs)} laboratories from backend.', flush=True)

found_scopes = 0
for lab in labs:
    name = lab.get('name')
    scopes = lab.get('testing_scopes', [])
    if scopes:
        found_scopes += 1
        print(f"Lab: {name}", flush=True)
        print(f"  City: {lab.get('city')}, State: {lab.get('state')}", flush=True)
        print(f"  Active: {lab.get('active_status')}", flush=True)
        print(f"  Scopes/Charges count: {len(scopes)}", flush=True)
        for sc in scopes[:2]:
            print(f"    -> Charge: ₹{sc.get('testing_charge')} | {sc.get('grade_type_size') or sc.get('remarks')}", flush=True)

print(f"\nTotal labs with charges/scopes: {found_scopes}", flush=True)

# Also check that built frontend contains 'Charges:' and not 'Testing Scopes & Charges:'
with open('frontend/dist/assets/index-Cc2DM8tZ.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

assert 'Testing Scopes & Charges:' not in js_content, "Old text still present in bundle!"
assert 'Charges:' in js_content, "'Charges:' missing from bundle!"
print("Frontend bundle verification: Old heading removed, new heading 'Charges:' verified in bundle.", flush=True)
