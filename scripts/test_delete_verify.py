import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
uid = resp["record"]["id"]
hdr = {"Authorization": f"Bearer {token}"}

# Test GET without filter
req2 = urllib.request.Request(f"{base}/collections/cards/records?perPage=10", headers=hdr)
try:
    r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    print(f"GET cards: {r2.get('totalItems')} items")
    items = r2.get('items', [])
    for item in items:
        print(f"  {item['id']}: {item['name']} (owner={item.get('owner','?')})")
except urllib.error.HTTPError as e:
    print(f"GET ERROR {e.code}:", e.read().decode()[:300])

# Now delete the one we created
print(f"\nDeleting first card...")
items = list(items)
if items:
    card_id = items[0]['id']
    delete_data = json.dumps({"id": card_id}).encode()
    req3 = urllib.request.Request(f"{base}/cards/delete", data=delete_data, headers={**hdr, "Content-Type": "application/json"})
    try:
        r3 = json.loads(urllib.request.urlopen(req3, timeout=10).read())
        print(f"Delete result: {r3}")
    except urllib.error.HTTPError as e:
        print(f"DELETE ERROR {e.code}:", e.read().decode()[:300])

    # Check again
    req4 = urllib.request.Request(f"{base}/collections/cards/records?perPage=10", headers=hdr)
    r4 = json.loads(urllib.request.urlopen(req4, timeout=10).read())
    print(f"After delete: {r4.get('totalItems')} items")
