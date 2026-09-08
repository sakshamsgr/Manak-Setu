import requests

# 1. Step 1 -> Step 2
resolve_res = requests.post('http://127.0.0.1:8000/api/product-guide/resolve', json={
    'query': 'Electric Fan',
    'product_name': 'Electric Fan'
})
resolve_data = resolve_res.json()
std = resolve_data.get('standard', {})
std_id = std.get('text_standard_id') or std.get('standard_number')
print('Step 2 Standard Number:', std.get('standard_number'))
print('Standard ID passed to Step 4:', std_id)

# 2. Step 4 API query
test_res = requests.get(f'http://127.0.0.1:8000/api/standards/{std_id}/testing-and-labs')
testing_data = test_res.json()

routine_tests = testing_data.get('routine_tests', [])
type_tests = testing_data.get('type_tests', [])
labs = testing_data.get('laboratories', [])

print('\n=== Step 4 Frontend State for Electric Fan ===')
print('Routine tests count:', len(routine_tests))
print('Type tests count:', len(type_tests))
print('Total tests count:', len(routine_tests) + len(type_tests))
print('Laboratories count:', len(labs))
print('Will show empty notice:', len(routine_tests) == 0)

print('\nTop 5 Routine Tests displayed in Step 4:')
for i, t in enumerate(routine_tests[:5]):
    print(f"  {i+1}. Clause {t.get('clause')}: {t.get('requirement')} | Method: {t.get('test_method')} | Frequency: {t.get('frequency')}")

for prod in ['Electric Iron', 'Electric Immersion Water Heater']:
    resolve_res = requests.post('http://127.0.0.1:8000/api/product-guide/resolve', json={'query': prod, 'product_name': prod})
    std = resolve_res.json().get('standard', {})
    std_id = std.get('text_standard_id') or std.get('standard_number')
    
    test_res = requests.get(f'http://127.0.0.1:8000/api/standards/{std_id}/testing-and-labs')
    data = test_res.json()
    r = len(data.get('routine_tests', []))
    t = len(data.get('type_tests', []))
    labs = len(data.get('laboratories', []))
    matched = data.get('matched_standard_id')
    std_num = std.get('standard_number')
    print(f"\n=== {prod} ({std_num}) ===")
    print(f"Matched Standard: {matched}")
    print(f"Routine: {r}, Type: {t}, Total Tests: {r+t}, Labs: {labs}")
