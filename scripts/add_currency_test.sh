#!/bin/bash
set -x
AUTH=$(curl -sf http://localhost:8091/api/collections/_superusers/auth-with-password -H "Content-Type: application/json" -d '{"identity":"welloliver@gmail.com","password":"53525341"}')
TOKEN=$(echo "$AUTH" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
echo "TOKEN_OK: ${TOKEN:0:20}"
CID=$(curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
echo "CID=$CID"
RESULT=$(curl -s -X POST "http://localhost:8091/api/collections/$CID/fields" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"test_field","type":"text","required":false}')
echo "TEST_FIELD_RESULT=$RESULT"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:8091/api/collections/$CID/fields" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"currency","type":"select","required":true,"options":{"values":["BRL","USD","EUR","GBP","ARS","CLP"]}}')
echo "CURRENCY_HTTP_CODE=$HTTP_CODE"
curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; print([f["name"] for f in json.load(sys.stdin)["fields"]])'
echo "DONE"