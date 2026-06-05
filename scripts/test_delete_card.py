import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Create via hook
card_data = json.dumps({"name": "Delete Test", "type": "debit", "due_day": 10}).encode()
req2 = urllib.request.Request(f"{base}/cards/create", data=card_data, headers=hdr)
created = json.loads(urllib.request.urlopen(req2, timeout=10).read())
card_id = created["id"]
print(f"Created: {card_id}")

# Delete via hook
delete_data = json.dumps({"id": card_id}).encode()
req3 = urllib.request.Request(f"{base}/cards/delete", data=delete_data, headers=hdr)
try:
    result = json.loads(urllib.request.urlopen(req3, timeout=10).read())
    print(f"Deleted:", json.dumps(result))
except urllib.error.HTTPError as e:
    print(f"DELETE ERROR {e.code}:", e.read().decode()[:500])
