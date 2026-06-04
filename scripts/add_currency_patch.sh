#!/bin/bash
echo "=== Getting auth token ==="
AUTH=$(curl -sf http://localhost:8091/api/collections/_superusers/auth-with-password -H "Content-Type: application/json" -d '{"identity":"welloliver@gmail.com","password":"53525341"}')
TOKEN=$(echo "$AUTH" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
echo "Token OK"

echo "=== Getting transactions collection ==="
COLDATA=$(curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN")
echo "$COLDATA" | python3 -c 'import sys,json; c=json.load(sys.stdin); print("ID:", c["id"]); print("Fields:", [f["name"] for f in c.get("schema", [])])'

# Add currency field to schema
echo "=== Adding currency field ==="
UPDATED=$(echo "$COLDATA" | python3 -c '
import sys,json
c = json.load(sys.stdin)
new_field = {"name":"currency","type":"select","required":true,"options":{"values":["BRL","USD","EUR","GBP","ARS","CLP"]}}
c["schema"].append(new_field)
# Also add original_amount
orig_field = {"name":"original_amount","type":"number","required":false}
c["schema"].append(orig_field)
print(json.dumps(c))
')

PATCH_RESULT=$(curl -s -X PATCH "http://localhost:8091/api/collections/transactions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$UPDATED")
echo "PATCH status: $(echo "$PATCH_RESULT" | python3 -c 'import sys,json; c=json.load(sys.stdin); print(c.get("statusCode", 200), c.get("message","OK"))' 2>/dev/null || echo "OK")"

echo "=== Verify fields ==="
curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; c=json.load(sys.stdin); print([(f["name"],f["type"]) for f in c.get("schema", [])])'

echo "=== Now updating recurring_transactions ==="
RECDATA=$(curl -sf http://localhost:8091/api/collections/recurring_transactions -H "Authorization: Bearer $TOKEN")
REC_UPDATED=$(echo "$RECDATA" | python3 -c '
import sys,json
c = json.load(sys.stdin)
new_field = {"name":"currency","type":"select","required":true,"options":{"values":["BRL","USD","EUR","GBP","ARS","CLP"]}}
c["schema"].append(new_field)
print(json.dumps(c))
')
curl -s -X PATCH "http://localhost:8091/api/collections/recurring_transactions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$REC_UPDATED" | python3 -c 'import sys,json; c=json.load(sys.stdin); print("Status:", c.get("statusCode", 200))' 2>/dev/null || echo "Recurring OK"

echo "=== FINAL VERIFY ==="
curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; c=json.load(sys.stdin); print([(f["name"],f["type"]) for f in c.get("schema", [])])'
curl -sf http://localhost:8091/api/collections/recurring_transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; c=json.load(sys.stdin); print([(f["name"],f["type"]) for f in c.get("schema", [])])'
echo "DONE"