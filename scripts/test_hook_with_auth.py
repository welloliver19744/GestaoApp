import urllib.request, json

base = "http://localhost:8091/api"

# Auth
auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
try:
    resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
    token = resp["token"]
    uid = resp["record"]["id"]
    print(f"AUTH OK, user={uid}")

    # Test hook
    hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    card_data = json.dumps({"name": "Test Via Hook", "type": "credit", "due_day": 15}).encode()
    req2 = urllib.request.Request(f"{base}/cards/create", data=card_data, headers=hdr)
    r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    print("HOOK RESULT:", json.dumps(r2, indent=2)[:300])
except urllib.error.HTTPError as e:
    print(f"ERROR {e.code}:", e.read().decode()[:500])
