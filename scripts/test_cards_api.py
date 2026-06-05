import urllib.request, json

url = "http://localhost:8091/api/collections/users/auth-with-password"
data = json.dumps({"identity": "welloliver19744@gmail.com", "password": "270792@Wm"}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
    print("Auth:", json.dumps(resp, indent=2)[:200])
    if "token" in resp:
        token = resp["token"]
        create_url = "http://localhost:8091/api/collections/cards/records"
        card_data = json.dumps({"name": "Test Card API", "type": "credit", "due_day": 15}).encode()
        req2 = urllib.request.Request(create_url, data=card_data, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        try:
            resp2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
            print("CREATE OK:", json.dumps(resp2, indent=2)[:200])
        except urllib.error.HTTPError as e:
            print("CREATE ERROR:", e.code, e.read().decode()[:300])
except urllib.error.HTTPError as e:
    print("AUTH ERROR:", e.code, e.read().decode()[:300])
