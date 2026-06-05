import sqlite3, json
conn = sqlite3.connect("/tmp/db_verify_fix.db")
row = conn.execute("SELECT name, fields FROM _collections WHERE name='cards'").fetchone()
fields = json.loads(row[1])
for f in fields:
    print(json.dumps(f, indent=2))
conn.close()
