import sqlite3, json
conn = sqlite3.connect('/tmp/db_recreate.db')

# Check _collections table schema
cols = conn.execute("PRAGMA table_info('_collections')").fetchall()
print("_collections columns:", [(c[1], c[2]) for c in cols])

# Compare stores vs cards entries
for name in ['stores', 'cards']:
    row = conn.execute("SELECT * FROM _collections WHERE name=?", (name,)).fetchone()
    if row:
        print(f"\n--- {name} ---")
        col_names = [c[1] for c in cols]
        for i, val in enumerate(row):
            if col_names[i] in ['fields', 'options', 'listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule']:
                print(f"  {col_names[i]}: {val}")
            else:
                print(f"  {col_names[i]}: {val}")

conn.close()
