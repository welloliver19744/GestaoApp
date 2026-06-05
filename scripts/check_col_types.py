import sqlite3
conn = sqlite3.connect("/tmp/db_verify_fix.db")
for name in ['categories', 'cards', 'transactions']:
    row = conn.execute("SELECT name, type, system FROM _collections WHERE name=?", (name,)).fetchone()
    if row:
        print(f"{row[0]}: type={row[1]}, system={row[2]}")
conn.close()
