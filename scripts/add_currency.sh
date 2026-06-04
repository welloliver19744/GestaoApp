#!/bin/bash
AUTH=$(curl -sf http://localhost:8091/api/collections/_superusers/auth-with-password -H "Content-Type: application/json" -d '{"identity":"welloliver@gmail.com","password":"53525341"}')
TOKEN=$(echo "$AUTH" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
CID=$(curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
echo "Adding currency to $CID"
curl -sf -X POST "http://localhost:8091/api/collections/$CID/fields" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"currency","type":"select","required":true,"options":{"values":["BRL","USD","EUR","GBP","ARS","CLP"]}}'
curl -sf -X POST "http://localhost:8091/api/collections/$CID/fields" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"original_amount","type":"number","required":false}'
CID2=$(curl -sf http://localhost:8091/api/collections/recurring_transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
curl -sf -X POST "http://localhost:8091/api/collections/$CID2/fields" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"currency","type":"select","required":true,"options":{"values":["BRL","USD","EUR","GBP","ARS","CLP"]}}'
echo "Verifying..."
curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; print([f["name"] for f in json.load(sys.stdin)["fields"]])'
echo "DONE"