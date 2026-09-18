import sqlite3

try:
    conn = sqlite3.connect('bis_standards.db')
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cur.fetchall()
    print('Tables in bis_standards.db:', tables)
    for (t,) in tables:
        cur.execute(f"SELECT COUNT(*) FROM [{t}];")
        cnt = cur.fetchone()[0]
        print(f"  Table '{t}': {cnt} rows")
        cur.execute(f"PRAGMA table_info([{t}]);")
        cols = [c[1] for c in cur.fetchall()]
        print(f"    cols: {cols}")
        # Search for 366
        try:
            where_clause = " OR ".join([f"CAST([{c}] AS text) LIKE '%366%'" for c in cols])
            cur.execute(f"SELECT COUNT(*) FROM [{t}] WHERE {where_clause};")
            m_cnt = cur.fetchone()[0]
            if m_cnt > 0:
                print(f"    --> {m_cnt} rows matching '366'")
        except Exception as e:
            print(f"    search error: {e}")
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
