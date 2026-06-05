import sqlite3, json
conn = sqlite3.connect("/tmp/db_recreate.db")

# Get actual table columns
table_cols = {r[1] for r in conn.execute("PRAGMA table_info('cards')").fetchall()}
print("Table columns:", table_cols)

# Get fields from _collections
row = conn.execute("SELECT fields FROM _collections WHERE name='cards'").fetchone()
if row:
    fields = json.loads(row[0])
    field_names = {f['name'] for f in fields}
    print("_collections fields:", field_names)

    # Check for missing/extra
    print("In table but not in fields:", table_cols - field_names)
    print("In fields but not in table:", field_names - table_cols)

# Also check stores for comparison
table_cols_s = {r[1] for r in conn.execute("PRAGMA table_info('stores')").fetchall()}
row_s = conn.execute("SELECT fields FROM _collections WHERE name='stores'").fetchone()
if row_s:
    fields_s = json.loads(row_s[0])
    field_names_s = {f['name'] for f in fields_s}
    print("\nStores table columns:", table_cols_s)
    print("Stores fields:", field_names_s)
    print("Stores extra table:", table_cols_s - field_names_s)
    print("Stores extra fields:", field_names_s - table_cols_s)

conn.close()
