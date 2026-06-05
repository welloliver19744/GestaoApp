import sqlite3
conn = sqlite3.connect("/tmp/db_recreate.db")
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '\\_%' ESCAPE '\\' ORDER BY name").fetchall()
for t in tables:
    print(t[0])
conn.close()
