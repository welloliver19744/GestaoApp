import sqlite3, json, uuid, datetime, sys

def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/pb_data.db"
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    now = datetime.datetime.now().isoformat()

    # ---- Groups collection ----
    exists = c.execute("SELECT COUNT(*) FROM _collections WHERE name='groups'").fetchone()[0]
    if not exists:
        gid = str(uuid.uuid4())
        list_rule = "@request.auth.id != '' && (created_by = @request.auth.id || members ?= @request.auth.id)"
        uid = c.execute("SELECT id FROM _collections WHERE name='users'").fetchone()[0]

        fields = [
            {"name": "name", "type": "text", "required": True, "options": {"min": 1, "max": 100}},
            {"name": "description", "type": "text", "required": False, "options": {"max": 500}},
            {"name": "members", "type": "relation", "required": False, "options": {"collectionId": uid, "maxSelect": 999}},
            {"name": "created_by", "type": "relation", "required": False, "options": {"collectionId": uid, "maxSelect": 1}},
        ]
        fields_json = json.dumps(fields)

        c.execute("INSERT INTO _collections (id, name, type, system, fields, listRule, options, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (gid, "groups", "base", False, fields_json, list_rule, "{}", now, now))

        c.execute("""CREATE TABLE groups (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL DEFAULT '',
            description TEXT DEFAULT '',
            members TEXT DEFAULT '[]',
            created_by VARCHAR(255) DEFAULT '',
            created TEXT NOT NULL,
            updated TEXT NOT NULL
        )""")
        print("Created groups collection: " + gid)
    else:
        gid = c.execute("SELECT id FROM _collections WHERE name='groups'").fetchone()[0]
        print("Groups collection already exists: " + gid)

    # ---- Add missing fields to transactions ----
    tx_row = c.execute("SELECT id, fields FROM _collections WHERE name='transactions'").fetchone()
    tx_id, tx_fields_json = tx_row
    tx_fields = json.loads(tx_fields_json)
    tx_field_names = {f["name"] for f in tx_fields}
    uid = c.execute("SELECT id FROM _collections WHERE name='users'").fetchone()[0]

    desired = [
        {"name": "created_by", "type": "relation", "required": False, "options": {"collectionId": uid, "maxSelect": 1}},
        {"name": "shared_with", "type": "relation", "required": False, "options": {"collectionId": uid, "maxSelect": 999}},
        {"name": "currency", "type": "text", "required": False, "options": {"max": 3}},
        {"name": "original_amount", "type": "number", "required": False, "options": {}},
        {"name": "group", "type": "relation", "required": False, "options": {"collectionId": gid, "maxSelect": 1}},
    ]

    added = []
    for f in desired:
        if f["name"] not in tx_field_names:
            tx_fields.append(f)
            added.append(f["name"])

    if added:
        c.execute("UPDATE _collections SET fields=? WHERE name='transactions'", (json.dumps(tx_fields),))
        print("Added fields: " + ", ".join(added))
    else:
        print("All transaction fields already exist")

    # Add SQL columns
    c.execute("PRAGMA table_info('transactions')")
    tx_cols = {row[1] for row in c.fetchall()}

    col_defs = [
        ("created_by", "VARCHAR(255) DEFAULT ''"),
        ("shared_with", "TEXT DEFAULT '[]'"),
        ("currency", "VARCHAR(3) DEFAULT 'BRL'"),
        ("original_amount", "REAL DEFAULT NULL"),
        ('"group"', "VARCHAR(255) DEFAULT ''"),
    ]
    for name, col_type in col_defs:
        clean = name.replace('"', '')
        if clean not in tx_cols:
            c.execute(f"ALTER TABLE transactions ADD COLUMN {name} {col_type}")
            print(f"Added column: {clean}")

    # Update list rule
    new_rule = "@request.auth.id != '' && (created_by = @request.auth.id || shared_with ?= @request.auth.id || (group != '' && group.members ?= @request.auth.id))"
    current_rule = c.execute("SELECT listRule FROM _collections WHERE name='transactions'").fetchone()[0]
    if current_rule != new_rule:
        c.execute("UPDATE _collections SET listRule=? WHERE name='transactions'", (new_rule,))
        print("Updated listRule")
    else:
        print("ListRule already correct")

    conn.commit()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    main()
