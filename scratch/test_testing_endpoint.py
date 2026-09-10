import sys, os
sys.path.insert(0, os.path.abspath('.'))
sys.stdout.reconfigure(encoding='utf-8')
import psycopg2
from dotenv import load_dotenv
load_dotenv()
from api_server import _get_testing_and_labs_core, get_db

tests_to_run = [
    ("Electric Iron", "302-part-2-sec-3-2024-electric_irons"),
    ("Electric Iron (std num)", "IS 302 (Part 2/Sec 3):2024"),
    ("Electric Iron (IS 366)", "IS 366:1991"),
    ("Electric Water Heater", "368_2014_ELECTRIC_IMMERSION_WATER_HEATERS_PM"),
    ("Electric Water Heater (std num)", "IS 368:2014"),
    ("Room Heater", "369-2019_ELECTRIC_ROOM_HEATERS_PM.pdf"),
    ("Room Heater (std num)", "IS 369:2019"),
    ("Room Heater (IS 302-2-30)", "IS 302 (Part 2/Sec 30):2007"),
    ("Fan", "302-2-80_fans_product_manual_PM-IS_302-Part2-Sec80-4_July2026"),
    ("Fan (std num)", "IS 302 (Part 2/Sec 80):2017"),
]

conn = get_db()
cur = conn.cursor()
for label, sid in tests_to_run:
    res = _get_testing_and_labs_core(conn, cur, sid)
    print(f"\n[{label}] input: '{sid}'")
    print(f"  matched_standard_id: {res.get('matched_standard_id')}")
    print(f"  verified_data_available: {res.get('verified_data_available')}")
    print(f"  routine_tests count: {len(res.get('routine_tests', []))}")
    print(f"  type_tests count: {len(res.get('type_tests', []))}")
    print(f"  laboratories count: {len(res.get('laboratories', []))}")
    print(f"  grouping_rules count: {len(res.get('grouping_rules', []))}")

cur.close()
conn.close()
