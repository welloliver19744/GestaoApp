docker cp gestaocasa-pocketbase:/pb_data/data.db /tmp/pb_data.db
python3 -c "
import sqlite3, json
conn = sqlite3.connect('/tmp/pb_data.db')
row = conn.execute(\"SELECT fields FROM _collections WHERE name='cards'\").fetchone()
if row:
    fields = json.loads(row[0])
    for f in fields:
        if f['name'] == 'owner' and f['options'].get('collectionId') == '_pb_users_auth_':
            f['options']['collectionId'] = 'users'
    conn.execute(\"UPDATE _collections SET fields = ? WHERE name = 'cards'\", (json.dumps(fields),))
    conn.commit()
    print('OK')
else:
    print('cards collection not found')
conn.close()
"
docker cp /tmp/pb_data.db gestaocasa-pocketbase:/pb_data/data.db
