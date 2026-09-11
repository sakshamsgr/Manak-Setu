import sys, os, asyncio
sys.path.insert(0, os.path.abspath('.'))
sys.stdout.reconfigure(encoding='utf-8')
import psycopg2
from dotenv import load_dotenv
load_dotenv()
from api_server import _resolve_product_guide_core, ProductGuideResolveRequest, get_db

async def test_all():
    products = ["Electric Iron", "Electric Water Heater", "Room Heater", "Fan"]
    conn = get_db()
    cur = conn.cursor()
    for p in products:
        req = ProductGuideResolveRequest(query=p, product_name=p)
        res = await _resolve_product_guide_core(req, conn, cur)
        print(f"\nProduct: {p}")
        print(f"  Found: {res.get('found')}")
        if res.get('found'):
            std = res.get('standard', {})
            print(f"  Standard Number: {std.get('standard_number')}")
            print(f"  Standard Title: {std.get('title')}")
            print(f"  Text Std ID: {std.get('text_standard_id')}")
    cur.close()
    conn.close()

asyncio.run(test_all())
