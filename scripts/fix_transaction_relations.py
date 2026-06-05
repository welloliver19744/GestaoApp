import sqlite3, json

db_path = '/tmp/db_check2.db'
conn = sqlite3.connect(db_path)

row = conn.execute("SELECT id, fields FROM _collections WHERE name='transactions'").fetchone()
if not row:
    print("transactions not found")
    exit()

cid, fields_json = row
fields = json.loads(fields_json)

# Find categories collection ID
cat_row = conn.execute("SELECT id FROM _collections WHERE name='categories'").fetchone()
if not cat_row:
    print("categories collection not found in _collections!")
    exit()
cat_collection_id = cat_row[0]
print(f"Categories collection ID: {cat_collection_id}")

# Get users collection ID
users_row = conn.execute("SELECT id FROM _collections WHERE name='users'").fetchone()
if not users_row:
    print("users collection not found, checking _pb_users_auth_...")
    users_id = '_pb_users_auth_'
else:
    users_id = users_row[0]
print(f"Users collection ID: {users_id}")

# Fix relation fields
changed = False
for f in fields:
    if f['type'] == 'relation':
        opts = f.get('options', {})
        if not opts.get('collectionId'):
            if f['name'] in ['created_by', 'paid_by']:
                opts['collectionId'] = users_id
                f['options'] = opts
                changed = True
                print(f"Fixed {f['name']} -> collectionId={users_id}")
            elif f['name'] == 'shared_with':
                opts['collectionId'] = users_id
                opts['maxSelect'] = None
                f['options'] = opts
                changed = True
                print(f"Fixed {f['name']} -> collectionId={users_id}")
            elif f['name'] == 'category':
                opts['collectionId'] = cat_collection_id
                opts['maxSelect'] = 1
                f['options'] = opts
                changed = True
                print(f"Fixed {f['name']} -> collectionId={cat_collection_id}")

if changed:
    conn.execute("UPDATE _collections SET fields=? WHERE name='transactions'", (json.dumps(fields),))
    conn.commit()
    print("Updated!")
else:
    print("No changes needed")

conn.close()
