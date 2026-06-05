import urllib.request, json

base = "http://localhost:8091/api"

# Test hook with form data (url-encoded)
data = "name=TestCardFromHook&type=credit&due_day=15".encode()
req = urllib.request.Request(f"{base}/cards/create", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
try:
    resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
    print("HOOK (form):", json.dumps(resp, indent=2)[:200])
except urllib.error.HTTPError as e:
    print(f"HOOK (form) ERROR {e.code}:", e.read().decode()[:300])

# Test hook with JSON (no auth)
req2 = urllib.request.Request(f"{base}/cards/create", data=json.dumps({"name": "TestCardJSON", "type": "credit", "due_day": 15}).encode(), headers={"Content-Type": "application/json"})
try:
    resp2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
    print("HOOK (json):", json.dumps(resp2, indent=2)[:200])
except urllib.error.HTTPError as e:
    print(f"HOOK (json) ERROR {e.code}:", e.read().decode()[:300])
