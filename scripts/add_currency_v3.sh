#!/bin/bash
echo "=== Getting auth ==="
AUTH=$(curl -sf http://localhost:8091/api/collections/_superusers/auth-with-password -H "Content-Type: application/json" -d '{"identity":"welloliver@gmail.com","password":"53525341"}')
TOKEN=$(echo "$AUTH" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
echo "Token OK"

echo "=== Try POST with collection NAME ==="
curl -vs -X POST "http://localhost:8091/api/collections/transactions/fields" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"currency_test","type":"text","required":false}' 2>&1 | head -20

echo "=== Try PATCH with fields update ==="
# Get current, add field to fields array
CURRENT=$(curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN")

# Use Python to modify the fields array
UPDATED=$(echo "$CURRENT" | python3 -c '
import sys, json, copy
c = json.load(sys.stdin)
# Check if currency already exists
field_names = [f["name"] for f in c["fields"]]
if "currency" not in field_names:
    import time
    new_field = {"type":"select","required":True,"name":"currency","id":"sel" + str(int(time.time())),"system":False,"values":["BRL","USD","EUR","GBP","ARS","CLP"],"max":None,"options":{"values":["BRL","USD","EUR","GBP","ARS","CLP"]}}
    c["fields"].append(new_field)
if "original_amount" not in field_names:
    import time
    orig_field = {"type":"number","required":False,"name":"original_amount","id":"num" + str(int(time.time())+1),"system":False,"min":None,"max":None}
    c["fields"].append(orig_field)
print(json.dumps(c))
')

echo "Patching..."
PATCH_RESULT=$(curl -s -X PATCH "http://localhost:8091/api/collections/transactions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$UPDATED")
echo "$PATCH_RESULT" | python3 -c 'import sys,json; c=json.load(sys.stdin); print(json.dumps(c.get("fields",[]),indent=2))' 2>/dev/null | grep -E "name|type|values" | head -20

echo "=== Verify ==="
curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; c=json.load(sys.stdin); print([(f["name"],f["type"]) for f in c.get("fields",[])])'

echo "DONE"