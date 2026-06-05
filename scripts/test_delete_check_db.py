import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Create card
card_data = json.dumps({"name": "Delete Test DB", "type": "debit", "due_day": 10}).encode()
req2 = urllib.request.Request(f"{base}/cards/create", data=card_data, headers=hdr)
created = json.loads(urllib.request.urlopen(req2, timeout=10).read())
card_id = created["id"]
print(f"Created: {card_id}")

# Check it exists
req3 = urllib.request.Request(f"{base}/collections/cards/records?filter=id='{card_id}'", headers=hdr)
r3 = json.loads(urllib.request.urlopen(req3, timeout=10).read())
print(f"Before delete: {r3['totalItems']} items")

# Delete via hook
delete_data = json.dumps({"id": card_id}).encode()
req4 = urllib.request.Request(f"{base}/cards/delete", data=delete_data, headers=hdr)
r4 = json.loads(urllib.request.urlopen(req4, timeout=10).read())
print(f"Delete result: {r4}")

# Check if it still exists
req5 = urllib.request.Request(f"{base}/collections/cards/records?filter=id='{card_id}'", headers=hdr)
r5 = json.loads(urllib.request.urlopen(req5, timeout=10).read())
print(f"After delete: {r5['totalItems']} items")
if r5['totalItems'] > 0:
    print(f"Card still exists! id={card_id}")
else:
    print("Card successfully deleted")
