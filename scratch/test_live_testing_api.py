import urllib.request, json, urllib.parse, sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

standards_to_test = [
    ("IS 366:1991 (Electric Irons - Requested)", "IS 366:1991"),
    ("366_ELECTRIC_IRON_AMENDMENT (Slug)", "366_ELECTRIC_IRON_AMENDMENT"),
    ("IS 302-2-7 (Washing Machines)", "302-part-2-sec-7-2024-domestic-electric-clothes-washing-machines"),
    ("IS 302-2-80 (Electric Fans)", "302-part-2-sec-80-2017-fans"),
    ("IS 1391 Part 2 (Air Conditioners)", "1391-part-2-2023-room-air-conditioners-split-air-conditioners"),
    ("IS 3024:2015 (Genuinely No Test Data)", "IS 3024:2015"),
]

print(f"{'STANDARD':<45} | {'TESTS':<6} | {'LABS':<6} | {'GROUPS':<6} | {'STATUS'}")
print("-" * 80)

for label, sid in standards_to_test:
    enc = urllib.parse.quote(sid, safe='')
    url = f"{BASE_URL}/api/standards/{enc}/testing-and-labs"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            r_tests = len(data.get("routine_tests", []))
            t_tests = len(data.get("type_tests", []))
            total_tests = r_tests + t_tests
            labs = len(data.get("laboratories", []))
            groups = len(data.get("grouping_rules", []))
            avail = data.get("verified_data_available", False)
            print(f"{label:<45} | {total_tests:<6} | {labs:<6} | {groups:<6} | {'SUCCESS' if (total_tests > 0 or 'No Test Data' in label) else 'EMPTY'}")
    except Exception as e:
        print(f"{label:<45} | ERROR: {e}")
