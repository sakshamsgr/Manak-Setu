import requests

print("=================================================================")
print("PART 1: TESTING THE 3 DIRECT STANDARD ENDPOINTS")
print("=================================================================")

direct_endpoints = [
    ("Electric Fan PM", "302-2-80_fans_product_manual_PM-IS_302-Part2-Sec80-4_July2026"),
    ("Electric Iron", "302-part-2-sec-3-2024-electric-irons"),
    ("Electric Water Immersion Heater", "368-2014-electric-immersion-water-heaters")
]

for label, sid in direct_endpoints:
    url = f"http://127.0.0.1:8000/api/standards/{sid}/testing-and-labs"
    res = requests.get(url)
    assert res.status_code == 200, f"Failed for {label}: {res.status_code}"
    data = res.json()
    r = data.get("routine_tests", [])
    t = data.get("type_tests", [])
    matched = data.get("matched_standard_id")
    labs = len(data.get("laboratories", []))
    print(f"\n[Endpoint] {label}:")
    print(f"  URL Standard ID : {sid}")
    print(f"  Matched Standard: {matched}")
    print(f"  Total DB Rows   : {len(r) + len(t)}")
    print(f"  Routine Tests   : {len(r)}")
    print(f"  Type Tests      : {len(t)}")
    print(f"  Laboratories    : {labs}")
    print(f"  Verified Available: {data.get('verified_data_available')}")

print("\n=================================================================")
print("PART 2: STEP 1 -> STEP 2 -> STEP 4 PIPELINE FOR ALL 3 PRODUCTS")
print("=================================================================")

products = [
    "Electric Fan",
    "Electric Iron",
    "Electric Water Immersion Heater",
    "Electric Immersion Water Heater"
]

for prod in products:
    # Step 1 -> Step 2
    r_res = requests.post("http://127.0.0.1:8000/api/product-guide/resolve", json={
        "query": prod,
        "product_name": prod
    })
    r_data = r_res.json()
    std = r_data.get("standard", {})
    std_num = std.get("standard_number")
    text_id = std.get("text_standard_id")
    
    # Step 2 -> Step 4
    step4_id = text_id or std_num
    t_res = requests.get(f"http://127.0.0.1:8000/api/standards/{step4_id}/testing-and-labs")
    t_data = t_res.json()
    r_tests = t_data.get("routine_tests", [])
    t_tests = t_data.get("type_tests", [])
    matched = t_data.get("matched_standard_id")
    
    print(f"\n[Product Pipeline] '{prod}':")
    print(f"  Step 2 Standard Number : {std_num}")
    print(f"  Step 2 Text Standard ID: {text_id}")
    print(f"  Step 4 Sent Identifier : {step4_id}")
    print(f"  Step 4 Matched Standard: {matched}")
    print(f"  Total Tests Found      : {len(r_tests) + len(t_tests)}")
    print(f"  Routine Tests (Tab 1)  : {len(r_tests)}")
    print(f"  Type Tests (Tab 2)     : {len(t_tests)}")
    print(f"  Will show 'No routine' : {len(r_tests) == 0}")

print("\n=================================================================")
print("PART 3: TEST UNRELATED STANDARD (SAFETY AGAINST SELECTING ARBITRARY DATA)")
print("=================================================================")

unrelated_sid = "IS 99999-NON-EXISTENT"
u_res = requests.get(f"http://127.0.0.1:8000/api/standards/{unrelated_sid}/testing-and-labs")
u_data = u_res.json()
print(f"Unrelated query '{unrelated_sid}':")
print(f"  Matched Standard: {u_data.get('matched_standard_id')}")
print(f"  Verified Available: {u_data.get('verified_data_available')}")
print(f"  Message: {u_data.get('message')}")
print(f"  Total Tests: {len(u_data.get('routine_tests', [])) + len(u_data.get('type_tests', []))}")
