import sqlite3, json

conn = sqlite3.connect('/tmp/db_fix.db')
row = conn.execute("SELECT fields FROM _collections WHERE name='cards'").fetchone()
if row:
    fields = json.loads(row[0])
    print('Before:', json.dumps(fields, indent=2))
    for f in fields:
        if f['name'] == 'owner':
            f['type'] = 'text'
            f['options'] = {}
    print('After:', json.dumps(fields, indent=2))
    conn.execute("UPDATE _collections SET fields = ? WHERE name='cards'", (json.dumps(fields),))
    conn.commit()
else:
    print('cards collection not found')
conn.close()
