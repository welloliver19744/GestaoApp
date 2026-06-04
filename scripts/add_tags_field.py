import sqlite3, json, sys

def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/pb_data.db"
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("PRAGMA table_info('transactions')")
    cols = {row[1] for row in c.fetchall()}

    if "tags" in cols:
        print("Column 'tags' already exists in transactions")
    else:
        c.execute("ALTER TABLE transactions ADD COLUMN tags TEXT DEFAULT '[]'")
        print("Added column: tags")

    tx_row = c.execute("SELECT id, fields FROM _collections WHERE name='transactions'").fetchone()
    if tx_row:
        tx_id, tx_fields_json = tx_row
        tx_fields = json.loads(tx_fields_json)
        tx_field_names = {f["name"] for f in tx_fields}
        if "tags" not in tx_field_names:
            tx_fields.append({
                "name": "tags",
                "type": "json",
                "required": False,
                "options": {}
            })
            c.execute("UPDATE _collections SET fields=? WHERE name='transactions'", (json.dumps(tx_fields),))
            print("Added 'tags' field to transactions collection schema")
        else:
            print("Field 'tags' already exists in schema")

    conn.commit()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    main()
