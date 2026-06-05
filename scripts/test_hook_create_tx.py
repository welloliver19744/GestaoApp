import urllib.request, json

base = "http://localhost:8091/api"
auth = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

tx_data = {
    "description": "Hook created tx",
    "category": "3iy86kf7soyk6qo",
    "store": "Test Store",
    "purchase_date": "2026-06-05",
    "total_amount": 99.99,
    "payment_type": "cash",
    "installment_count": 1,
    "installment_number": 1,
    "installment_value": 99.99,
    "due_date": "2026-06-05",
    "currency": "BRL",
}
req2 = urllib.request.Request(f"{base}/debug/create_tx", data=json.dumps(tx_data).encode(), headers=hdr)
try:
    r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    print("HOOK CREATED:", json.dumps(r2, indent=2))
except urllib.error.HTTPError as e:
    print(f"HOOK ERROR {e.code}:", e.read().decode()[:500])
