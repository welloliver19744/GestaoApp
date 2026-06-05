import urllib.request, json

base = "http://localhost:8091/api"
auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Test list hook if it exists
try:
    req2 = urllib.request.Request(f"{base}/cards/list", headers=hdr)
    r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    print("LIST RESULT:", json.dumps(r2, indent=2)[:1000])
except urllib.error.HTTPError as e:
    print(f"LIST ERROR {e.code}:", e.read().decode()[:500])
