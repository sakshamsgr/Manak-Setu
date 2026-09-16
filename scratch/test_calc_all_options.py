import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

# 1. Fetch options
req = urllib.request.Request(f"{BASE_URL}/api/standards/options")
with urllib.request.urlopen(req) as resp:
    options_data = json.loads(resp.read().decode())

options = options_data.get("options", [])
print(f"Total options from API: {len(options)}")
for opt in options:
    print(f"  [{opt['code']}] {opt['title']} ({opt['id']})")

print("\n--- Testing calculation for each option ---")
for opt in options:
    post_data = json.dumps({
        "standard_id": opt["id"],
        "scale": "large",
        "is_foreign": False,
        "scheme": "Scheme-I",
        "inspection_days": 2
    }).encode("utf-8")
    
    calc_req = urllib.request.Request(
        f"{BASE_URL}/api/estimator/calculate", 
        data=post_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(calc_req) as calc_resp:
        res = json.loads(calc_resp.read().decode())
        success = res.get("success")
        subtotal = res.get("subtotal")
        items_count = len(res.get("items", []))
        marking_fee = next((i for i in res.get("items", []) if "marking" in i["category"].lower()), None)
        mf_net = marking_fee["net"] if marking_fee else None
        print(f"[{opt['code']}] success={success}, subtotal={subtotal}, marking_fee={mf_net}")

# Test an invalid standard ID that has no fee data
invalid_post = json.dumps({
    "standard_id": "329021d8-7c3f-4d12-a2dd-ea31e1b70347", # IS 1391 Part 1
    "scale": "large",
    "is_foreign": False,
    "scheme": "Scheme-I",
    "inspection_days": 2
}).encode("utf-8")
inv_req = urllib.request.Request(
    f"{BASE_URL}/api/estimator/calculate",
    data=invalid_post,
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(inv_req) as inv_resp:
    res = json.loads(inv_resp.read().decode())
    print("\n[IS 1391 Part 1 (Direct Calculation Check)]:", res.get("code"), res.get("message"))
