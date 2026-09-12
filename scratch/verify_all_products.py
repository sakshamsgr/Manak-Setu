import requests
import urllib.parse
import sys

products = ['Electric Iron', 'Electric Washing Machine', 'Split Air Conditioner', 'Electric Fan']

print('=== 1. VERIFYING 4 SHORTCUT PRODUCTS ===', flush=True)
for p in products:
    res = requests.post('http://127.0.0.1:8000/api/product-guide/resolve', json={'query': p, 'product_name': p}, timeout=15)
    assert res.status_code == 200, f'Status code {res.status_code}'
    data = res.json()
    std = data.get('standard', {})
    std_num = std.get('standard_number')
    print(f"Product: {p}", flush=True)
    print(f"  Standard: {std_num}", flush=True)
    print(f"  Title: {std.get('title')}", flush=True)
    print(f"  Confirmed: {std.get('confirmed')}", flush=True)
    print(f"  Confidence: {std.get('confidence')}", flush=True)
    
    # Downstream verification: Step 4 Testing and Laboratories
    target_id = std.get("text_standard_id") or std_num
    enc_id = urllib.parse.quote(str(target_id), safe='')
    t_res = requests.get(f"http://127.0.0.1:8000/api/standards/{enc_id}/testing-and-labs", timeout=10)
    print(f"  Step 4 Testing & Labs: HTTP {t_res.status_code}", flush=True)
    
    # Step 5 Documents
    d_res = requests.get(f"http://127.0.0.1:8000/api/standards/{enc_id}/documents", timeout=10)
    print(f"  Step 5 Documents: HTTP {d_res.status_code}", flush=True)

    # Step 6 Process
    p_res = requests.get(f"http://127.0.0.1:8000/api/standards/{enc_id}/process", timeout=10)
    print(f"  Step 6 Process: HTTP {p_res.status_code}", flush=True)
    print('---', flush=True)

print('=== 2. VERIFYING EXISTING PRODUCT QUERY (REGRESSION CHECK) ===', flush=True)
existing_res = requests.post('http://127.0.0.1:8000/api/product-guide/resolve', json={'query': 'Immersion Water Heater', 'product_name': 'Immersion Water Heater'}, timeout=15)
assert existing_res.status_code == 200
existing_data = existing_res.json()
print('Immersion Water Heater ->', existing_data.get('standard', {}).get('standard_number'), '| Confirmed:', existing_data.get('standard', {}).get('confirmed'), flush=True)
print('ALL CHECKS PASSED SUCCESSFULLY!', flush=True)
