import sqlite3, json, random, string, uuid
from datetime import datetime

def uid():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=15))

def now():
    return datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.000Z')

conn = sqlite3.connect('/tmp/db_recreate.db')

# Delete old cards collection + table
conn.execute("DELETE FROM _collections WHERE name='cards'")
conn.execute("DROP TABLE IF EXISTS cards")
conn.commit()

# Recreate table
conn.execute("""CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'credit',
    due_day INTEGER NOT NULL DEFAULT 1,
    owner TEXT NOT NULL DEFAULT '',
    created TEXT NOT NULL DEFAULT '',
    updated TEXT NOT NULL DEFAULT ''
)""")

# Recreate collection with NON-relation owner (use text)
cards_fields = [
    {'name': 'name', 'type': 'text', 'required': True, 'options': {}},
    {'name': 'type', 'type': 'text', 'required': False, 'options': {}},
    {'name': 'due_day', 'type': 'number', 'required': False, 'options': {}},
    {'name': 'owner', 'type': 'text', 'required': False, 'options': {}},
]

conn.execute("""INSERT INTO _collections (id, type, name, fields, listRule, viewRule, createRule, updateRule, deleteRule, options, created, updated)
    VALUES (?, 'base', 'cards', ?, '@request.auth.id != ""', '@request.auth.id != ""', '@request.auth.id != ""', '@request.auth.id = owner', '@request.auth.id = owner', '{}', ?, ?)""",
    (uid(), json.dumps(cards_fields), now(), now()))

conn.commit()
conn.close()
print('Cards collection recreated with text owner')
