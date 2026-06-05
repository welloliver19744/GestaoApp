import sqlite3, json, sys
from datetime import datetime

def uid():
    import random, string
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=15))

def now():
    return datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.000Z')

def main():
    db = sys.argv[1] if len(sys.argv) > 1 else '/tmp/pb_data.db'
    conn = sqlite3.connect(db)
    c = conn.cursor()

    # --- transactions: add payment_method and card_id ---
    cols = {r[1] for r in c.execute("PRAGMA table_info('transactions')").fetchall()}
    if 'payment_method' not in cols:
        c.execute("ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'cash'")
        print('Added: transactions.payment_method')
    if 'card_id' not in cols:
        c.execute("ALTER TABLE transactions ADD COLUMN card_id TEXT DEFAULT ''")
        print('Added: transactions.card_id')

    # Update _collections schema for transactions
    row = c.execute("SELECT id, fields FROM _collections WHERE name='transactions'").fetchone()
    if row:
        cid, fields_json = row
        fields = json.loads(fields_json)
        names = {f['name'] for f in fields}
        changed = False
        if 'payment_method' not in names:
            fields.append({'name': 'payment_method', 'type': 'text', 'required': False, 'options': {}})
            changed = True
        if 'card_id' not in names:
            fields.append({'name': 'card_id', 'type': 'text', 'required': False, 'options': {}})
            changed = True
        if changed:
            c.execute("UPDATE _collections SET fields=? WHERE name='transactions'", (json.dumps(fields),))
            print('Updated: _collections schema for transactions')

    # --- stores collection ---
    tables = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    if 'stores' not in tables:
        c.execute("""CREATE TABLE stores (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT '',
            owner TEXT NOT NULL DEFAULT '',
            created TEXT NOT NULL DEFAULT '',
            updated TEXT NOT NULL DEFAULT ''
        )""")
        print('Created table: stores')

    if not c.execute("SELECT id FROM _collections WHERE name='stores'").fetchone():
        stores_fields = [
            {'name': 'name', 'type': 'text', 'required': True, 'options': {}},
            {'name': 'owner', 'type': 'relation', 'required': False, 'options': {'collectionId': '_pb_users_auth_', 'maxSelect': 1}},
        ]
        c.execute("INSERT INTO _collections (id, type, name, fields, listRule, viewRule, createRule, updateRule, deleteRule, options, created, updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", (
            uid(), 'base', 'stores', json.dumps(stores_fields),
            '@request.auth.id != ""', '@request.auth.id != ""',
            '@request.auth.id != ""', '@request.auth.id = owner',
            '@request.auth.id = owner',
            '{}', now(), now()
        ))
        print('Created collection: stores')

    # --- cards collection ---
    if 'cards' not in tables:
        c.execute("""CREATE TABLE cards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT '',
            type TEXT NOT NULL DEFAULT 'credit',
            due_day INTEGER NOT NULL DEFAULT 1,
            owner TEXT NOT NULL DEFAULT '',
            created TEXT NOT NULL DEFAULT '',
            updated TEXT NOT NULL DEFAULT ''
        )""")
        print('Created table: cards')

    if not c.execute("SELECT id FROM _collections WHERE name='cards'").fetchone():
        cards_fields = [
            {'name': 'name', 'type': 'text', 'required': True, 'options': {}},
            {'name': 'type', 'type': 'text', 'required': False, 'options': {}},
            {'name': 'due_day', 'type': 'number', 'required': False, 'options': {}},
            {'name': 'owner', 'type': 'relation', 'required': False, 'options': {'collectionId': '_pb_users_auth_', 'maxSelect': 1}},
        ]
        c.execute("INSERT INTO _collections (id, type, name, fields, listRule, viewRule, createRule, updateRule, deleteRule, options, created, updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", (
            uid(), 'base', 'cards', json.dumps(cards_fields),
            '@request.auth.id != ""', '@request.auth.id != ""',
            '@request.auth.id != ""', '@request.auth.id = owner',
            '@request.auth.id = owner',
            '{}', now(), now()
        ))
        print('Created collection: cards')

    conn.commit()
    conn.close()
    print('Done.')

if __name__ == '__main__':
    main()
