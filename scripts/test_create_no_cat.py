import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Test create with category by omitting the field to see if it's required
tx_data = {
    "description": "Test no category",
    "purchase_date": "2026-06-05",
    "total_amount": 50,
    "payment_type": "cash",
    "installment_count": 1,
    "installment_number": 1,
    "installment_value": 50,
    "due_date": "2026-06-05",
    "currency": "BRL",
}
req2 = urllib.request.Request(f"{base}/collections/transactions/records", data=json.dumps(tx_data).encode(), headers=hdr)
try:
    r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    print("CREATED:", r2.get('id'))
except urllib.error.HTTPError as e:
    err = e.read().decode()[:500]
    print(f"ERROR {e.code}:", err)
