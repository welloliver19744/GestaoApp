import sqlite3
conn = sqlite3.connect("/tmp/db_check.db")
rows = conn.execute("SELECT id, name FROM cards").fetchall()
for r in rows:
    print(repr(r[0]), repr(r[1]))
conn.close()
