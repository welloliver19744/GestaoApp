import sqlite3, json, sys

db_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/db_fix_trans.db'
conn = sqlite3.connect(db_path)

row = conn.execute("SELECT id, fields FROM _collections WHERE name='transactions'").fetchone()
cid, fields_json = row
fields = json.loads(fields_json)

for f in fields:
    if f['name'] == 'category':
        f['type'] = 'text'
        f['required'] = False
        f['options'] = {}
        print(f"Changed category from relation to text")

conn.execute("UPDATE _collections SET fields=? WHERE name='transactions'", (json.dumps(fields),))
conn.commit()
conn.close()
print("Done!")
