import sqlite3, json
c = sqlite3.connect("/tmp/pb_data.db").cursor()
r = c.execute("SELECT fields FROM _collections WHERE name='transactions'").fetchone()[0]
fs = json.loads(r)
print([f['name'] for f in fs])
print('Total:', len(fs))
print('listRule:', c.execute("SELECT listRule FROM _collections WHERE name='transactions'").fetchone()[0])

# Check groups
r2 = c.execute("SELECT id, fields FROM _collections WHERE name='groups'").fetchone()
if r2:
    print('Groups collection:', r2[0])
    fs2 = json.loads(r2[1])
    print([f['name'] for f in fs2])
else:
    print('No groups collection')
