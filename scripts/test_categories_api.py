import urllib.request, json

base = "http://localhost:8091/api"

auth_data = json.dumps({"identity": "welloliver@gmail.com", "password": "53525341"}).encode()
req = urllib.request.Request(f"{base}/collections/users/auth-with-password", data=auth_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
token = resp["token"]
hdr = {"Authorization": f"Bearer {token}"}

# Check categories list
req2 = urllib.request.Request(f"{base}/collections/categories/records?perPage=50", headers=hdr)
r2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
print(f"Categories: {r2['totalItems']}")
for item in r2['items']:
    print(f"  id={item.get('id','?')} name={item.get('name','?')}")

# Check if categories returns id field
if r2['items']:
    print(f"Category keys: {list(r2['items'][0].keys())}")
