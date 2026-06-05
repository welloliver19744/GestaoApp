import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get a valid category ID
req2 = urllib.request.Request(f"{base}/collections/categories/records?perPage=1", headers=hdr)
r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
if r2['totalItems'] == 0:
    print("No categories found!")
    exit()
cat_id = r2['items'][0]['id']
print(f"Using category: {cat_id}")

# Create a simple transaction
tx_data = {
    "description": "Test transaction",
    "category": cat_id,
    "store": "Test Store",
    "purchase_date": "2026-06-05",
    "total_amount": 100.00,
    "payment_type": "cash",
    "installment_count": 1,
    "installment_number": 1,
    "installment_value": 100.00,
    "due_date": "2026-06-05",
    "currency": "BRL",
    "paid": False,
}
req3 = urllib.request.Request(f"{base}/collections/transactions/records", data=json.dumps(tx_data).encode(), headers=hdr)
try:
    r3 = json.loads(urllib.request.urlopen(req3, timeout=10).read())
    print("CREATED:", r3.get('id'))
except urllib.error.HTTPError as e:
    print(f"ERROR {e.code}:", e.read().decode()[:500])
