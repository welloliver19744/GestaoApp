import sqlite3, json
conn = sqlite3.connect("/tmp/db_check.db")
# Check transactions _collections entry
row = conn.execute("SELECT name, fields FROM _collections WHERE name='transactions'").fetchone()
if row:
    fields = json.loads(row[1])
    print(f"transactions fields ({len(fields)}):")
    for f in fields:
        print(f"  {f['name']}: type={f['type']}, required={f.get('required', False)}")
else:
    print("transactions not found")
conn.close()
