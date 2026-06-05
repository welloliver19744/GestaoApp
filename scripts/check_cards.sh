docker exec gestaocasa-pocketbase cat /pb_data/data.db > /tmp/db_check2.db
python3 -c "
import sqlite3, json
conn = sqlite3.connect('/tmp/db_check2.db')
row = conn.execute(\"SELECT fields FROM _collections WHERE name='cards'\").fetchone()
if row:
    print('fields:', row[0])
else:
    print('cards not found')
conn.close()
"
