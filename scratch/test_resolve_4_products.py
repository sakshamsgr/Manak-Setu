import urllib.request
import json

products = [
    "Electric Iron",
    "Electric Washing Machine",
    "Split Air Conditioner",
    "Electric Fan"
]

url = "http://127.0.0.1:8000/api/product-guide/resolve"

for p in products:
    payload = {
        "query": p,
        "product_name": p,
        "industry_category": "Electrical & Electronics",
        "enterprise_scale": "micro",
        "is_foreign": False,
        "language": "en"
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            std = data.get('standard', {})
            print(f"Product: '{p}'")
            print(f"  Standard Number: {std.get('standard_number')}")
            print(f"  Title: {std.get('title')}")
            print(f"  Text Standard ID: {std.get('text_standard_id')}")
            print(f"  Confirmed: {std.get('confirmed')}")
            print(f"  Confidence: {std.get('confidence')}")
            print("---")
    except Exception as e:
        print(f"Product: '{p}' -> FAILED: {e}")
