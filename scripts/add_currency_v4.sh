#!/bin/bash
set -e
echo "=== Auth ==="
AUTH=$(curl -sf http://localhost:8091/api/collections/_superusers/auth-with-password -H "Content-Type: application/json" -d '{"identity":"welloliver@gmail.com","password":"53525341"}')
TOKEN=$(echo "$AUTH" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

echo "=== Getting transactions ==="
COLDATA=$(curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN")

echo "=== Patching with fields added ==="
RESULT=$(echo "$COLDATA" | python3 -c 'import sys,json; c=json.load(sys.stdin); c["fields"].append({"type":"select","required":True,"name":"currency","system":False,"values":["BRL","USD","EUR","GBP","ARS","CLP"],"options":{"values":["BRL","USD","EUR","GBP","ARS","CLP"]}}); c["fields"].append({"type":"number","required":False,"name":"original_amount","system":False}); import json; print(json.dumps(c))')

# Save to temp file to avoid shell escaping issues
echo "$RESULT" > /tmp/patched_collection.json

echo "Doing PATCH..."
HTTP_CODE=$(curl -s -o /tmp/patch_result.json -w "%{http_code}" -X PATCH "http://localhost:8091/api/collections/transactions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d @/tmp/patched_collection.json)
echo "HTTP code: $HTTP_CODE"
cat /tmp/patch_result.json | python3 -m json.tool 2>/dev/null | head -20

echo "=== Verify ==="
curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; c=json.load(sys.stdin); print([(f["name"],f["type"]) for f in c.get("fields",[])])'
echo "DONE"