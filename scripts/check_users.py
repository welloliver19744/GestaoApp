import sqlite3
conn = sqlite3.connect("/tmp/db_recreate.db")
cols = conn.execute("PRAGMA table_info('users')").fetchall()
print("users columns:", [(c[1], c[2]) for c in cols])
rows = conn.execute("SELECT id, email FROM users LIMIT 10").fetchall()
for r in rows:
    print("  ", r)
conn.close()
