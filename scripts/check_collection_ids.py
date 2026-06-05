import sqlite3, json
conn = sqlite3.connect("/tmp/db_check2.db")
rows = conn.execute("SELECT id, name FROM _collections WHERE name IN ('categories','users','transactions')").fetchall()
for r in rows:
    print(f"{r[1]}: id={r[0]}")
conn.close()
