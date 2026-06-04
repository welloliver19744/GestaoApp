import requests

PB = "http://localhost:8091"

# Auth as superuser
r = requests.post(f"{PB}/api/collections/_superusers/auth-with-password",
    json={"identity": "welloliver@gmail.com", "password": "53525341"})
if r.status_code != 200:
    print(f"Auth failed: {r.status_code} {r.text[:200]}")
    exit(1)

token = r.json()["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get transactions collection
r = requests.get(f"{PB}/api/collections/transactions", headers=headers)
col = r.json()
existing = {f["name"] for f in col.get("fields", [])}

# Add currency field if missing
if "currency" not in existing:
    r = requests.post(f"{PB}/api/collections/{col['id']}/fields", headers=headers, json={
        "name": "currency",
        "type": "select",
        "required": True,
        "options": {"values": ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"]},
    })
    print(f"currency field: {r.status_code}")

# Add original_amount field
if "original_amount" not in existing:
    r = requests.post(f"{PB}/api/collections/{col['id']}/fields", headers=headers, json={
        "name": "original_amount",
        "type": "number",
        "required": False,
        "options": {"min": 0},
    })
    print(f"original_amount field: {r.status_code}")

# Also add to recurring_transactions
r = requests.get(f"{PB}/api/collections/recurring_transactions", headers=headers)
col = r.json()
existing = {f["name"] for f in col.get("fields", [])}
if "currency" not in existing:
    r = requests.post(f"{PB}/api/collections/{col['id']}/fields", headers=headers, json={
        "name": "currency",
        "type": "select",
        "required": True,
        "options": {"values": ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"]},
    })
    print(f"recurring currency field: {r.status_code}")

print("Done!")
