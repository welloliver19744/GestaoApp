import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# First check if categories fetch works with a single record lookup
cat_id = "3iy86kf7soyk6qo"
req2 = urllib.request.Request(f"{base}/collections/categories/records/{cat_id}", headers=hdr)
try:
    r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    print(f"Category by ID OK: {r2.get('name')}")
except urllib.error.HTTPError as e:
    print(f"Category by ID ERROR {e.code}:", e.read().decode()[:300])

# Now try creating with category
tx_data = {
    "description": "Test with category fix",
    "category": cat_id,
    "store": "Test Store",
    "purchase_date": "2026-06-05",
    "total_amount": 75.50,
    "payment_type": "cash",
    "installment_count": 1,
    "installment_number": 1,
    "installment_value": 75.50,
    "due_date": "2026-06-05",
    "currency": "BRL",
}
req3 = urllib.request.Request(f"{base}/collections/transactions/records", data=json.dumps(tx_data).encode(), headers=hdr)
try:
    r3 = json.loads(urllib.request.urlopen(req3, timeout=10).read())
    print("TRANSACTION CREATED:", r3.get('id'))
except urllib.error.HTTPError as e:
    print(f"CREATE ERROR {e.code}:", e.read().decode()[:500])
