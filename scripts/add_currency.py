#!/usr/bin/env python3
"""Add currency and original_amount fields to PocketBase collections."""
import urllib.request, json, sys

PB = "http://localhost:8091"

def api(method, path, data=None, token=None):
    url = f"{PB}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"HTTP {e.code}: {err[:200]}")
        sys.exit(1)

auth = api("POST", "/api/collections/_superusers/auth-with-password",
    {"identity": "welloliver@gmail.com", "password": "53525341"})
token = auth["token"]
print("Auth OK")

def add_field(name, field_def):
    col = api("GET", f"/api/collections/{name}", token=token)
    fields = col.get("fields", [])
    existing = {f["name"] for f in fields}
    if field_def["name"] in existing:
        print(f"  {field_def['name']} already exists, skipping")
        return
    fields.append(field_def)
    col["fields"] = fields
    if "indexes" in col and col["indexes"] == []:
        del col["indexes"]
    result = api("PATCH", f"/api/collections/{name}", col, token=token)
    print(f"  Added {field_def['name']} to {name}" if result.get("id") else f"  ERROR: {result}")

print("Adding fields to transactions...")
add_field("transactions", {
    "name": "currency", "type": "select", "required": True, "system": False,
    "values": ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"],
    "options": {"values": ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"], "max": None, "maxSelect": 1}
})
add_field("transactions", {
    "name": "original_amount", "type": "number", "required": False, "system": False,
    "min": None, "max": None
})

print("Adding currency to recurring_transactions...")
add_field("recurring_transactions", {
    "name": "currency", "type": "select", "required": True, "system": False,
    "values": ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"],
    "options": {"values": ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"], "max": None, "maxSelect": 1}
})

print("ALL DONE")
