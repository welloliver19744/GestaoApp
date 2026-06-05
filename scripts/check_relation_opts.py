import sqlite3, json
conn = sqlite3.connect("/tmp/db_check2.db")
row = conn.execute("SELECT name, fields FROM _collections WHERE name='transactions'").fetchone()
if row:
    fields = json.loads(row[1])
    for f in fields:
        if f['type'] == 'relation':
            print(f"field={f['name']}")
            print(f"  options={json.dumps(f.get('options', {}), indent=4)}")
conn.close()
