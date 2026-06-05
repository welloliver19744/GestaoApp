import sqlite3, json, random, string
from datetime import datetime

def uid():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=15))

def now():
    return datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.000Z')

conn = sqlite3.connect("/tmp/db_fix_trans.db")

# Insert a test transaction directly
tx_id = uid()
conn.execute("""INSERT INTO transactions (id, description, category, store, purchase_date, total_amount, payment_type, installment_count, installment_number, installment_value, due_date, paid, currency, created, updated, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (tx_id, "Test direct insert", "3iy86kf7soyk6qo", "Test Store", "2026-06-05", 99.99, "cash", 1, 1, 99.99, "2026-06-05", False, "BRL", now(), now(), "jnb6pa2dkd8eei6"))

conn.commit()

# Verify
row = conn.execute("SELECT id, description FROM transactions WHERE id=?", (tx_id,)).fetchone()
print(f"Inserted: {row}")
conn.close()
