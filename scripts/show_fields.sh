#!/bin/bash
AUTH=$(curl -sf http://localhost:8091/api/collections/_superusers/auth-with-password -H "Content-Type: application/json" -d '{"identity":"welloliver@gmail.com","password":"53525341"}')
TOKEN=$(echo "$AUTH" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
curl -sf http://localhost:8091/api/collections/transactions -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; c=json.load(sys.stdin); print(json.dumps(c["fields"], indent=2))'