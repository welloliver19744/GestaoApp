import sqlite3, json
c = sqlite3.connect('/home/ubuntu/gestaocasa/pocketbase/pb_data/data.db')
c.row_factory = sqlite3.Row
coll_id, fields_json = c.execute("SELECT id, fields FROM _collections WHERE name='transactions'").fetchone()
fields = json.loads(fields_json)
for f in fields:
    if f.get('name') == 'paid_by' and f.get('type') == 'relation':
        f['type'] = 'text'
        f.pop('options', None)
        f['maxSelect'] = None
        f['minSelect'] = None
        print('FIXED: paid_by type relation -> text')
c.execute("UPDATE _collections SET fields=? WHERE id=?", (json.dumps(fields), coll_id))
c.commit()
c.close()
print('done')
