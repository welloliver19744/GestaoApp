import sqlite3, json
conn = sqlite3.connect("/tmp/db_recreate.db")
for name in ['transactions', 'categories', 'stores', 'cards']:
    row = conn.execute("SELECT name, createRule, updateRule, listRule FROM _collections WHERE name=?", (name,)).fetchone()
    if row:
        print(f"{row[0]}: createRule={row[1]}, updateRule={row[2]}, listRule={row[3]}")
conn.close()
