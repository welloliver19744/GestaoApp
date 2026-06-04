#!/usr/bin/env python3
"""Fix PocketBase collection schemas by adding missing fields via REST API."""
import requests, json, sys

PB_URL = "http://localhost:8091"

# 1. Auth as superuser
r = requests.post(f"{PB_URL}/api/admins/auth-with-password", json={
    "identity": "welloliver@gmail.com",
    "password": "53525341"
}, headers={"Content-Type": "application/json"})
print(f"Auth status: {r.status_code}")
if r.status_code != 200:
    print(f"Auth error: {r.text}")
    sys.exit(1)

token = r.json()["token"]
print(f"Token: {token[:30]}...")

headers = {"Authorization": token, "Content-Type": "application/json"}

# 2. Define all collections with their correct fields
collections = {
    "categories": {
        "fields": [
            {"system": False, "name": "name", "type": "text", "required": True, "options": {"min": 1, "max": 50}},
            {"system": False, "name": "icon", "type": "text", "required": False, "options": {"max": 50}},
            {"system": False, "name": "color", "type": "text", "required": False, "options": {"max": 7}},
            {"system": False, "name": "budget_monthly", "type": "number", "required": False, "options": {"min": 0}},
        ]
    },
    "transactions": {
        "fields": [
            {"system": False, "name": "description", "type": "text", "required": True, "options": {"min": 3, "max": 200}},
            {"system": False, "name": "category", "type": "relation", "required": True, "options": {"maxSelect": 1}},
            {"system": False, "name": "store", "type": "text", "required": False, "options": {"max": 100}},
            {"system": False, "name": "purchase_date", "type": "date", "required": True},
            {"system": False, "name": "total_amount", "type": "number", "required": True, "options": {"min": 0.01}},
            {"system": False, "name": "payment_type", "type": "select", "required": True, "options": {"values": ["cash", "installment"]}},
            {"system": False, "name": "installment_count", "type": "number", "required": True, "options": {"min": 1, "max": 120}},
            {"system": False, "name": "installment_number", "type": "number", "required": True, "options": {"min": 1, "max": 120}},
            {"system": False, "name": "installment_value", "type": "number", "required": True, "options": {"min": 0.01}},
            {"system": False, "name": "due_date", "type": "date", "required": True},
            {"system": False, "name": "paid", "type": "bool", "required": False},
            {"system": False, "name": "paid_at", "type": "date", "required": False},
            {"system": False, "name": "paid_by", "type": "relation", "required": False, "options": {"maxSelect": 1}},
            {"system": False, "name": "group_id", "type": "text", "required": False, "options": {"max": 36}},
            {"system": False, "name": "notes", "type": "text", "required": False, "options": {"max": 500}},
            {"system": False, "name": "receipt", "type": "file", "required": False, "options": {"maxSelect": 1, "maxSize": 5242880, "mimeTypes": ["image/jpeg", "image/png", "image/webp"], "thumbs": ["320x240", "640x480"]}},
        ]
    },
    "recurring_transactions": {
        "fields": [
            {"system": False, "name": "description", "type": "text", "required": True, "options": {"min": 3, "max": 200}},
            {"system": False, "name": "category", "type": "relation", "required": True, "options": {"maxSelect": 1}},
            {"system": False, "name": "store", "type": "text", "required": False, "options": {"max": 100}},
            {"system": False, "name": "total_amount", "type": "number", "required": True, "options": {"min": 0.01}},
            {"system": False, "name": "payment_type", "type": "select", "required": True, "options": {"values": ["cash", "installment"]}},
            {"system": False, "name": "installment_count", "type": "number", "required": True, "options": {"min": 1, "max": 120}},
            {"system": False, "name": "installment_value", "type": "number", "required": True, "options": {"min": 0.01}},
            {"system": False, "name": "frequency", "type": "select", "required": True, "options": {"values": ["monthly", "yearly"]}},
            {"system": False, "name": "day_of_month", "type": "number", "required": True, "options": {"min": 1, "max": 31}},
            {"system": False, "name": "month", "type": "number", "required": False, "options": {"min": 1, "max": 12}},
            {"system": False, "name": "active", "type": "bool", "required": False},
            {"system": False, "name": "next_due", "type": "date", "required": True},
            {"system": False, "name": "notes", "type": "text", "required": False, "options": {"max": 500}},
            {"system": False, "name": "owner", "type": "relation", "required": True, "options": {"maxSelect": 1}},
        ]
    },
    "push_subscriptions": {
        "fields": [
            {"system": False, "name": "user", "type": "text", "required": True, "options": {"max": 255}},
            {"system": False, "name": "subscription", "type": "json", "required": True},
            {"system": False, "name": "enabled", "type": "bool", "required": False},
        ]
    }
}

# 3. For each collection, get current fields and add missing ones
for name, col_def in collections.items():
    print(f"\n=== Processing {name} ===")
    
    # Get current collection
    r = requests.get(f"{PB_URL}/api/collections/{name}", headers=headers)
    if r.status_code != 200:
        print(f"  Get collection error: {r.status_code} {r.text}")
        continue
    
    col = r.json()
    existing_fields = {f["name"] for f in col.get("fields", []) if f.get("name") != "id"}
    print(f"  Existing fields: {existing_fields}")
    
    new_fields = [f for f in col_def["fields"] if f["name"] not in existing_fields]
    if not new_fields:
        print(f"  All fields already exist, skipping")
        continue
    
    print(f"  Adding {len(new_fields)} fields: {[f['name'] for f in new_fields]}")
    
    # Add fields one by one
    for field in new_fields:
        r = requests.post(f"{PB_URL}/api/collections/{name}/fields", 
                         headers=headers, json=field)
        if r.status_code == 200:
            print(f"    Added field: {field['name']}")
        else:
            print(f"    Error adding {field['name']}: {r.status_code} {r.text[:200]}")

print("\nDone! Collections should now have proper fields.")
