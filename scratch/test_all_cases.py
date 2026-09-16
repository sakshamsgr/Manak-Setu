import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

# 1. Fetch standards options
req = urllib.request.Request(f"{BASE_URL}/api/standards/options")
with urllib.request.urlopen(req) as resp:
    options = json.loads(resp.read().decode())["options"]

print(f"Total standards from API: {len(options)}")

std_map = {o["code"]: o["id"] for o in options}

def test_calc(std_code, scale="micro", is_foreign=False):
    std_id = std_map.get(std_code)
    if not std_id:
        print(f"ERROR: {std_code} not found in options!")
        return None
        
    payload = json.dumps({
        "standard_id": std_id,
        "scheme": "Scheme-I",
        "industry_scale": scale,
        "is_foreign": is_foreign,
        "num_varieties": 1,
        "inspection_days": 2
    }).encode("utf-8")
    
    post_req = urllib.request.Request(
        f"{BASE_URL}/api/estimator/calculate",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(post_req) as resp:
        return json.loads(resp.read().decode())

print("\n" + "="*60)
print("CASE 1: IS 1391 (Part 1):2023 (Unitary Air Conditioners) - NO fee records in bis_fees")
print("="*60)
res1 = test_calc("IS 1391 (Part 1):2023")
print("Response:", json.dumps(res1, indent=2))
assert res1["success"] is False
assert res1["code"] == "FEE_DATA_UNAVAILABLE"
print(">>> PASS: Returned FEE_DATA_UNAVAILABLE with no calculation!")

print("\n" + "="*60)
print("CASE 2: IS 1391 (Part 2):2023 (Split Air Conditioners) - HAS fee records in bis_fees")
print("="*60)
res2 = test_calc("IS 1391 (Part 2):2023", "micro")
print("Response success:", res2["success"])
print("Items:")
for item in res2["items"]:
    print(f"  {item['category']:<40} : Net={item['net']} (Gross={item['amount']}, Concession={item['concession']})")
print(f"Subtotal: {res2['subtotal']} | Tax: {res2['tax_amount']} | Total Year 1: {res2['total_year_1']}")
assert res2["success"] is True
assert res2["items"][4]["net"] == 15800.0  # Micro scale marking fee from bis_fees!
print(">>> PASS: Correctly calculated strictly from bis_fees!")

print("\n" + "="*60)
print("CASE 2b: IS 368:2014 (Immersion Heater) - HAS fee records in bis_fees")
print("="*60)
res2b = test_calc("IS 368:2014", "micro")
print("Response success:", res2b["success"])
for item in res2b["items"]:
    print(f"  {item['category']:<40} : Net={item['net']} (Gross={item['amount']}, Concession={item['concession']})")
print(f"Subtotal: {res2b['subtotal']} | Tax: {res2b['tax_amount']} | Total Year 1: {res2b['total_year_1']}")
assert res2b["success"] is True
assert res2b["items"][4]["net"] == 17800.0  # Micro scale marking fee from bis_fees!
print(">>> PASS: Correctly calculated strictly from bis_fees!")

print("\n" + "="*60)
print("CASE 3: IS 2347:2023 (Pressure Cooker) - NO fee records in bis_fees")
print("="*60)
res3 = test_calc("IS 2347:2023")
print("Response:", json.dumps(res3, indent=2))
assert res3["success"] is False
assert res3["code"] == "FEE_DATA_UNAVAILABLE"
print(">>> PASS: Returned FEE_DATA_UNAVAILABLE with no calculation!")

print("\n" + "="*60)
print("CASE 3b: IS 302-2-14:2009 (Kitchen Machines) - NO fee records in bis_fees")
print("="*60)
res3b = test_calc("IS 302-2-14:2009")
print("Response:", json.dumps(res3b, indent=2))
assert res3b["success"] is False
assert res3b["code"] == "FEE_DATA_UNAVAILABLE"
print(">>> PASS: Returned FEE_DATA_UNAVAILABLE with no calculation!")
