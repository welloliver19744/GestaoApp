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
print(f"Before: {len(r2['items'])} cards")
cards = r2['items']
for c in cards:
    print(f"  {c['id']}: {c['name']}")

# Delete each
for c in cards:
    delete_data = json.dumps({"id": c['id']}).encode()
    req3 = urllib.request.Request(f"{base}/cards/delete", data=delete_data, headers=hdr)
    r3 = json.loads(urllib.request.urlopen(req3, timeout=10).read())
    print(f"Deleted {c['name']}: {r3}")

# List again
req4 = urllib.request.Request(f"{base}/cards/list", headers=hdr)
r4 = json.loads(urllib.request.urlopen(req4, timeout=10).read())
print(f"After: {len(r4['items'])} cards")
