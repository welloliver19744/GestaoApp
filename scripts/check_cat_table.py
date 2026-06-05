import sqlite3
conn = sqlite3.connect("/tmp/db_verify_fix.db")
cols = conn.execute("PRAGMA table_info('categories')").fetchall()
print("categories columns:")
for c in cols:
    print(f"  {c[1]} ({c[2]})")
conn.close()
