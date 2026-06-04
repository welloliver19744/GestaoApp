import requests, json, sys

BASE = 'http://localhost:8091'

# Login
r = requests.post(f'{BASE}/api/collections/_superusers/auth-with-password',
    json={'identity': 'welloliver@gmail.com', 'password': '53525341'})
if r.status_code != 200:
    print('Login failed:', r.status_code, r.text)
    sys.exit(1)
data = r.json()
token = data['token']
headers = {'Authorization': f'Bearer {token}'}

# Get transactions collection
r2 = requests.get(f'{BASE}/api/collections/transactions', headers=headers)
if r2.status_code != 200:
    print('Failed to get collection:', r2.status_code, r2.text)
    sys.exit(1)
col = r2.json()
fields = {f['name']: f['type'] for f in col.get('fields', [])}
print('Fields:', json.dumps(fields, indent=2))
print('List rule:', col.get('listRule'))
print('View rule:', col.get('viewRule'))
