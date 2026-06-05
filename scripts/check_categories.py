import sqlite3, json
conn = sqlite3.connect("/tmp/db_check2.db")
rows = conn.execute("SELECT id, name FROM categories").fetchall()
for r in rows:
    print(f"id={r[0]!r} name={r[1]!r}")
conn.close()
