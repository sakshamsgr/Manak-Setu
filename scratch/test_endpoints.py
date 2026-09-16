import urllib.request
import json

# 1. Test GET /api/standards/options
req = urllib.request.Request('http://127.0.0.1:8000/api/standards/options')
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())

options = data.get("options", [])
print(f"Total options returned: {len(options)}")
for o in options:
    print(f"  {o['code']:<30} | ID: {o['id']:<36} | {o['title']}")

# 2. Test POST /api/estimator/calculate with a few standards
print("\n" + "="*50)
print("TESTING POST /api/estimator/calculate:")
print("="*50)

test_cases = [
    # Split AC
    ("IS 1391 (Part 2)", [o for o in options if "1391 (Part 2)" in o['code']][0]['id'], "micro"),
    # Washing Machine
    ("Washing Machine", [o for o in options if "302 (Part 2/Sec 7)" in o['code']][0]['id'], "large"),
    # Electric Immersion Heater
    ("Immersion Heater", [o for o in options if "368" in o['code']][0]['id'], "micro"),
]

for label, std_id, scale in test_cases:
    payload = json.dumps({
        "standard_id": std_id,
        "scheme": "Scheme-I",
        "industry_scale": scale,
        "is_foreign": False,
        "num_varieties": 1,
        "inspection_days": 2
    }).encode('utf-8')
    
    post_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/estimator/calculate',
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(post_req) as resp:
        calc_result = json.loads(resp.read().decode())
    
    print(f"\n--- Result for {label} ({scale}) ---")
    for item in calc_result.get("items", []):
        print(f"  {item['category']:<40} : Net={item['net']} (Gross={item['amount']}, Concession={item['concession']})")
    print(f"  Subtotal: {calc_result.get('subtotal')} | Tax: {calc_result.get('tax_amount')} | Total Year 1: {calc_result.get('total_year_1')}")
