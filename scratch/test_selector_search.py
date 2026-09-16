import urllib.request
import json
import re

# Fetch options from API
req = urllib.request.Request('http://127.0.0.1:8000/api/standards/options')
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
options = data.get("options", [])

def filter_options(query, options):
    q = query.strip().lower()
    if not q:
        return options
    clean_q = re.sub(r'[^a-z0-9]', '', q)
    terms = q.split()
    
    results = []
    for opt in options:
        code = opt['code'].lower()
        title = opt['title'].lower()
        oid = opt['id'].lower()
        clean_code = re.sub(r'[^a-z0-9]', '', code)
        clean_title = re.sub(r'[^a-z0-9]', '', title)
        clean_id = re.sub(r'[^a-z0-9]', '', oid)
        
        if q in code or q in title:
            results.append(opt)
            continue
        if clean_q and (clean_q in clean_code or clean_q in clean_title or clean_q in clean_id):
            results.append(opt)
            continue
        combined = f"{code} {title} {oid}"
        if len(terms) > 1 and all(term in combined for term in terms):
            results.append(opt)
            continue
    return results

searches = ['air', '302', 'tumbler', 'washing', 'fan', 'iron']
print("=== SIMULATING EXACT SEARCHABLE SELECTOR BEHAVIOR WITH API DATA ===")
for s in searches:
    matched = filter_options(s, options)
    print(f"\nSearch: '{s}' -> {len(matched)} match(es):")
    for m in matched:
        print(f"  [{m['code']}] {m['title']} (id: {m['id']})")
