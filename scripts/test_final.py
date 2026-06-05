import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# List cards
req2 = urllib.request.Request(f"{base}/cards/list", headers=hdr)
r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
cards = r2['items']
if not cards:
    print("No cards to delete, creating one first...")
    card_data = json.dumps({"name": "Final Test Card", "type": "credit", "due_day": 15}).encode()
    req3 = urllib.request.Request(f"{base}/cards/create", data=card_data, headers=hdr)
    created = json.loads(urllib.request.urlopen(req3, timeout=10).read())
    card_id = created['id']
    print(f"Created: {card_id}")
else:
    card_id = cards[0]['id']
    print(f"Using existing card: {card_id} - {cards[0]['name']}")

# Delete
delete_data = json.dumps({"id": card_id}).encode()
req4 = urllib.request.Request(f"{base}/cards/delete", data=delete_data, headers=hdr)
r4 = json.loads(urllib.request.urlopen(req4, timeout=10).read())
print(f"Delete result: {r4}")

# Verify list
req5 = urllib.request.Request(f"{base}/cards/list", headers=hdr)
r5 = json.loads(urllib.request.urlopen(req5, timeout=10).read())
print(f"Remaining: {len(r5['items'])} cards")
for c in r5['items']:
    print(f"  {c['id']}: {c['name']}")
