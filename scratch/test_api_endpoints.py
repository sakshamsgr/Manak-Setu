import os
import requests

# Test endpoint
BASE_URL = "http://localhost:8000"

# 1. Test GET /api/standards/options
res = requests.get(f"{BASE_URL}/api/standards/options")
print("Status code:", res.status_code)
data = res.json()
options = data.get("options", [])
print(f"Total options returned: {len(options)}")
for opt in options:
    print(f"  {opt['code']} - {opt['title']} (ID: {opt['id']})")

print("\nChecking if IS 1391 (Part 1):2023 is in options:")
has_part_1 = any("part 1" in opt['code'].lower() or "unitary" in opt['title'].lower() for opt in options)
print(f"  IS 1391 (Part 1) present: {has_part_1} (MUST BE FALSE)")

# 2. Test calculate for each option
print("\nTesting calculate for each option:")
for opt in options:
    calc_res = requests.post(f"{BASE_URL}/api/estimator/calculate", json={
        "standard_id": opt["id"],
        "scale": "large",
        "is_foreign": False,
        "scheme": "Scheme-I",
        "inspection_days": 2
    })
    calc_data = calc_res.json()
    success = calc_data.get("success")
    subtotal = calc_data.get("subtotal")
    print(f"  {opt['code']}: success={success}, subtotal={subtotal}")
