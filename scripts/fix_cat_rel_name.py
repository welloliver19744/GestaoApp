import sqlite3, json

db_path = '/tmp/db_verify_fix.db'
conn = sqlite3.connect(db_path)

row = conn.execute("SELECT id, fields FROM _collections WHERE name='transactions'").fetchone()
cid, fields_json = row
fields = json.loads(fields_json)

for f in fields:
    if f['type'] == 'relation':
        opts = f.get('options', {})
        # Try using collection name instead of ID
        if f['name'] == 'category':
            opts['collectionId'] = 'categories'
            f['options'] = opts
            print(f"Changed category collectionId to 'categories' (name)")

conn.execute("UPDATE _collections SET fields=? WHERE name='transactions'", (json.dumps(fields),))
conn.commit()
print("Updated!")
conn.close()
