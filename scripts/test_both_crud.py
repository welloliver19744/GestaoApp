import urllib.request, json

base = "http://localhost:8091/api"

# Auth as regular user
data = json.dumps({"identity": "welloliver@gmail.com", "password": "270792@Wm"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=data, headers={"Content-Type": "application/json"})
try:
    resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
    print("AUTH OK")
    token = resp["token"]
    uid = resp["record"]["id"]
    print(f"User ID: {uid}")

    hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Test CREATE store
    r = urllib.request.Request(f"{base}/collections/stores/records", data=json.dumps({"name": "TestStoreViaAPI", "owner": uid}).encode(), headers=hdr)
    try:
        r2 = json.loads(urllib.request.urlopen(r, timeout=10).read())
        print("STORE CREATE OK:", r2.get("id"))
    except urllib.error.HTTPError as e:
        print(f"STORE CREATE ERROR {e.code}:", e.read().decode()[:300])

    # Test CREATE card
    r = urllib.request.Request(f"{base}/collections/cards/records", data=json.dumps({"name": "TestCardViaAPI", "type": "credit", "due_day": 15, "owner": uid}).encode(), headers=hdr)
    try:
        r2 = json.loads(urllib.request.urlopen(r, timeout=10).read())
        print("CARD CREATE OK:", r2.get("id"))
    except urllib.error.HTTPError as e:
        print(f"CARD CREATE ERROR {e.code}:", e.read().decode()[:500])

except urllib.error.HTTPError as e:
    print(f"AUTH ERROR {e.code}:", e.read().decode()[:500])
