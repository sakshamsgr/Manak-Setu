import urllib.request
import urllib.parse
import json

standards = [
    "302-part-2-sec-3-2024-electric_irons",
    "302-2-7_domestic_electric_clothes_washing_machines_extension_circular_May2024",
    "1391-part-2_room_air_conditioners_split_air_conditioners_product_manual_PM-IS_1391-Part2_Sep2023.pdf",
    "302-2-80_fans_product_manual_PM-IS_302-Part2-Sec80-4_July2026"
]

base_url = "http://127.0.0.1:8000/api/standards"

for s in standards:
    print(f"\nTesting standard: {s}")
    for endpoint in ["testing-and-labs", "documents", "process"]:
        url = f"{base_url}/{urllib.parse.quote(s)}/{endpoint}"
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print(f"  {endpoint}: OK")
        except Exception as e:
            print(f"  {endpoint}: FAILED -> {e}")
