import sqlite3
conn = sqlite3.connect("/tmp/db_recreate.db")
cols = conn.execute("PRAGMA table_info('_migrations')").fetchall()
print("_migrations columns:")
for c in cols:
    print(f"  {c[1]} ({c[2]})")

rows = conn.execute("SELECT * FROM _migrations").fetchall()
print(f"\nRows: {len(rows)}")
for r in rows[:3]:
    print(r)
conn.close()
