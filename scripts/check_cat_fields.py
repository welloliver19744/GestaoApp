import sqlite3, json
conn = sqlite3.connect("/tmp/db_check2.db")
for name in ['categories', 'transactions']:
    row = conn.execute("SELECT name, fields FROM _collections WHERE name=?", (name,)).fetchone()
    if row:
        fields = json.loads(row[1])
        names = [f['name'] for f in fields]
        print(f"{name}: fields = {names}")
        has_id = 'id' in names
        print(f"  has id field: {has_id}")
conn.close()
